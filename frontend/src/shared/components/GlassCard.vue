<!--
  毛玻璃卡片组件
  功能：设备卡片容器，提供毛玻璃效果和鼠标跟随光晕效果
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const cardRef = ref<HTMLElement | null>(null)
const themeStore = useThemeStore()

// 根据主题计算卡片颜色
const cardColors = computed(() => {
  if (themeStore.currentTheme?.isDark) {
    // 暗色主题：半透明白色
    return {
      base: `rgba(255, 255, 255, 0.06)`,
      baseHover: `rgba(255, 255, 255, 0.1)`,
      border: `rgba(255, 255, 255, 0.18)`,
      borderHover: `rgba(255, 255, 255, 0.3)`,
      refraction: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)`
    }
  } else {
    // 亮色主题：半透明白色 + 蓝色边框
    return {
      base: `rgba(255, 255, 255, 0.15)`,
      baseHover: `rgba(255, 255, 255, 0.25)`,
      border: `rgba(59, 130, 246, 0.2)`,
      borderHover: `rgba(59, 130, 246, 0.3)`,
      refraction: `linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0) 50%)`
    }
  }
})

const handleMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return
  
  const rect = cardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10
  
  cardRef.value.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`
}

const handleMouseLeave = () => {
  if (!cardRef.value) return
  cardRef.value.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)'
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
  overflow: hidden;
}

.glass-layer {
  position: absolute;
  inset: 0;
  border-radius: 32px;
  pointer-events: none;
}

.glass-base {
  background: v-bind('cardColors.base');
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid v-bind('cardColors.border');
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: v-bind('themeStore.currentTheme?.isDark ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)" : "0 8px 32px 0 rgba(59, 130, 246, 0.1)"');
}

.glass-base::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(59, 130, 246, 0.4)"'), transparent);
  opacity: 0.5;
}

.glass-refraction {
  background: v-bind('cardColors.refraction');
  mix-blend-mode: overlay;
  transition: all 0.3s ease;
  opacity: 0;
  pointer-events: none;
}

.glass-content {
  position: relative;
  z-index: 10;
  height: 100%;
  border-radius: 32px;
}

.glass-card:hover .glass-base {
  background: v-bind('cardColors.baseHover');
  border-color: v-bind('cardColors.borderHover');
  box-shadow: v-bind('themeStore.currentTheme?.isDark ? "0 16px 48px 0 rgba(0, 0, 0, 0.5)" : "0 16px 48px 0 rgba(59, 130, 246, 0.2)"');
}

.glass-card:hover .glass-refraction {
  opacity: 1;
}

.glass-card:active {
  transform: perspective(1000px) scale3d(0.98, 0.98, 0.98) !important;
  transition: transform 0.1s ease;
}

.glass-card:active .glass-base {
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.35)"');
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
