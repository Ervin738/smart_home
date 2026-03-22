<!--
  开窗器长按弹窗
  功能：显示开窗器控制界面，包括开关、打开/暂停/关闭控制、开启比例显示
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const openPercentage = ref(0) // 窗户开启比例 0-100
const activeButton = ref<'open' | 'pause' | 'close' | null>(null) // 当前激活的按钮
let activeButtonTimer: number | null = null

// 当设备改变时，恢复该设备的状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    openPercentage.value = (props.device as any).windowOpenerPercentage ?? 0
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    openPercentage.value = (props.device as any).windowOpenerPercentage ?? 0
  } else {
    // 弹窗关闭时清除激活状态和定时器
    if (activeButtonTimer) {
      clearTimeout(activeButtonTimer)
      activeButtonTimer = null
    }
    activeButton.value = null
  }
})

// 离线时重置本地状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    openPercentage.value = 0
    activeButton.value = null
    if (activeButtonTimer) {
      clearTimeout(activeButtonTimer)
      activeButtonTimer = null
    }
  }
})

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 打开窗户
const openWindow = () => {
  if (props.device?.status === 'offline') return
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'open'
  // 不修改滑条的值，只是触发打开动作
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}

// 暂停
const pauseWindow = () => {
  if (props.device?.status === 'offline') return
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'pause'
  // 暂停动作，不修改滑条
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}

// 关闭窗户
const closeWindow = () => {
  if (props.device?.status === 'offline') return
  // 清除之前的定时器
  if (activeButtonTimer) clearTimeout(activeButtonTimer)
  // 设置激活状态
  activeButton.value = 'close'
  // 不修改滑条的值，只是触发关闭动作
  // 2秒后取消激活状态
  activeButtonTimer = window.setTimeout(() => {
    activeButton.value = null
  }, 2000)
}

// 滑条改变
const onPercentageChange = () => {
  if (props.device) {
    devicesStore.setDeviceExtra(props.device.id, { windowOpenerPercentage: openPercentage.value })
  }
}

// 打开定时设置
const openTimer = () => {
  emit('open-timer')
}
</script>

<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @click="close">
        <div class="dialog-box" @click.stop>
          <!-- 头部 -->
          <div class="dialog-header">
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
            </div>
            <div class="device-status" :class="device.status">
              {{ device.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>

          <!-- 电源按钮和定时按钮 -->
          <div class="power-timer-section">
            <button 
              class="power-btn" 
              :class="{ active: device.status === 'online' }"
              @click="togglePower"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </button>
            
            <button 
              class="timer-btn"
              :disabled="device.status === 'offline'"
              @click="openTimer"
            >
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="timer-text">定时</span>
            </button>
          </div>

          <!-- 控制按钮 -->
          <div class="control-buttons">
            <button 
              class="control-btn open-btn"
              :class="{ active: activeButton === 'open' }"
              :disabled="device.status === 'offline'"
              @click="openWindow"
            >
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="control-text">打开</span>
            </button>
            
            <button 
              class="control-btn pause-btn"
              :class="{ active: activeButton === 'pause' }"
              :disabled="device.status === 'offline'"
              @click="pauseWindow"
            >
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
              </svg>
              <span class="control-text">暂停</span>
            </button>
            
            <button 
              class="control-btn close-btn"
              :class="{ active: activeButton === 'close' }"
              :disabled="device.status === 'offline'"
              @click="closeWindow"
            >
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="control-text">关闭</span>
            </button>
          </div>

          <!-- 开启比例显示和滑条 -->
          <div class="percentage-section">
            <div class="percentage-header">
              <span class="percentage-label">窗户当前开启比例</span>
            </div>
            <div class="percentage-value-display">{{ openPercentage }}%</div>
            <div class="percentage-slider-container">
              <span class="slider-min">0</span>
              <div class="percentage-slider-track">
                <div class="percentage-slider-fill" :style="{ width: `${openPercentage}%` }"></div>
                <input 
                  type="range" 
                  v-model.number="openPercentage" 
                  min="0" 
                  max="100" 
                  step="1"
                  class="percentage-slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onPercentageChange"
                />
              </div>
              <span class="slider-max">100</span>
            </div>
          </div>

          <!-- 功能按钮已移除 -->
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-box {
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  width: 340px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.device-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.device-status.online {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.device-status.offline {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

/* 电源按钮和定时按钮 */
.power-timer-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.power-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
  font-size: 18px;
}

.power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.btn-icon {
  width: 22px;
  height: 22px;
}

.btn-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.timer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.timer-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.timer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-icon {
  width: 20px;
  height: 20px;
}

.timer-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.control-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.control-btn:hover:not(:disabled) {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-icon {
  width: 24px;
  height: 24px;
}

.control-text {
  font-size: 14px;
  font-weight: 500;
}

/* 开启比例 */
.percentage-section {
  margin-bottom: 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.percentage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.percentage-label {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
}

.percentage-value-display {
  font-size: 32px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 12px;
}

.percentage-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-min,
.slider-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 24px;
}

.percentage-slider-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
}

.percentage-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--dialog-btn-active-bg-1);
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
}

.percentage-slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.percentage-slider-input:disabled {
  cursor: not-allowed;
}

/* 动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  transform: scale(0.9);
}
</style>
