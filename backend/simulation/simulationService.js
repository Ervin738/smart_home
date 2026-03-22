// 场景执行服务 - 批量应用场景规则，委托模拟器更新设备状态并记录操作日志
// 所有状态变更通过 DeviceSimulator 单例处理，保证内存状态与数据库一致
// 规则格式：{ deviceId: number, status: object }
const simulator = require('./deviceSimulator');
const Log = require('../models/Log');

/**
 * @param {Array}  rules  - 规则数组，每项格式 { deviceId, status }
 * @param {object} io     - Socket.IO 实例（可选）
 * @returns {Promise<Array>} 执行结果数组
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
