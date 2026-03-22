const mqtt = require('mqtt');
const simulator = require('../simulation/deviceSimulator');
const Device = require('../models/Device');
const Log = require('../models/Log');

const TOPIC_STATUS  = 'device/status';   // devices report state here
const TOPIC_CONTROL = 'device/control';  // server sends commands here

let client = null;

/**
 * Connect to the MQTT broker and subscribe to device status reports.
 * @param {object} io - Socket.IO instance (optional, for real-time push)
 */
function init(io = null) {
  const url = process.env.MQTT_URL;
  if (!url) {
    console.warn('[MQTT] MQTT_URL not set, skipping MQTT init.');
    return;
  }

  client = mqtt.connect(url, { reconnectPeriod: 5000 });

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

    const { deviceId, newStatus } = data;
    if (!deviceId || !newStatus) {
      console.warn('[MQTT] Missing deviceId or newStatus in payload.');
      return;
    }

    // 1. Update simulator in-memory state
    const updated = simulator.updateState(deviceId, newStatus);
    if (!updated) {
      console.warn(`[MQTT] Device ${deviceId} not found in simulator.`);
      return;
    }

    // 2. Log the action
    await Log.create({ action: `mqtt_report:device_${deviceId}`, deviceId })
      .catch(err => console.error('[MQTT] Log error:', err.message));

    // 3. Push to frontend via Socket.IO
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
 * Publish a control command to a device.
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
 * Publish a device status report (used by simulator to mimic real device behaviour).
 * @param {number} deviceId
 * @param {object} newStatus
 */
function publishStatus(deviceId, newStatus) {
  if (!client || !client.connected) return;
  const payload = JSON.stringify({ deviceId, newStatus });
  client.publish(TOPIC_STATUS, payload, { qos: 0 });
}

module.exports = { init, publishControl, publishStatus };
