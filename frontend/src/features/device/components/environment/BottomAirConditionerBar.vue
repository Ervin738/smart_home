<!--
  空调底部控制栏
  功能：单击空调设备卡片后显示，提供电源开关、模式切换和温度调节
  触发：单击空调设备卡片
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
}>()

const devicesStore = useDevicesStore()

// 空调模式
const acModes = ['制冷', '制热', '除湿']
const currentModeIndex = computed({
  get: () => props.device?.acModeIndex ?? null,
  set: (value: number | null) => {
    if (props.device) {
      devicesStore.setAcMode(props.device.id, value)
    }
  }
})

// 使用计算属性从设备获取温度
const localTargetTemp = computed({
  get: () => props.device?.targetTemp ?? 26,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setTargetTemp(props.device.id, value)
    }
  }
})

const handleTogglePower = () => {
  emit('toggle-power')
}

const decreaseTemp = () => {
  if (localTargetTemp.value > 16) {
    localTargetTemp.value = localTargetTemp.value - 1
  }
}

const increaseTemp = () => {
  if (localTargetTemp.value < 32) {
    localTargetTemp.value = localTargetTemp.value + 1
  }
}

// 切换空调模式
const toggleAcMode = () => {
  if (currentModeIndex.value === null) {
    currentModeIndex.value = 0
  } else {
    currentModeIndex.value = (currentModeIndex.value + 1) % acModes.length
  }
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-ac-bar" @click.stop>
      <div class="ac-bar-content">
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
        
        <!-- 中间模式按钮 -->
        <div class="mode-section">
          <div 
            class="mode-btn"
            :class="{ 
              active: device.status === 'online' && currentModeIndex !== null,
              disabled: device.status === 'offline'
            }"
            @click="device.status === 'online' && toggleAcMode()"
          >
            <!-- 默认模式图标 -->
            <svg v-if="currentModeIndex === null" class="mode-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2"/>
            </svg>
            <!-- 制冷图标（雪花） -->
            <svg v-else-if="currentModeIndex === 0" class="mode-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 7l-5 5-5-5M17 17l-5-5-5 5M2 12h20M7 7l5 5 5-5M7 17l5-5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- 制热图标（太阳） -->
            <svg v-else-if="currentModeIndex === 1" class="mode-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!-- 除湿图标（水滴） -->
            <svg v-else-if="currentModeIndex === 2" class="mode-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            <span class="mode-text">{{ currentModeIndex !== null ? acModes[currentModeIndex] : '模式' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧温度调节 -->
        <div class="temp-section" :class="{ disabled: device.status === 'offline' }">
          <button class="temp-btn" @click="decreaseTemp" :disabled="localTargetTemp <= 16 || device.status === 'offline'">
            <svg class="temp-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <div class="temp-display">
            <span class="temp-value">{{ localTargetTemp }}</span>
            <span class="temp-unit">°C</span>
          </div>
          
          <button class="temp-btn" @click="increaseTemp" :disabled="localTargetTemp >= 32 || device.status === 'offline'">
            <svg class="temp-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 空调</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-ac-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.ac-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(30, 40, 60, 0.95) 0%,
    rgba(40, 55, 80, 0.95) 50%,
    rgba(50, 70, 100, 0.95) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.control-btn.active {
  background: rgb(59, 130, 246);
  border: none;
  color: white;
}

.mode-section {
  display: flex;
  align-items: center;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.mode-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.mode-btn.active {
  background: rgb(59, 130, 246);
  color: white;
}

.mode-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.mode-icon {
  width: 24px;
  height: 24px;
}

.mode-text {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap
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

.divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.temp-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 280px;
}

.temp-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.temp-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.9);
}

.temp-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.temp-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.temp-icon {
  width: 20px;
  height: 20px;
}

.temp-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  justify-content: center;
  min-width: 120px;
}

.temp-value {
  font-size: 42px;
  font-weight: 200;
  color: white;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -2px;
}

.temp-unit {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
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
