// 设备模拟器 - 维护设备内存状态，模拟 AC 温度变化和窗帘移动，并通过 MQTT/Socket.IO 推送状态更新
const Device = require('../models/Device');

// 各设备类型的默认初始状态
const DEFAULT_STATE = {
  tv:      { power: false, channel: 1, volume: 20 },
  ac:      { power: false, mode: 'cool', targetTemp: 26, currentTemp: 30 },
  light:   { power: false, brightness: 100, color: '#ffffff' },
  curtain: { open: false, position: 0 },
  camera:  { power: false, recording: false, motion: false },
};

class DeviceSimulator {
  constructor() {
    this.devices = new Map();
    this._timer  = null;
    this._io     = null;
    this._mqtt   = null; // mqttService 引用
  }

  // ─── 初始化 ────────────────────────────────────────────────────────────────

  /** 从数据库加载所有设备到内存 */
  async load() {
    const rows = await Device.findAll();
    for (const row of rows) {
      const status = typeof row.status === 'string'
        ? JSON.parse(row.status)
        : (row.status ?? {});
      const defaults = DEFAULT_STATE[row.type] ?? {};
      this.devices.set(row.id, {
        id:   row.id,
        name: row.name,
        type: row.type,
        status: { ...defaults, ...status },
      });
    }
    console.log(`[Simulator] Loaded ${this.devices.size} device(s).`);
  }

  // ─── 各设备类型的 Tick 逻辑 ────────────────────────────────────────────────

  _tickAc(device) {
    const s = device.status;
    if (!s.power) return false;

    const diff = s.targetTemp - s.currentTemp;
    if (Math.abs(diff) < 0.1) return false;

    // 每次 tick 向目标温度移动 0.2°C
    s.currentTemp = parseFloat(
      (s.currentTemp + Math.sign(diff) * 0.2).toFixed(2)
    );
    return true;
  }

  _tickCurtain(device) {
    const s = device.status;
    const target = s.open ? 100 : 0;
    if (s.position === target) return false;

    // 每次 tick 移动 5%
    const step = s.open ? 5 : -5;
    s.position = Math.min(100, Math.max(0, s.position + step));
    return true;
  }

  /** 对所有设备执行一次模拟 tick */
  _tick() {
    for (const device of this.devices.values()) {
      let changed = false;

      if (device.type === 'ac')      changed = this._tickAc(device);
      if (device.type === 'curtain') changed = this._tickCurtain(device);

      if (changed) {
        // 持久化到数据库
        Device.update(device.id, {
          name:     device.name,
          type:     device.type,
          location: device.location,
          extra:    device.extra,
          status:   device.status,
        }).catch(err => console.error('[Simulator] DB update error:', err));

        // 1. 仿真器通过 MQTT 上报状态（模拟真实设备行为）
        if (this._mqtt) {
          this._mqtt.publishStatus(device.id, device.status);
        }

        // 2. 直接推 Socket.IO（MQTT 回环有延迟时的备用）
        if (this._io) {
          this._io.emit('device:statusChanged', {
            deviceId: device.id,
            status:   device.status,
          });
        }
      }
    }
  }

  // ─── 公共 API ──────────────────────────────────────────────────────────────

  /**
   * 启动模拟循环
   * @param {object} io       - Socket.IO 实例
   * @param {object} mqtt     - mqttService 实例
   * @param {number} interval - tick 间隔毫秒数（默认 1000）
   */
  start(io = null, mqtt = null, interval = 1000) {
    if (this._timer) return;
    this._io   = io;
    this._mqtt = mqtt;
    this._timer = setInterval(() => this._tick(), interval);
    console.log('[Simulator] Started.');
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      console.log('[Simulator] Stopped.');
    }
  }

  /**
   * 对设备应用控制指令
   * @param {number} deviceId
   * @param {object} action  - 要合并的状态字段，如 { power: true, volume: 30 }
   * @returns {object|null}  更新后的状态，设备不存在时返回 null
   */
  updateState(deviceId, action) {
    const device = this.devices.get(Number(deviceId));
    if (!device) return null;

    // 校验各设备类型的约束条件
    const s = device.status;
    const merged = { ...s, ...action };

    if (device.type === 'tv') {
      if (merged.volume !== undefined) merged.volume = Math.min(100, Math.max(0, merged.volume));
      if (merged.channel !== undefined) merged.channel = Math.max(1, merged.channel);
    }
    if (device.type === 'ac') {
      if (merged.targetTemp !== undefined) merged.targetTemp = Math.min(30, Math.max(16, merged.targetTemp));
      if (!['cool', 'heat', 'fan', 'auto'].includes(merged.mode)) merged.mode = s.mode;
    }
    if (device.type === 'curtain') {
      // 由 open 标志推导目标位置，实际移动交给 tick 处理
      if (action.open !== undefined) merged.position = s.position;
    }

    device.status = merged;

    // 立即持久化到数据库
    Device.update(deviceId, {
      name:     device.name,
      type:     device.type,
      status:   merged,
    }).catch(err => console.error('[Simulator] DB update error:', err));

    return merged;
  }

  /**
   * 运行时注册新创建的设备到模拟器
   * @param {{ id, name, type, status }} device
   */
  register(device) {
    const defaults = DEFAULT_STATE[device.type] ?? {};
    this.devices.set(device.id, {
      id:     device.id,
      name:   device.name,
      type:   device.type,
      status: { ...defaults, ...(device.status ?? {}) },
    });
  }

  /**
   * 从模拟器中移除设备
   * @param {number} deviceId
   */
  unregister(deviceId) {
    this.devices.delete(Number(deviceId));
  }

  /**
   * 获取设备当前内存状态
   * @param {number} deviceId
   * @returns {object|null}
   */
  getDeviceStatus(deviceId) {
    const device = this.devices.get(Number(deviceId));
    return device ? { ...device.status } : null;
  }

  /** 以数组形式返回所有设备状态 */
  getAllStatuses() {
    return Array.from(this.devices.values()).map(d => ({
      id:     d.id,
      name:   d.name,
      type:   d.type,
      status: { ...d.status },
    }));
  }
}

// 导出单例
module.exports = new DeviceSimulator();
