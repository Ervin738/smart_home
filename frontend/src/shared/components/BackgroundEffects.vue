<!--
  背景粒子效果组件
  功能：在页面背景显示动态粒子动画效果
  特性：
    - 使用 Canvas 绘制粒子
    - 粒子随机移动并在边界反弹
    - 粒子颜色跟随主题色变化
    - 响应窗口大小变化
    - 不影响页面交互（pointer-events: none）
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationId: number | null = null

function initCanvas() {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  
  createParticles(80)
  animate()
}

function createParticles(count: number) {
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3
    })
  }
}

function animate() {
  if (!ctx || !canvasRef.value) return
  
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  
  const theme = themeStore.currentTheme
  if (!theme) return
  
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    
    if (p.x < 0 || p.x > canvasRef.value!.width) p.vx *= -1
    if (p.y < 0 || p.y > canvasRef.value!.height) p.vy *= -1
    
    ctx!.fillStyle = theme.colors.accent
    ctx!.globalAlpha = p.opacity
    ctx!.beginPath()
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx!.fill()
  })
  
  ctx.globalAlpha = 1
  animationId = requestAnimationFrame(animate)
}

function handleResize() {
  if (!canvasRef.value) return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
  createParticles(80)
}

// 监听主题变化
watch(() => themeStore.currentTheme, () => {
  // 主题变化时粒子颜色会自动更新
})

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <canvas ref="canvasRef" class="background-canvas"></canvas>
</template>

<style scoped>
.background-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
