const { query } = require('../utils/db');

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS scenes (
    id    INT          NOT NULL AUTO_INCREMENT,
    name  VARCHAR(100) NOT NULL,
    rules JSON         COMMENT 'Array of device actions',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const Scene = {
  async init() {
    await query(CREATE_TABLE);
  },

  async findAll() {
    return query('SELECT * FROM scenes');
  },

  async findById(id) {
    const rows = await query('SELECT * FROM scenes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, rules = [] }) {
    const result = await query(
      'INSERT INTO scenes (name, rules) VALUES (?, ?)',
      [name, JSON.stringify(rules)]
    );
    return result.insertId;
  },

  async update(id, { name, rules }) {
    return query(
      'UPDATE scenes SET name=?, rules=? WHERE id=?',
      [name, JSON.stringify(rules), id]
    );
  },

  async delete(id) {
    return query('DELETE FROM scenes WHERE id = ?', [id]);
  },
};

module.exports = Scene;
