<!--
  毛玻璃卡片组件
  功能：设备卡片容器，提供毛玻璃效果和鼠标跟随光晕效果
-->
<script setup lang="ts">
import { ref } from 'vue'

const cardRef = ref<HTMLElement | null>(null)
const glowRef = ref<HTMLElement | null>(null)

const handleMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return
  
  const rect = cardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10
  
  cardRef.value.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
  
  if (glowRef.value) {
    glowRef.value.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)`
  }
}

const handleMouseLeave = () => {
  if (!cardRef.value) return
  cardRef.value.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  if (glowRef.value) {
    glowRef.value.style.background = 'transparent'
  }
}
</script>

<template>
  <div 
    ref="cardRef"
    class="glass-card"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div class="glass-layer glass-base"></div>
    <div class="glass-layer glass-refraction"></div>
    <div ref="glowRef" class="glass-layer glass-glow"></div>
    <div class="glass-layer glass-highlight"></div>
    <div class="glass-layer glass-liquid"></div>
    <div class="glass-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  width: 240px;
  height: 280px;
  border-radius: 32px;
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out;
}

.glass-layer {
  position: absolute;
  inset: 0;
  border-radius: 32px;
  pointer-events: none;
}

.glass-base {
  background: linear-gradient(135deg, rgba(33, 123, 156, 0.4) 0%, rgba(31, 58, 95, 0.35) 50%, rgba(33, 12, 82, 0.4) 100%);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.glass-refraction {
  background: linear-gradient(165deg, transparent 0%, rgba(255, 255, 255, 0.05) 40%, rgba(120, 200, 255, 0.08) 60%, transparent 100%);
  mix-blend-mode: overlay;
}

.glass-glow {
  transition: background 0.1s ease;
  mix-blend-mode: soft-light;
}

.glass-highlight {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 10%, transparent 30%);
  border-radius: 32px;
}

.glass-liquid {
  background: radial-gradient(ellipse 80% 50% at 20% 80%, rgba(100, 180, 255, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
  animation: liquidFlow 8s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes liquidFlow {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  25% { transform: translate(5px, -5px) scale(1.02); opacity: 0.8; }
  50% { transform: translate(0, 5px) scale(0.98); opacity: 0.5; }
  75% { transform: translate(-5px, 0) scale(1.01); opacity: 0.7; }
}

.glass-content {
  position: relative;
  z-index: 10;
  height: 100%;
  border-radius: 32px;
}

.glass-card:hover .glass-base {
  background: linear-gradient(135deg, rgba(33, 123, 156, 0.5) 0%, rgba(31, 58, 95, 0.4) 50%, rgba(33, 12, 82, 0.5) 100%);
  border-color: rgba(255, 255, 255, 0.35);
}

.glass-card:hover .glass-highlight {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 15%, transparent 40%);
}

.glass-card:hover .glass-liquid {
  animation-duration: 4s;
  opacity: 0.8;
}

.glass-card:active {
  transform: perspective(1000px) scale3d(0.98, 0.98, 0.98) !important;
  transition: transform 0.1s ease;
}

.glass-card:active .glass-base {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.3) 100%);
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 34px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(120, 200, 255, 0.2) 25%, rgba(255, 180, 255, 0.2) 50%, rgba(255, 220, 150, 0.2) 75%, rgba(255, 255, 255, 0.4) 100%);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.glass-card:hover::before { opacity: 1; }
</style>
