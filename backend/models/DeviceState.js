// 设备状态模型 - 为每种设备子类型维护独立状态表，提供 UPSERT/查询/删除操作
const { query } = require('../utils/db')

/**
 * 每个设备子类型对应一张独立状态表
 * 表名规则：device_state_<type>（连字符转下划线）
 * 每张表字段 = device_id + 该设备弹窗的所有状态字段
 */

// 设备类型 -> 建表 SQL（字段与前端 Dialog 状态一一对应）
const DEVICE_STATE_SCHEMAS = {

  // ── 灯光 ──────────────────────────────────────────────────────────
  'table-lamp': `
    CREATE TABLE IF NOT EXISTS device_state_table_lamp (
      device_id   INT PRIMARY KEY,
      brightness  INT     DEFAULT 80    COMMENT '亮度 0-100',
      color_temp  INT     DEFAULT 4500  COMMENT '色温 K 2700-6500',
      mode_index  TINYINT DEFAULT -1    COMMENT '情景模式索引 -1=未选',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'ceiling-lamp': `
    CREATE TABLE IF NOT EXISTS device_state_ceiling_lamp (
      device_id   INT PRIMARY KEY,
      brightness  INT     DEFAULT 80    COMMENT '亮度 0-100',
      color_temp  INT     DEFAULT 4500  COMMENT '色温 K 2700-6500',
      mode_index  TINYINT DEFAULT -1    COMMENT '情景模式索引 -1=未选',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 环境 ──────────────────────────────────────────────────────────
  'air-conditioner': `
    CREATE TABLE IF NOT EXISTS device_state_air_conditioner (
      device_id        INT PRIMARY KEY,
      target_temp      FLOAT   DEFAULT 26    COMMENT '目标温度 16-32',
      mode_index       TINYINT DEFAULT NULL  COMMENT '模式 0制冷 1制热 2除湿',
      fan_speed        TINYINT DEFAULT 1     COMMENT '风速 0-2',
      auto_mode        TINYINT DEFAULT 0     COMMENT '自动模式',
      wind_mode        VARCHAR(20) DEFAULT NULL COMMENT 'sweep/noDirect/directional',
      functions        JSON    DEFAULT NULL  COMMENT '功能开关数组 eco/sleep',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'fan': `
    CREATE TABLE IF NOT EXISTS device_state_fan (
      device_id          INT PRIMARY KEY,
      mode_index         TINYINT DEFAULT 0   COMMENT '0直吹 1自然风',
      speed_level        TINYINT DEFAULT 1   COMMENT '风速 1-4',
      swing_enabled      TINYINT DEFAULT 0   COMMENT '自动扫风',
      swing_angle        INT     DEFAULT 140 COMMENT '扫风角度',
      delay_shutdown     TINYINT DEFAULT 0   COMMENT '延时关闭',
      delay_duration     INT     DEFAULT 60  COMMENT '延时分钟',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'heater': `
    CREATE TABLE IF NOT EXISTS device_state_heater (
      device_id      INT PRIMARY KEY,
      target_temp    INT     DEFAULT 25  COMMENT '目标温度 16-32',
      delay_shutdown TINYINT DEFAULT 0,
      delay_duration INT     DEFAULT 60,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'humidifier': `
    CREATE TABLE IF NOT EXISTS device_state_humidifier (
      device_id   INT PRIMARY KEY,
      level       TINYINT DEFAULT 1 COMMENT '0=1档 1=2档 2=恒湿',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'dehumidifier': `
    CREATE TABLE IF NOT EXISTS device_state_dehumidifier (
      device_id       INT PRIMARY KEY,
      mode_index      TINYINT DEFAULT 0  COMMENT '0智能 1睡眠 2干衣',
      target_humidity INT     DEFAULT 50 COMMENT '目标湿度 40-70',
      delay_shutdown  TINYINT DEFAULT 0,
      delay_duration  INT     DEFAULT 60,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'air-purifier': `
    CREATE TABLE IF NOT EXISTS device_state_air_purifier (
      device_id        INT PRIMARY KEY,
      mode_index       TINYINT DEFAULT 0   COMMENT '0智能 1睡眠 2净化 3风扇',
      swing_enabled    TINYINT DEFAULT 0,
      swing_angle      INT     DEFAULT 90  COMMENT '30/60/90',
      brightness_level TINYINT DEFAULT 0   COMMENT '0关闭 1自动 2微光 3亮光',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'aroma-diffuser': `
    CREATE TABLE IF NOT EXISTS device_state_aroma_diffuser (
      device_id         INT PRIMARY KEY,
      interval_index    TINYINT DEFAULT 0 COMMENT '出香间隔索引 0=20min 1=30min 2=40min',
      duration_index    TINYINT DEFAULT 0 COMMENT '出香时长索引 0=2s..4=6s',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 厨房 ──────────────────────────────────────────────────────────
  'rice-cooker': `
    CREATE TABLE IF NOT EXISTS device_state_rice_cooker (
      device_id       INT PRIMARY KEY,
      current_mode    INT     DEFAULT -1  COMMENT '当前详细模式ID -1=未选',
      is_cooking      TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'induction-cooker': `
    CREATE TABLE IF NOT EXISTS device_state_induction_cooker (
      device_id      INT PRIMARY KEY,
      cooking_mode   INT     DEFAULT -1  COMMENT '烹饪模式索引 -1=未选',
      is_cooking     TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'electric-kettle': `
    CREATE TABLE IF NOT EXISTS device_state_electric_kettle (
      device_id        INT     PRIMARY KEY,
      target_temp      INT     DEFAULT 100 COMMENT '目标温度 40-100',
      auto_keep_warm   TINYINT DEFAULT 1   COMMENT '自动定温',
      keep_warm_hours  FLOAT   DEFAULT 1.0 COMMENT '定温时长(小时)',
      is_heating       TINYINT DEFAULT 0,
      is_keeping_warm  TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'range-hood': `
    CREATE TABLE IF NOT EXISTS device_state_range_hood (
      device_id              INT PRIMARY KEY,
      level                  TINYINT DEFAULT -1  COMMENT '档位 -1关 0-3档',
      light_enabled          TINYINT DEFAULT 0,
      delay_shutdown         TINYINT DEFAULT 0,
      delay_duration_index   TINYINT DEFAULT 0   COMMENT '0=30min 1=1h 2=2h 3=3h',
      clean_reminder_enabled TINYINT DEFAULT 1,
      auto_clean_enabled     TINYINT DEFAULT 0,
      clean_cycle_hours      INT     DEFAULT 40,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'air-fryer': `
    CREATE TABLE IF NOT EXISTS device_state_air_fryer (
      device_id      INT PRIMARY KEY,
      selected_mode  INT     DEFAULT 6   COMMENT '选中的烹饪模式ID',
      cooking_temp   INT     DEFAULT 190 COMMENT '烹饪温度 100-230',
      cooking_time   INT     DEFAULT 20  COMMENT '烹饪时间(分钟) 1-60',
      auto_keep_warm TINYINT DEFAULT 1,
      is_cooking     TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'water-dispenser': `
    CREATE TABLE IF NOT EXISTS device_state_water_dispenser (
      device_id          INT PRIMARY KEY,
      selected_water_type VARCHAR(30) DEFAULT 'tap-water' COMMENT 'tap-water/purified-water/boiled-water',
      keep_warm_enabled  TINYINT DEFAULT 0,
      keep_warm_temp     INT     DEFAULT 55,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 浴室 ──────────────────────────────────────────────────────────
  'water-heater': `
    CREATE TABLE IF NOT EXISTS device_state_water_heater (
      device_id        INT PRIMARY KEY,
      mode             TINYINT DEFAULT 0   COMMENT '0=经济 1=舒适 2=快热',
      target_temp      INT     DEFAULT 50  COMMENT '目标温度',
      is_heating       TINYINT DEFAULT 0,
      preheat_enabled  TINYINT DEFAULT 1,
      preheat_duration INT     DEFAULT 9   COMMENT '预热时长(分钟)',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'toilet': `
    CREATE TABLE IF NOT EXISTS device_state_toilet (
      device_id        INT PRIMARY KEY,
      water_temp       TINYINT DEFAULT 4   COMMENT '水温档 1-7',
      seat_temp        TINYINT DEFAULT 1   COMMENT '座圈温度档 1-5',
      air_temp         TINYINT DEFAULT 5   COMMENT '暖风温度档 1-7',
      water_strength   TINYINT DEFAULT 3   COMMENT '水压档 1-5',
      nozzle_position  TINYINT DEFAULT 3   COMMENT '喷嘴位置 1-5',
      lid_open         TINYINT DEFAULT 0   COMMENT '马桶盖 0=关 1=开',
      wash_mode        VARCHAR(20) DEFAULT NULL COMMENT 'hip/female/child/strong/null',
      dry_mode         TINYINT DEFAULT 0   COMMENT '强力烘干 0=关 1=开',
      reciprocate      TINYINT DEFAULT 0   COMMENT '往复 0=关 1=开',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'yuba': `
    CREATE TABLE IF NOT EXISTS device_state_yuba (
      device_id  INT PRIMARY KEY,
      mode       TINYINT DEFAULT 0 COMMENT '0=取暖 1=换气 2=照明',
      fan_speed  TINYINT DEFAULT 1 COMMENT '风速 1-3',
      light_on   TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 清洁 ──────────────────────────────────────────────────────────
  'washing-machine': `
    CREATE TABLE IF NOT EXISTS device_state_washing_machine (
      device_id  INT PRIMARY KEY,
      mode       INT     DEFAULT 0  COMMENT '洗涤模式索引',
      temp       INT     DEFAULT 30 COMMENT '洗涤温度',
      spin       INT     DEFAULT 1000 COMMENT '脱水转速',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'dryer': `
    CREATE TABLE IF NOT EXISTS device_state_dryer (
      device_id INT PRIMARY KEY,
      mode      INT DEFAULT 0  COMMENT '烘干模式索引',
      temp      INT DEFAULT 60 COMMENT '烘干温度',
      time_min  INT DEFAULT 60 COMMENT '烘干时间(分钟)',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'clothes-rack': `
    CREATE TABLE IF NOT EXISTS device_state_clothes_rack (
      device_id  INT PRIMARY KEY,
      mode       INT DEFAULT 0  COMMENT '模式索引',
      height_pct INT DEFAULT 50 COMMENT '高度百分比 0-100',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'robot-vacuum': `
    CREATE TABLE IF NOT EXISTS device_state_robot_vacuum (
      device_id INT PRIMARY KEY,
      mode      INT     DEFAULT 0 COMMENT '清扫模式索引',
      suction   TINYINT DEFAULT 1 COMMENT '吸力档 1-4',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 娱乐 ──────────────────────────────────────────────────────────
  'tv': `
    CREATE TABLE IF NOT EXISTS device_state_tv (
      device_id INT PRIMARY KEY,
      channel   INT     DEFAULT 1,
      volume    INT     DEFAULT 30  COMMENT '音量 0-100',
      source    TINYINT DEFAULT 0   COMMENT '信号源索引',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'projector': `
    CREATE TABLE IF NOT EXISTS device_state_projector (
      device_id  INT PRIMARY KEY,
      source     TINYINT DEFAULT 0  COMMENT '信号源索引',
      brightness INT     DEFAULT 80 COMMENT '亮度 0-100',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'speaker': `
    CREATE TABLE IF NOT EXISTS device_state_speaker (
      device_id INT PRIMARY KEY,
      volume    INT     DEFAULT 50 COMMENT '音量 0-100',
      mode      TINYINT DEFAULT 0  COMMENT '音效模式索引',
      bass      INT     DEFAULT 50 COMMENT '低音 0-100',
      treble    INT     DEFAULT 50 COMMENT '高音 0-100',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'clock': `
    CREATE TABLE IF NOT EXISTS device_state_clock (
      device_id  INT PRIMARY KEY,
      mode       TINYINT DEFAULT 0  COMMENT '显示模式索引',
      brightness INT     DEFAULT 80 COMMENT '亮度 0-100',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 个人 ──────────────────────────────────────────────────────────
  'electric-blanket': `
    CREATE TABLE IF NOT EXISTS device_state_electric_blanket (
      device_id  INT PRIMARY KEY,
      temp_level TINYINT DEFAULT 3  COMMENT '温度档 1-5',
      timer_min  INT     DEFAULT 0  COMMENT '定时分钟 0=不定时',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'smart-bed': `
    CREATE TABLE IF NOT EXISTS device_state_smart_bed (
      device_id         INT PRIMARY KEY,
      head_angle        INT     DEFAULT 0 COMMENT '头部角度 0-60',
      foot_angle        INT     DEFAULT 0 COMMENT '脚部角度 0-45',
      massage_mode      TINYINT DEFAULT 0 COMMENT '按摩模式索引',
      massage_intensity TINYINT DEFAULT 1 COMMENT '按摩强度 1-5',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'smart-pillow': `
    CREATE TABLE IF NOT EXISTS device_state_smart_pillow (
      device_id INT PRIMARY KEY,
      mode      TINYINT DEFAULT 0 COMMENT '模式索引',
      height    TINYINT DEFAULT 2 COMMENT '高度档 1-5',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'window-opener': `
    CREATE TABLE IF NOT EXISTS device_state_window_opener (
      device_id   INT PRIMARY KEY,
      open_pct    INT DEFAULT 0 COMMENT '开启百分比 0-100',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 安防 ──────────────────────────────────────────────────────────
  'door-lock': `
    CREATE TABLE IF NOT EXISTS device_state_door_lock (
      device_id INT PRIMARY KEY,
      locked    TINYINT DEFAULT 1,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'smart-door': `
    CREATE TABLE IF NOT EXISTS device_state_smart_door (
      device_id INT PRIMARY KEY,
      is_open   TINYINT DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'camera': `
    CREATE TABLE IF NOT EXISTS device_state_camera (
      device_id      INT PRIMARY KEY,
      resolution     TINYINT DEFAULT 0 COMMENT '分辨率索引',
      night_vision   TINYINT DEFAULT 1,
      motion_detect  TINYINT DEFAULT 1,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'switch': `
    CREATE TABLE IF NOT EXISTS device_state_switch (
      device_id    INT PRIMARY KEY,
      switch_state JSON DEFAULT NULL COMMENT '多路开关状态数组',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'socket': `
    CREATE TABLE IF NOT EXISTS device_state_socket (
      device_id    INT PRIMARY KEY,
      socket_state JSON DEFAULT NULL COMMENT '多路插座状态数组',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  // ── 网络（无特殊状态，仅 power，建空表占位）──────────────────────
  'router': `
    CREATE TABLE IF NOT EXISTS device_state_router (
      device_id INT PRIMARY KEY,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'gateway': `
    CREATE TABLE IF NOT EXISTS device_state_gateway (
      device_id INT PRIMARY KEY,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,

  'wifi-extender': `
    CREATE TABLE IF NOT EXISTS device_state_wifi_extender (
      device_id INT PRIMARY KEY,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    )`,
}

/**
 * 设备子类型 -> 表名
 */
function getTableName(deviceSubType) {
  return 'device_state_' + deviceSubType.replace(/-/g, '_')
}

/**
 * 初始化所有设备状态表
 */
async function initDeviceStateTables() {
  for (const sql of Object.values(DEVICE_STATE_SCHEMAS)) {
    await query(sql)
  }

  // 补充 toilet 表的新列（兼容旧数据库）
  const toiletAlters = [
    `ALTER TABLE device_state_toilet ADD COLUMN IF NOT EXISTS lid_open     TINYINT DEFAULT 0   COMMENT '马桶盖 0=关 1=开'`,
    `ALTER TABLE device_state_toilet ADD COLUMN IF NOT EXISTS wash_mode    VARCHAR(20) DEFAULT NULL COMMENT 'hip/female/child/strong/null'`,
    `ALTER TABLE device_state_toilet ADD COLUMN IF NOT EXISTS dry_mode     TINYINT DEFAULT 0   COMMENT '强力烘干 0=关 1=开'`,
    `ALTER TABLE device_state_toilet ADD COLUMN IF NOT EXISTS reciprocate  TINYINT DEFAULT 0   COMMENT '往复 0=关 1=开'`,
  ]
  for (const sql of toiletAlters) {
    try { await query(sql) } catch (_) { /* 列已存在则忽略 */ }
  }

  console.log('设备状态表初始化完成')
}

/**
 * 获取设备状态
 * @param {number} deviceId
 * @param {string} deviceSubType  e.g. 'air-conditioner'
 */
async function getDeviceState(deviceId, deviceSubType) {
  if (!DEVICE_STATE_SCHEMAS[deviceSubType]) return null
  const table = getTableName(deviceSubType)
  const rows = await query(`SELECT * FROM ${table} WHERE device_id = ?`, [deviceId])
  return rows[0] || null
}

/**
 * 保存/更新设备状态（UPSERT）
 * @param {number} deviceId
 * @param {string} deviceSubType
 * @param {object} fields  snake_case 字段键值对
 */
async function upsertDeviceState(deviceId, deviceSubType, fields) {
  if (!DEVICE_STATE_SCHEMAS[deviceSubType]) return
  const table = getTableName(deviceSubType)

  const existing = await query(`SELECT device_id FROM ${table} WHERE device_id = ?`, [deviceId])

  if (existing.length === 0) {
    const cols = ['device_id', ...Object.keys(fields)]
    const vals = [deviceId, ...Object.values(fields)]
    const placeholders = vals.map(() => '?').join(', ')
    await query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`, vals)
  } else {
    if (Object.keys(fields).length === 0) return
    const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(fields), deviceId]
    await query(`UPDATE ${table} SET ${setClauses} WHERE device_id = ?`, vals)
  }
}

/**
 * 删除设备状态（设备删除时级联，也可手动调用）
 */
async function deleteDeviceState(deviceId, deviceSubType) {
  if (!DEVICE_STATE_SCHEMAS[deviceSubType]) return
  const table = getTableName(deviceSubType)
  await query(`DELETE FROM ${table} WHERE device_id = ?`, [deviceId])
}

module.exports = {
  initDeviceStateTables,
  getDeviceState,
  upsertDeviceState,
  deleteDeviceState,
  DEVICE_STATE_SCHEMAS,
  getTableName,
}
