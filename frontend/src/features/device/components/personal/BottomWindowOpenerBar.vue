<!--
  开窗器底部控制栏
  功能：快速控制开窗器开关和打开/暂停/关闭操作
-->
<script setup lang="ts">
import { ref } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'toggle-power'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const activeButton = ref<'open' | 'pause' | 'close' | null>(null)
let activeButtonTimer: number | null = null

const handleTogglePower = () => {
  emit('toggle-power')
}

// 打开窗户
const openWindow = () => {
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'open'
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}

// 暂停
const pauseWindow = () => {
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'pause'
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}

// 关闭窗户
const closeWindow = () => {
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'close'
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-window-opener-bar" @click.stop>
      <div class="window-opener-bar-content">
        <!-- 电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn power-btn"
            :class="{ active: device.status === 'online' }"
            @click="handleTogglePower"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 控制按钮 -->
        <div class="action-buttons">
          <button 
            class="action-btn"
            :class="{ active: activeButton === 'open' }"
            :disabled="device.status === 'offline'"
            @click="openWindow"
          >
            <svg class="action-icon" viewBox="0 0 24 24" fill="none">
              <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="action-text">打开</span>
          </button>
          
          <button 
            class="action-btn"
            :class="{ active: activeButton === 'pause' }"
            :disabled="device.status === 'offline'"
            @click="pauseWindow"
          >
            <svg class="action-icon" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
            <span class="action-text">暂停</span>
          </button>
          
          <button 
            class="action-btn"
            :class="{ active: activeButton === 'close' }"
            :disabled="device.status === 'offline'"
            @click="closeWindow"
          >
            <svg class="action-icon" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="action-text">关闭</span>
          </button>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 开窗器</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-window-opener-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.window-opener-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
  overflow: visible;
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.control-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* 控制按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
  min-width: 80px;
}

.action-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 24px;
  height: 24px;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
