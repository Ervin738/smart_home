<!--
  风扇底部控制栏
  功能：单击风扇设备卡片后显示，提供电源开关、模式切换和风速调节
  触发：单击风扇设备卡片
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

// 风扇模式
const fanModes = ['直吹风', '自然风']
const currentModeIndex = computed({
  get: () => props.device?.fanModeIndex ?? 0,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setFanMode(props.device.id, value)
    }
  }
})

// 使用计算属性从设备获取风速
const localSpeedLevel = computed({
  get: () => props.device?.speedLevel ?? 1,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setSpeedLevel(props.device.id, value)
    }
  }
})

const handleTogglePower = () => {
  emit('toggle-power')
}

const decreaseSpeed = () => {
  if (localSpeedLevel.value > 1) {
    localSpeedLevel.value = localSpeedLevel.value - 1
  }
}

const increaseSpeed = () => {
  if (localSpeedLevel.value < 4) {
    localSpeedLevel.value = localSpeedLevel.value + 1
  }
}

// 切换风扇模式
const toggleFanMode = () => {
  currentModeIndex.value = (currentModeIndex.value + 1) % fanModes.length
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-fan-bar" @click.stop>
      <div class="fan-bar-content">
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
        
        <!-- 右侧风速调节 -->
        <div class="speed-section" :class="{ disabled: device.status === 'offline' }">
          <button class="speed-btn" @click="decreaseSpeed" :disabled="localSpeedLevel <= 1 || device.status === 'offline'">
            <svg class="speed-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <div class="speed-display">
            <span class="speed-value">{{ localSpeedLevel }}</span>
            <span class="speed-unit">档</span>
          </div>
          
          <button class="speed-btn" @click="increaseSpeed" :disabled="localSpeedLevel >= 4 || device.status === 'offline'">
            <svg class="speed-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 风扇</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-fan-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.fan-bar-content {
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
  background: rgb(59, 130, 246);
  border: none;
  border-radius: 16px;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
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

.speed-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 280px;
}

.speed-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.speed-btn {
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

.speed-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.speed-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.speed-icon {
  width: 20px;
  height: 20px;
}

.speed-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  justify-content: center;
  min-width: 120px;
}

.speed-value {
  font-size: 40px;
  font-weight: 200;
  color: white;
  line-height: 1;
  text-shadow: 
    0 0 30px rgba(255, 255, 255, 0.6),
    0 0 60px rgba(255, 255, 255, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: -3px;
  font-family: 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.speed-unit {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  text-shadow: 
    0 0 15px rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0px;
  font-family: 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, sans-serif;
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
