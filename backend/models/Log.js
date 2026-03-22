// 日志模型 - 定义 logs 表结构，记录设备操作行为
const { query } = require('../utils/db');

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS logs (
    id        INT          NOT NULL AUTO_INCREMENT,
    timestamp TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action    VARCHAR(200) NOT NULL,
    deviceId  INT,
    PRIMARY KEY (id),
    CONSTRAINT fk_log_device FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const Log = {
  async init() {
    await query(CREATE_TABLE);
  },

  async findAll({ limit = 100 } = {}) {
    return query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?', [limit]);
  },

  async findByDevice(deviceId) {
    return query(
      'SELECT * FROM logs WHERE deviceId = ? ORDER BY timestamp DESC',
      [deviceId]
    );
  },

  async create({ action, deviceId = null }) {
    const result = await query(
      'INSERT INTO logs (action, deviceId) VALUES (?, ?)',
      [action, deviceId]
    );
    return result.insertId;
  },
};

module.exports = Log;
