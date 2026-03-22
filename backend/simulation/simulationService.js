/**
 * Scene execution service.
 * Delegates state changes to the DeviceSimulator singleton so all updates
 * go through the same in-memory state machine and are persisted consistently.
 *
 * Each rule shape: { deviceId: number, status: object }
 */
const simulator = require('./deviceSimulator');
const Log = require('../models/Log');

/**
 * @param {Array}  rules  - Array of { deviceId, status }
 * @param {object} io     - Socket.IO server instance (optional)
 * @returns {Promise<Array>} results
 */
async function applySceneRules(rules, io = null) {
  const results = [];

  for (const rule of rules) {
    const { deviceId, status } = rule;

    const updated = simulator.updateState(deviceId, status);
    if (!updated) {
      results.push({ deviceId, success: false, error: 'Device not found' });
      continue;
    }

    await Log.create({ action: `scene_trigger:device_${deviceId}`, deviceId });

    if (io) {
      io.emit('device:statusChanged', { deviceId, status: updated });
    }

    results.push({ deviceId, success: true, status: updated });
  }

  return results;
}

module.exports = { applySceneRules };
