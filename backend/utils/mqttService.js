// MQTT 服务 - 连接 MQTT Broker，订阅设备状态上报并下发控制指令
const mqtt = require('mqtt');
const simulator = require('../simulation/deviceSimulator');
const Device = require('../models/Device');
const Log = require('../models/Log');

const TOPIC_STATUS  = 'device/status';   // 设备上报状态
const TOPIC_CONTROL = 'device/control';  // 服务器下发控制指令

let client = null;
let clientId = null;

/**
 * 连接 MQTT Broker 并订阅设备状态上报
 * @param {object} io - Socket.IO 实例（可选，用于实时推送）
 */
function init(io = null) {
  const url = process.env.MQTT_URL;
  if (!url) {
    console.warn('[MQTT] MQTT_URL not set, skipping MQTT init.');
    return;
  }

  clientId = `server-${Date.now()}`;
  client = mqtt.connect(url, { reconnectPeriod: 30000, clientId });

  client.on('connect', () => {
    console.log(`[MQTT] Connected to broker: ${url}`);
    client.subscribe(TOPIC_STATUS, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err.message);
      else console.log(`[MQTT] Subscribed to "${TOPIC_STATUS}"`);
    });
  });

  client.on('message', async (topic, payload) => {
    if (topic !== TOPIC_STATUS) return;

    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch {
      console.warn('[MQTT] Invalid JSON payload:', payload.toString());
      return;
    }

    const { deviceId, newStatus, _from } = data;
    // 忽略自己发出的消息，避免回环
    if (_from === clientId) return;
    if (!deviceId || !newStatus) {
      console.warn('[MQTT] Missing deviceId or newStatus in payload.');
      return;
    }

    // 更新模拟器内存状态
    const updated = simulator.updateState(deviceId, newStatus);
    if (!updated) {
      console.warn(`[MQTT] Device ${deviceId} not found in simulator.`);
      return;
    }

    // 记录操作日志
    await Log.create({ action: `mqtt_report:device_${deviceId}`, deviceId })
      .catch(err => console.error('[MQTT] Log error:', err.message));

    // 通过 Socket.IO 推送给前端
    if (io) {
      io.emit('device:statusChanged', { deviceId, status: updated });
    }

    console.log(`[MQTT] State updated for device ${deviceId}:`, updated);
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
  client.on('offline', () => console.warn('[MQTT] Client offline.'));
}

/**
 * 向设备下发控制指令
 * @param {number} deviceId
 * @param {object} action
 */
function publishControl(deviceId, action) {
  if (!client || !client.connected) {
    console.warn('[MQTT] Cannot publish: client not connected.');
    return;
  }
  const payload = JSON.stringify({ deviceId, action });
  client.publish(TOPIC_CONTROL, payload, { qos: 1 }, (err) => {
    if (err) console.error('[MQTT] Publish error:', err.message);
    else console.log(`[MQTT] Published control for device ${deviceId}:`, action);
  });
}

/**
 * 上报设备状态（模拟器用于模拟真实设备行为）
 * @param {number} deviceId
 * @param {object} newStatus
 */
function publishStatus(deviceId, newStatus) {
  if (!client || !client.connected) return;
  const payload = JSON.stringify({ deviceId, newStatus, _from: clientId });
  client.publish(TOPIC_STATUS, payload, { qos: 0 });
}

module.exports = { init, publishControl, publishStatus };
