<!--
  热水器底部控制栏
  功能：快速控制热水器开关和目标温度
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'toggle-power'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const devicesStore = useDevicesStore()

// 使用computed从设备获取目标温度
const localTargetTemp = computed<number>({
  get: () => (props.device as any)?.targetTemp ?? 45,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setTargetTemp(props.device.id, value)
    }
  }
})

const handleTogglePower = () => {
  emit('toggle-power')
}

const onSliderChange = (value: number) => {
  if (props.device) {
    devicesStore.setTargetTemp(props.device.id, value)
  }
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-water-heater-bar" @click.stop>
      <div class="water-heater-bar-content">
        <!-- 左侧电源按钮 -->
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
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧温度调节 -->
        <div class="slider-section" :class="{ disabled: device.status === 'offline' }">
          <svg class="temp-icon temp-small" viewBox="0 0 24 24" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          <div class="temp-track">
            <div class="temp-fill" :style="{ width: `${((localTargetTemp - 35) / (65 - 35)) * 100}%` }"></div>
            <input 
              type="range" 
              v-model.number="localTargetTemp" 
              min="35" 
              max="65" 
              class="temp-input"
              :disabled="device.status === 'offline'"
              @input="onSliderChange(localTargetTemp)"
            />
          </div>
          
          <svg class="temp-icon temp-large" viewBox="0 0 24 24" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 热水器</span>
          <div class="name-divider"></div>
          <span class="device-label">目标温度</span>
          <span class="device-temp">{{ localTargetTemp }}°C</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-water-heater-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.bottom-water-heater-bar * {
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.water-heater-bar-content {
  display: flex;
  flex-direction: row;
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
  outline: none;
  user-select: none;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
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
  color: rgba(255, 255, 255, 0.9);
}

.control-btn.active .btn-icon {
  color: white;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}

.control-btn.active .btn-text {
  color: white;
}

.divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
}

.slider-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 320px;
}

.slider-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.temp-track {
  position: relative;
  flex: 1;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.temp-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--bottom-bar-active-bg);
  border-radius: 16px;
  transition: width 0.15s ease;
  min-width: 10px;
}

.temp-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  outline: none;
}

.temp-icon {
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.temp-small {
  width: 20px;
  height: 20px;
}

.temp-large {
  width: 26px;
  height: 26px;
}

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.name-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.device-label {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.device-temp {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
