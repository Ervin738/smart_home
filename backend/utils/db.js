// 数据库工具 - 创建 MySQL 连接池，提供统一的 query 查询方法
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * 使用连接池执行 SQL 查询
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>} 查询结果行数组
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
