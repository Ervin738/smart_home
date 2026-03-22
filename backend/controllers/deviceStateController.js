// 设备状态控制器 - 按设备子类型路由到对应状态表
const { getDeviceState, upsertDeviceState } = require('../models/DeviceState')
const Device = require('../models/Device')

/** 从 device 行中解析子类型，e.g. 'table-lamp', 'air-conditioner' */
function resolveSubType(device) {
  const extra = typeof device.extra === 'string'
    ? JSON.parse(device.extra)
    : (device.extra ?? {})
  return (
    extra.lightType       ||
    extra.switchType      ||
    extra.cleanerType     ||
    extra.securityType    ||
    extra.environmentType ||
    extra.personalType    ||
    extra.bathroomType    ||
    extra.kitchenType     ||
    extra.networkType     ||
    extra.entertainmentType ||
    extra.otherType       ||
    null
  )
}

/**
 * GET /api/devices/:id/state
 */
async function getState(req, res) {
  try {
    const deviceId = parseInt(req.params.id)
    const device = await Device.findById(deviceId)
    if (!device) return res.status(404).json({ error: 'Device not found' })

    const subType = resolveSubType(device)
    if (!subType) return res.json({ deviceId, state: null })

    const state = await getDeviceState(deviceId, subType)
    res.json({ deviceId, state })
  } catch (err) {
    console.error('[deviceStateController] getState error:', err)
    res.status(500).json({ error: err.message })
  }
}

/**
 * PATCH /api/devices/:id/state
 * Body: 任意设备状态字段（camelCase）
 */
async function updateState(req, res) {
  try {
    const deviceId = parseInt(req.params.id)
    const device = await Device.findById(deviceId)
    if (!device) return res.status(404).json({ error: 'Device not found' })

    const subType = resolveSubType(device)
    if (!subType) return res.status(400).json({ error: 'Cannot determine device sub-type' })

    const fields = req.body
    if (Object.keys(fields).length > 0) {
      await upsertDeviceState(deviceId, subType, fields)
    }

    const state = await getDeviceState(deviceId, subType)
    res.json({ deviceId, state })
  } catch (err) {
    console.error('[deviceStateController] updateState error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getState, updateState }
