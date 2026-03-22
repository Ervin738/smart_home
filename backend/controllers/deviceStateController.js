// 设备状态控制器 - 负责各设备子类型状态的读取与持久化，处理驼峰/下划线字段映射
const { getDeviceState, upsertDeviceState, DEVICE_STATE_SCHEMAS } = require('../models/DeviceState')
const Device = require('../models/Device')

/**
 * 从设备的 extra 字段中提取 sub_type
 * extra 中存的是 lightType / environmentType / kitchenType 等
 */
function extractSubType(device) {
  const extra = device.extra || {}
  return (
    extra.lightType ||
    extra.environmentType ||
    extra.kitchenType ||
    extra.bathroomType ||
    extra.cleanerType ||
    extra.entertainmentType ||
    extra.personalType ||
    extra.securityType ||
    extra.networkType ||
    extra.switchType ||
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

    const subType = extractSubType(device)
    if (!subType || !DEVICE_STATE_SCHEMAS[subType]) {
      return res.json({ deviceId, subType, state: null })
    }

    let state = await getDeviceState(deviceId, subType)

    // snake_case -> 前端驼峰字段映射
    const snakeToCamel = {
      toilet: {
        water_temp:      'toiletWaterTemp',
        seat_temp:       'toiletSeatTemp',
        air_temp:        'toiletAirTemp',
        water_strength:  'toiletWaterStrength',
        nozzle_position: 'toiletNozzlePosition',
        lid_open:        'toiletLidOpen',
        wash_mode:       'toiletWashMode',
        dry_mode:        'toiletDryMode',
        reciprocate:     'toiletReciprocate',
      },
    }
    const mapping = snakeToCamel[subType]
    if (state && mapping) {
      const mapped = {}
      for (const [k, v] of Object.entries(state)) {
        const camelKey = mapping[k] ?? k
        // TINYINT boolean 字段转换
        if (camelKey === 'toiletLidOpen' || camelKey === 'toiletDryMode' || camelKey === 'toiletReciprocate') {
          mapped[camelKey] = Boolean(v)
        } else {
          mapped[camelKey] = v
        }
      }
      state = mapped
    }

    res.json({ deviceId, subType, state })
  } catch (err) {
    console.error('[deviceStateController] getState error:', err)
    res.status(500).json({ error: err.message })
  }
}

/**
 * PATCH /api/devices/:id/state
 * Body: { subType?: string, ...fields }
 */
async function updateState(req, res) {
  try {
    const deviceId = parseInt(req.params.id)
    let { subType, ...fields } = req.body

    if (!subType) {
      const device = await Device.findById(deviceId)
      if (!device) return res.status(404).json({ error: 'Device not found' })
      subType = extractSubType(device)
    }

    if (!subType || !DEVICE_STATE_SCHEMAS[subType]) {
      return res.status(400).json({ error: `Unknown or unsupported device subType: ${subType}` })
    }

    // 前端驼峰字段 -> 后端 snake_case 字段映射（按设备类型）
    const camelToSnake = {
      toilet: {
        toiletWaterTemp:      'water_temp',
        toiletSeatTemp:       'seat_temp',
        toiletAirTemp:        'air_temp',
        toiletWaterStrength:  'water_strength',
        toiletNozzlePosition: 'nozzle_position',
        toiletLidOpen:        'lid_open',
        toiletWashMode:       'wash_mode',
        toiletDryMode:        'dry_mode',
        toiletReciprocate:    'reciprocate',
      },
    }
    const mapping = camelToSnake[subType]
    if (mapping) {
      const mapped = {}
      for (const [k, v] of Object.entries(fields)) {
        const snakeKey = mapping[k] ?? k
        // boolean -> TINYINT
        if (snakeKey === 'lid_open' || snakeKey === 'dry_mode' || snakeKey === 'reciprocate') {
          mapped[snakeKey] = v ? 1 : 0
        } else {
          mapped[snakeKey] = v
        }
      }
      fields = mapped
    }

    // 只保留该表实际存在的字段（过滤掉无关 extra 字段）
    const knownFields = {
      toilet: ['water_temp', 'seat_temp', 'air_temp', 'water_strength', 'nozzle_position', 'lid_open', 'wash_mode', 'dry_mode', 'reciprocate'],
    }
    if (knownFields[subType]) {
      const allowed = new Set(knownFields[subType])
      fields = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.has(k)))
    }

    if (Object.keys(fields).length === 0) {
      const state = await getDeviceState(deviceId, subType)
      return res.json({ deviceId, subType, state })
    }

    await upsertDeviceState(deviceId, subType, fields)
    const state = await getDeviceState(deviceId, subType)
    res.json({ deviceId, subType, state })
  } catch (err) {
    console.error('[deviceStateController] updateState error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getState, updateState }
