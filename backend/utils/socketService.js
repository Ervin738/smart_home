const { Server } = require('socket.io');

let io = null;

/**
 * Initialise Socket.IO on the given HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);
    socket.on('disconnect', () =>
      console.log('[Socket.IO] Client disconnected:', socket.id)
    );
  });

  console.log('[Socket.IO] Initialised.');
  return io;
}

/** Return the existing io instance (must call init first). */
function getIo() {
  if (!io) throw new Error('Socket.IO not initialised. Call init() first.');
  return io;
}

module.exports = { init, getIo };
