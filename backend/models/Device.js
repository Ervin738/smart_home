const { query } = require('../utils/db');

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS devices (
    id       INT          NOT NULL AUTO_INCREMENT,
    name     VARCHAR(100) NOT NULL,
    type     VARCHAR(50)  NOT NULL COMMENT 'frontend device type, e.g. light, environment',
    location VARCHAR(100) COMMENT 'room name',
    status   JSON,
    extra    JSON         COMMENT 'frontend-specific fields (lightType, brightness, etc.)',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const Device = {
  async init() {
    await query(CREATE_TABLE);
    // 检查并添加 sort_order 列
    const cols = await query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices'
    `);
    const existing = new Set(cols.map(c => c.COLUMN_NAME));
    if (!existing.has('sort_order')) {
      await query('ALTER TABLE devices ADD COLUMN sort_order INT DEFAULT 0');
    }
  },

  async findAll() {
    return query('SELECT * FROM devices ORDER BY sort_order ASC, id ASC');
  },

  async findById(id) {
    const rows = await query('SELECT * FROM devices WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, type, location = '', status = {}, extra = {} }) {
    const result = await query(
      'INSERT INTO devices (name, type, location, status, extra) VALUES (?, ?, ?, ?, ?)',
      [name, type, location, JSON.stringify(status), JSON.stringify(extra)]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const { name, type, location, status, extra } = fields;
    return query(
      'UPDATE devices SET name=?, type=?, location=?, status=?, extra=? WHERE id=?',
      [name, type, location ?? '', JSON.stringify(status), JSON.stringify(extra ?? {}), id]
    );
  },

  async delete(id) {
    return query('DELETE FROM devices WHERE id = ?', [id]);
  },
};

module.exports = Device;
