// 1. Load environment variables first
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

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/devices/:id/state', require('./routes/deviceStateRoutes'));
app.use('/api/scenes',  require('./routes/sceneRoutes'));
app.use('/api/rooms',   require('./routes/roomRoutes'));

// ── Startup sequence ──────────────────────────────────────────────────────────
async function start() {
  // 2. Verify DB connection
  await pool.query('SELECT 1');
  console.log('[DB] Connection pool ready.');

  // 3. Initialise Socket.IO
  const io = socketService.init(server);
  app.set('io', io);

  // 4. Init DB tables
  await initDb();

  // 5. Load & start simulation engine
  await simulator.load();
  simulator.start(io, mqttService);
  app.set('simulator', simulator);

  // 6. Initialise MQTT
  mqttService.init(io);
  app.set('mqttService', mqttService);

  // 7. Start HTTP server
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
