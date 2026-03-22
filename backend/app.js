// 应用入口 - 初始化 Express 服务、数据库、Socket.IO、MQTT 及设备模拟器
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const bodyParser = require('body-parser');

const { pool }        = require('./utils/db');
const socketService   = require('./utils/socketService');
const mqttService     = require('./utils/mqttService');
const initDb          = require('./utils/initDb');
const simulator       = require('./simulation/deviceSimulator');

const app    = express();
const server = http.createServer(app);

// ── 中间件 ────────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── 健康检查 ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── 路由 ──────────────────────────────────────────────────────────────────────
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/devices/:id/state', require('./routes/deviceStateRoutes'));
app.use('/api/scenes',  require('./routes/sceneRoutes'));
app.use('/api/rooms',   require('./routes/roomRoutes'));

// ── 启动流程 ──────────────────────────────────────────────────────────────────
async function start() {
  // 验证数据库连接
  await pool.query('SELECT 1');
  console.log('[DB] Connection pool ready.');

  // 初始化 Socket.IO
  const io = socketService.init(server);
  app.set('io', io);

  // 初始化数据库表
  await initDb();

  // 加载并启动设备模拟器
  await simulator.load();
  simulator.start(io, mqttService);
  app.set('simulator', simulator);

  // 初始化 MQTT
  mqttService.init(io);
  app.set('mqttService', mqttService);

  // 启动 HTTP 服务器
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

module.exports = { app, server };
