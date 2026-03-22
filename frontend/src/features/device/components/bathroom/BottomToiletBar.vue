<!--
  马桶底部控制栏
  功能：快速控制马桶开关和模式
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

const activeButton = ref<'open' | 'close' | 'foam' | 'flush' | null>(null)
let activeButtonTimer: number | null = null

const handleTogglePower = () => {
  emit('toggle-power')
}

const handleAction = (action: 'open' | 'close' | 'foam' | 'flush') => {
  // 点击后高亮2秒
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  activeButton.value = action
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-toilet-bar" @click.stop>
      <div class="toilet-bar-content">
        <!-- 电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="handleTogglePower"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="divider"></div>

        <!-- 模式按钮 -->
        <div class="mode-buttons">
          <button 
            class="mode-btn"
            :class="{ active: activeButton === 'open', disabled: device.status === 'offline' }"
            @click="handleAction('open')"
          >
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
              <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="mode-text">打开</span>
          </button>

          <button 
            class="mode-btn"
            :class="{ active: activeButton === 'close', disabled: device.status === 'offline' }"
            @click="handleAction('close')"
          >
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="mode-text">关闭</span>
          </button>

          <button 
            class="mode-btn"
            :class="{ active: activeButton === 'foam', disabled: device.status === 'offline' }"
            @click="handleAction('foam')"
          >
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="16" cy="12" r="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="16" r="2.5" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="mode-text">泡沫盾</span>
          </button>

          <button 
            class="mode-btn"
            :class="{ active: activeButton === 'flush', disabled: device.status === 'offline' }"
            @click="handleAction('flush')"
          >
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M8 8l4 4 4-4M12 12v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="mode-text">冲水</span>
          </button>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 马桶</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-toilet-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.toilet-bar-content {
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

.divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  align-self: center;
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: 1;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.mode-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.mode-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.mode-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.mode-icon {
  width: 20px;
  height: 20px;
}

.mode-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
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
  white-space: nowrap;
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
