// 设备状态模型 - 每个设备子类型一张独立表
const { query } = require('../utils/db')

// ─── 通用定时器列（所有表共享）────────────────────────────────────────────────
const TIMER_COLS = `
  power                      TINYINT(1) DEFAULT 0,
  timer_off_enabled          TINYINT(1) DEFAULT 0,
  timer_off_time             VARCHAR(5),
  timer_off_timestamp        BIGINT,
  timer_off_repeat           TINYINT(1) DEFAULT 0,
  timer_on_enabled           TINYINT(1) DEFAULT 0,
  timer_on_time              VARCHAR(5),
  timer_on_timestamp         BIGINT,
  timer_on_repeat            TINYINT(1) DEFAULT 0,
  countdown_enabled          TINYINT(1) DEFAULT 0,
  countdown_action           VARCHAR(3),
  countdown_end_time         BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
`

// ─── 每张表的 DDL ─────────────────────────────────────────────────────────────
const TABLES = {
  // 灯光
  'table-lamp': `CREATE TABLE IF NOT EXISTS device_state_table_lamp (
    device_id INT PRIMARY KEY,
    brightness INT DEFAULT 100,
    color_temp INT DEFAULT 4000,
    light_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'ceiling-lamp': `CREATE TABLE IF NOT EXISTS device_state_ceiling_lamp (
    device_id INT PRIMARY KEY,
    brightness INT DEFAULT 100,
    color_temp INT DEFAULT 4000,
    light_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 开关
  'socket': `CREATE TABLE IF NOT EXISTS device_state_socket (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'switch': `CREATE TABLE IF NOT EXISTS device_state_switch (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 环境
  'air-conditioner': `CREATE TABLE IF NOT EXISTS device_state_air_conditioner (
    device_id INT PRIMARY KEY,
    target_temp DECIMAL(4,1) DEFAULT 26,
    ac_mode_index INT,
    ac_fan_speed INT DEFAULT 0,
    ac_auto_mode TINYINT(1) DEFAULT 0,
    ac_wind_mode VARCHAR(20),
    ac_functions JSON,
    swing_enabled TINYINT(1) DEFAULT 0,
    swing_angle INT DEFAULT 60,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'fan': `CREATE TABLE IF NOT EXISTS device_state_fan (
    device_id INT PRIMARY KEY,
    speed_level INT DEFAULT 1,
    fan_mode_index INT DEFAULT 0,
    swing_enabled TINYINT(1) DEFAULT 0,
    swing_angle INT DEFAULT 60,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'heater': `CREATE TABLE IF NOT EXISTS device_state_heater (
    device_id INT PRIMARY KEY,
    target_temp DECIMAL(4,1) DEFAULT 22,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'humidifier': `CREATE TABLE IF NOT EXISTS device_state_humidifier (
    device_id INT PRIMARY KEY,
    humidifier_level INT DEFAULT 1,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'dehumidifier': `CREATE TABLE IF NOT EXISTS device_state_dehumidifier (
    device_id INT PRIMARY KEY,
    target_humidity INT DEFAULT 50,
    dehumidifier_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'air-purifier': `CREATE TABLE IF NOT EXISTS device_state_air_purifier (
    device_id INT PRIMARY KEY,
    purifier_mode_index INT DEFAULT 0,
    swing_enabled TINYINT(1) DEFAULT 0,
    swing_angle INT DEFAULT 60,
    brightness_level INT DEFAULT 1,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'aroma-diffuser': `CREATE TABLE IF NOT EXISTS device_state_aroma_diffuser (
    device_id INT PRIMARY KEY,
    aroma_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 卫浴
  'toilet': `CREATE TABLE IF NOT EXISTS device_state_toilet (
    device_id INT PRIMARY KEY,
    toilet_water_temp INT DEFAULT 3,
    toilet_seat_temp INT DEFAULT 3,
    toilet_air_temp INT DEFAULT 3,
    toilet_water_strength INT DEFAULT 3,
    toilet_nozzle_position INT DEFAULT 3,
    toilet_lid_open TINYINT(1) DEFAULT 0,
    toilet_wash_mode VARCHAR(20),
    toilet_dry_mode TINYINT(1) DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'water-heater': `CREATE TABLE IF NOT EXISTS device_state_water_heater (
    device_id INT PRIMARY KEY,
    target_temp DECIMAL(4,1) DEFAULT 45,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'yuba': `CREATE TABLE IF NOT EXISTS device_state_yuba (
    device_id INT PRIMARY KEY,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    light_delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    light_delay_shutdown_duration INT,
    light_delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 厨房
  'rice-cooker': `CREATE TABLE IF NOT EXISTS device_state_rice_cooker (
    device_id INT PRIMARY KEY,
    rice_cooker_cooking TINYINT(1) DEFAULT 0,
    rice_cooker_cooking_end_time BIGINT,
    rice_cooker_mode_name VARCHAR(50),
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'induction-cooker': `CREATE TABLE IF NOT EXISTS device_state_induction_cooker (
    device_id INT PRIMARY KEY,
    induction_cooker_mode_index INT DEFAULT 0,
    induction_cooker_power INT DEFAULT 1000,
    induction_cooking_mode INT DEFAULT -1,
    induction_is_cooking TINYINT(1) DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'range-hood': `CREATE TABLE IF NOT EXISTS device_state_range_hood (
    device_id INT PRIMARY KEY,
    range_hood_speed_level INT DEFAULT 1,
    range_hood_delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    range_hood_left_burner_on TINYINT(1) DEFAULT 0,
    range_hood_right_burner_on TINYINT(1) DEFAULT 0,
    range_hood_light_enabled TINYINT(1) DEFAULT 0,
    range_hood_current_level INT DEFAULT -1,
    range_hood_device_type_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'electric-kettle': `CREATE TABLE IF NOT EXISTS device_state_electric_kettle (
    device_id INT PRIMARY KEY,
    electric_kettle_heating TINYINT(1) DEFAULT 0,
    electric_kettle_keeping_warm TINYINT(1) DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'air-fryer': `CREATE TABLE IF NOT EXISTS device_state_air_fryer (
    device_id INT PRIMARY KEY,
    air_fryer_cooking TINYINT(1) DEFAULT 0,
    air_fryer_cooking_time INT,
    air_fryer_mode_id INT,
    air_fryer_mode_name VARCHAR(50),
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'water-dispenser': `CREATE TABLE IF NOT EXISTS device_state_water_dispenser (
    device_id INT PRIMARY KEY,
    water_dispenser_current_temp DECIMAL(4,1) DEFAULT 15,
    water_dispenser_target_temp DECIMAL(4,1),
    water_dispenser_keep_warm_temp DECIMAL(4,1),
    water_dispenser_heating TINYINT(1) DEFAULT 0,
    water_dispenser_keeping_warm TINYINT(1) DEFAULT 0,
    water_dispenser_selected_water_type VARCHAR(30) DEFAULT 'tap-water',
    water_dispenser_keep_warm_enabled TINYINT(1) DEFAULT 0,
    water_dispenser_fan_cooling_enabled TINYINT(1) DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 清洁
  'washing-machine': `CREATE TABLE IF NOT EXISTS device_state_washing_machine (
    device_id INT PRIMARY KEY,
    washing_machine_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'dryer': `CREATE TABLE IF NOT EXISTS device_state_dryer (
    device_id INT PRIMARY KEY,
    dryer_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'robot-vacuum': `CREATE TABLE IF NOT EXISTS device_state_robot_vacuum (
    device_id INT PRIMARY KEY,
    robot_vacuum_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'clothes-rack': `CREATE TABLE IF NOT EXISTS device_state_clothes_rack (
    device_id INT PRIMARY KEY,
    rack_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 影音
  'tv': `CREATE TABLE IF NOT EXISTS device_state_tv (
    device_id INT PRIMARY KEY,
    tv_volume INT DEFAULT 20,
    tv_mode_index INT DEFAULT 0,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'speaker': `CREATE TABLE IF NOT EXISTS device_state_speaker (
    device_id INT PRIMARY KEY,
    speaker_volume INT DEFAULT 50,
    speaker_mode_index INT DEFAULT 0,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'projector': `CREATE TABLE IF NOT EXISTS device_state_projector (
    device_id INT PRIMARY KEY,
    projector_mode_index INT DEFAULT 0,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'clock': `CREATE TABLE IF NOT EXISTS device_state_clock (
    device_id INT PRIMARY KEY,
    alarm_enabled TINYINT(1) DEFAULT 0,
    alarm_time VARCHAR(5),
    alarm_timestamp BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 个护
  'smart-bed': `CREATE TABLE IF NOT EXISTS device_state_smart_bed (
    device_id INT PRIMARY KEY,
    back_angle INT DEFAULT 0,
    leg_angle INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'smart-pillow': `CREATE TABLE IF NOT EXISTS device_state_smart_pillow (
    device_id INT PRIMARY KEY,
    pillow_auto_mode INT DEFAULT 0,
    pillow_heating_mode INT DEFAULT 0,
    pillow_time_adjust INT DEFAULT 15,
    pillow_gear_level INT DEFAULT 1,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'electric-blanket': `CREATE TABLE IF NOT EXISTS device_state_electric_blanket (
    device_id INT PRIMARY KEY,
    blanket_area_a_level INT DEFAULT 0,
    blanket_area_b_level INT DEFAULT 0,
    blanket_selected_zone INT DEFAULT 0,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'window-opener': `CREATE TABLE IF NOT EXISTS device_state_window_opener (
    device_id INT PRIMARY KEY,
    window_opener_position INT DEFAULT 0,
    window_opener_mode_index INT DEFAULT 0,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 安防
  'camera': `CREATE TABLE IF NOT EXISTS device_state_camera (
    device_id INT PRIMARY KEY,
    delay_shutdown_enabled TINYINT(1) DEFAULT 0,
    delay_shutdown_duration INT,
    delay_shutdown_end_time BIGINT,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'door-lock': `CREATE TABLE IF NOT EXISTS device_state_door_lock (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'smart-door': `CREATE TABLE IF NOT EXISTS device_state_smart_door (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,

  // 网络
  'router': `CREATE TABLE IF NOT EXISTS device_state_router (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'gateway': `CREATE TABLE IF NOT EXISTS device_state_gateway (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
  'wifi-extender': `CREATE TABLE IF NOT EXISTS device_state_wifi_extender (
    device_id INT PRIMARY KEY,
    ${TIMER_COLS},
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )`,
}

// 子类型 → 表名映射
const TABLE_NAME = {
  'table-lamp':       'device_state_table_lamp',
  'ceiling-lamp':     'device_state_ceiling_lamp',
  'socket':           'device_state_socket',
  'switch':           'device_state_switch',
  'air-conditioner':  'device_state_air_conditioner',
  'fan':              'device_state_fan',
  'heater':           'device_state_heater',
  'humidifier':       'device_state_humidifier',
  'dehumidifier':     'device_state_dehumidifier',
  'air-purifier':     'device_state_air_purifier',
  'aroma-diffuser':   'device_state_aroma_diffuser',
  'toilet':           'device_state_toilet',
  'water-heater':     'device_state_water_heater',
  'yuba':             'device_state_yuba',
  'rice-cooker':      'device_state_rice_cooker',
  'induction-cooker': 'device_state_induction_cooker',
  'range-hood':       'device_state_range_hood',
  'electric-kettle':  'device_state_electric_kettle',
  'air-fryer':        'device_state_air_fryer',
  'water-dispenser':  'device_state_water_dispenser',
  'washing-machine':  'device_state_washing_machine',
  'dryer':            'device_state_dryer',
  'robot-vacuum':     'device_state_robot_vacuum',
  'clothes-rack':     'device_state_clothes_rack',
  'tv':               'device_state_tv',
  'speaker':          'device_state_speaker',
  'projector':        'device_state_projector',
  'clock':            'device_state_clock',
  'smart-bed':        'device_state_smart_bed',
  'smart-pillow':     'device_state_smart_pillow',
  'electric-blanket': 'device_state_electric_blanket',
  'window-opener':    'device_state_window_opener',
  'camera':           'device_state_camera',
  'door-lock':        'device_state_door_lock',
  'smart-door':       'device_state_smart_door',
  'router':           'device_state_router',
  'gateway':          'device_state_gateway',
  'wifi-extender':    'device_state_wifi_extender',
}

// camelCase → snake_case
function toSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

// snake_case → camelCase
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

async function initDeviceStateTables() {
  // 删除旧单表（如果存在）
  try { await query('DROP TABLE IF EXISTS device_states') } catch (_) {}
  // 建所有子类型表
  for (const ddl of Object.values(TABLES)) {
    await query(ddl)
  }
  console.log('device_states 分表初始化完成')
}

/**
 * 根据设备子类型获取状态
 * @param {number} deviceId
 * @param {string} subType  e.g. 'table-lamp', 'air-conditioner'
 */
async function getDeviceState(deviceId, subType) {
  const table = TABLE_NAME[subType]
  if (!table) return null
  const rows = await query(`SELECT * FROM ${table} WHERE device_id = ?`, [deviceId])
  if (!rows[0]) return null
  // snake_case → camelCase，过滤 device_id / updated_at
  const row = rows[0]
  const result = {}
  for (const [k, v] of Object.entries(row)) {
    if (k === 'device_id' || k === 'updated_at') continue
    // JSON 列直接用
    result[toCamel(k)] = v
  }
  return result
}

/**
 * 插入或更新设备状态
 * @param {number} deviceId
 * @param {string} subType
 * @param {object} fields  camelCase 字段
 */
async function upsertDeviceState(deviceId, subType, fields) {
  const table = TABLE_NAME[subType]
  if (!table) return

  // camelCase → snake_case，只保留该表实际存在的列
  const cols = await getTableColumns(table)
  const colSet = new Set(cols)

  const snakeFields = {}
  for (const [k, v] of Object.entries(fields)) {
    const col = toSnake(k)
    if (colSet.has(col) && col !== 'device_id' && col !== 'updated_at') {
      snakeFields[col] = v === undefined ? null : v
    }
  }

  if (Object.keys(snakeFields).length === 0) return

  const exists = await query(`SELECT device_id FROM ${table} WHERE device_id = ?`, [deviceId])
  if (exists.length === 0) {
    const keys = ['device_id', ...Object.keys(snakeFields)]
    const vals = [deviceId, ...Object.values(snakeFields)]
    const placeholders = keys.map(() => '?').join(', ')
    await query(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, vals)
  } else {
    const sets = Object.keys(snakeFields).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(snakeFields), deviceId]
    await query(`UPDATE ${table} SET ${sets} WHERE device_id = ?`, vals)
  }
}

async function deleteDeviceState(deviceId, subType) {
  const table = TABLE_NAME[subType]
  if (!table) return
  await query(`DELETE FROM ${table} WHERE device_id = ?`, [deviceId])
}

// 缓存各表列名，避免重复查询
const _colCache = {}
async function getTableColumns(table) {
  if (_colCache[table]) return _colCache[table]
  const rows = await query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  )
  _colCache[table] = rows.map(r => r.COLUMN_NAME)
  return _colCache[table]
}

module.exports = {
  initDeviceStateTables,
  getDeviceState,
  upsertDeviceState,
  deleteDeviceState,
  TABLE_NAME,
}
