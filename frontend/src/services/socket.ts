import { io, Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, { autoConnect: true, reconnectionDelay: 2000 })
    socket.on('connect', () => console.log('[Socket.IO] Connected:', socket?.id))
    socket.on('disconnect', () => console.log('[Socket.IO] Disconnected'))
    socket.on('connect_error', (err) => console.warn('[Socket.IO] Error:', err.message))
  }
  return socket
}
