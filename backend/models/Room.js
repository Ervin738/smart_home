// 房间模型 - 定义 rooms 表结构，支持平面图坐标及排序字段的动态迁移
const { query } = require('../utils/db');

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS rooms (
    id        INT          NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100) NOT NULL UNIQUE,
    fp_x      FLOAT        DEFAULT NULL,
    fp_y      FLOAT        DEFAULT NULL,
    fp_w      FLOAT        DEFAULT NULL,
    fp_h      FLOAT        DEFAULT NULL,
    fp_locked TINYINT(1)   DEFAULT 0,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const Room = {
  async init() {
    await query(CREATE_TABLE);
    // MySQL 不支持 ADD COLUMN IF NOT EXISTS，逐列检查后再 ALTER
    const cols = await query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rooms'
    `);
    const existing = new Set(cols.map(c => c.COLUMN_NAME));
    const toAdd = [];
    if (!existing.has('fp_x'))      toAdd.push('ADD COLUMN fp_x      FLOAT      DEFAULT NULL');
    if (!existing.has('fp_y'))      toAdd.push('ADD COLUMN fp_y      FLOAT      DEFAULT NULL');
    if (!existing.has('fp_w'))      toAdd.push('ADD COLUMN fp_w      FLOAT      DEFAULT NULL');
    if (!existing.has('fp_h'))      toAdd.push('ADD COLUMN fp_h      FLOAT      DEFAULT NULL');
    if (!existing.has('fp_locked')) toAdd.push('ADD COLUMN fp_locked TINYINT(1) DEFAULT 0');
    if (!existing.has('sort_order')) toAdd.push('ADD COLUMN sort_order INT DEFAULT 0');
    if (toAdd.length) {
      await query(`ALTER TABLE rooms ${toAdd.join(', ')}`);
    }
  },
  async findAll() {
    return query('SELECT * FROM rooms ORDER BY sort_order ASC, id ASC');
  },
  async create(name) {
    const result = await query('INSERT INTO rooms (name) VALUES (?)', [name]);
    return { id: result.insertId, name, fp_x: null, fp_y: null, fp_w: null, fp_h: null };
  },
  async update(id, fields) {
    const allowed = ['name', 'fp_x', 'fp_y', 'fp_w', 'fp_h', 'fp_locked', 'sort_order'];
    const sets = Object.keys(fields).filter(k => allowed.includes(k));
    if (!sets.length) return;
    const sql = `UPDATE rooms SET ${sets.map(k => `${k}=?`).join(', ')} WHERE id=?`;
    await query(sql, [...sets.map(k => fields[k]), id]);
    return { id, ...fields };
  },
  async delete(id) {
    return query('DELETE FROM rooms WHERE id = ?', [id]);
  },
};

module.exports = Room;
