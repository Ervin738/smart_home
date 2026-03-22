import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 允许来自.trycloudfLare.com和ngrok域名的访问
  server: {
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.cpolar.top', '.cpolar.cn','smarehome.free.idcfengye.com'],
    hmr: {
      overlay: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    }
  },
  build: {
    // 确保构建时使用 UTF-8 编码
    charset: 'utf8'
  }
})
