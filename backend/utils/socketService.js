// Socket.IO 服务 - 初始化 WebSocket 服务，向前端实时推送设备状态变更
const { Server } = require('socket.io');

let io = null;

/**
 * 在指定 HTTP 服务器上初始化 Socket.IO
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

/** 返回已初始化的 io 实例（需先调用 init）*/
function getIo() {
  if (!io) throw new Error('Socket.IO 未初始化，请先调用 init()。');
  return io;
}

module.exports = { init, getIo };
