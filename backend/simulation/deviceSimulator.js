const Device = require('../models/Device');

// Default initial states per device type
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
    this._mqtt   = null; // mqttService reference
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  /** Load all devices from DB into memory */
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

  // ─── Tick logic per device type ────────────────────────────────────────────

  _tickAc(device) {
    const s = device.status;
    if (!s.power) return false;

    const diff = s.targetTemp - s.currentTemp;
    if (Math.abs(diff) < 0.1) return false;

    // Move currentTemp 0.2°C per tick toward targetTemp
    s.currentTemp = parseFloat(
      (s.currentTemp + Math.sign(diff) * 0.2).toFixed(2)
    );
    return true;
  }

  _tickCurtain(device) {
    const s = device.status;
    const target = s.open ? 100 : 0;
    if (s.position === target) return false;

    // Move 5% per tick
    const step = s.open ? 5 : -5;
    s.position = Math.min(100, Math.max(0, s.position + step));
    return true;
  }

  /** Run one simulation tick across all devices */
  _tick() {
    for (const device of this.devices.values()) {
      let changed = false;

      if (device.type === 'ac')      changed = this._tickAc(device);
      if (device.type === 'curtain') changed = this._tickCurtain(device);

      if (changed) {
        // Persist to DB
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

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Start the simulation loop.
   * @param {object} io       - Socket.IO instance
   * @param {object} mqtt     - mqttService instance
   * @param {number} interval - Tick interval in ms (default 1000)
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
   * Apply a control action to a device.
   * @param {number} deviceId
   * @param {object} action  - Partial status fields to merge, e.g. { power: true, volume: 30 }
   * @returns {object|null}  Updated status, or null if device not found
   */
  updateState(deviceId, action) {
    const device = this.devices.get(Number(deviceId));
    if (!device) return null;

    // Validate type-specific constraints
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
      // Derive position target from open flag
      if (action.open !== undefined) merged.position = s.position; // let tick handle movement
    }

    device.status = merged;

    // Persist immediately
    Device.update(deviceId, {
      name:     device.name,
      type:     device.type,
      status:   merged,
    }).catch(err => console.error('[Simulator] DB update error:', err));

    return merged;
  }

  /**
   * Register a newly created device into the simulator at runtime.
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
   * Remove a device from the simulator.
   * @param {number} deviceId
   */
  unregister(deviceId) {
    this.devices.delete(Number(deviceId));
  }

  /**
   * Get current in-memory status of a device.
   * @param {number} deviceId
   * @returns {object|null}
   */
  getDeviceStatus(deviceId) {
    const device = this.devices.get(Number(deviceId));
    return device ? { ...device.status } : null;
  }

  /** Return all device states as a plain array */
  getAllStatuses() {
    return Array.from(this.devices.values()).map(d => ({
      id:     d.id,
      name:   d.name,
      type:   d.type,
      status: { ...d.status },
    }));
  }
}

// Export a singleton instance
module.exports = new DeviceSimulator();
