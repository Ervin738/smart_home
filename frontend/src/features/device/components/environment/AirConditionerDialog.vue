<!--
  空调长按弹窗
  功能：显示空调详细控制界面，包括室内温湿度、开关、喜好、定时、模式等功能
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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

// 模拟室内温湿度数据
const indoorTemp = ref(27)
const indoorHumidity = ref(59)

// 空调设置温度 - 使用计算属性从设备获取
const targetTemp = computed({
  get: () => props.device?.targetTemp ?? 26,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setTargetTemp(props.device.id, value)
    }
  }
})

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

// 风速档位
const fanSpeeds = ['风速1', '风速2', '风速3', '自动']
const currentFanSpeed = ref(1) // 默认风速2
const isAutoMode = ref(false) // 是否为自动模式

// 按钮选中状态
const selectedFunctions = ref<string[]>([])

// 风向模式（扫风、防直吹、定向扫只能选一个）
const windMode = ref<string | null>(null)

// 切换空调模式
const toggleAcMode = () => {
  if (currentModeIndex.value === null) {
    currentModeIndex.value = 0
  } else {
    currentModeIndex.value = (currentModeIndex.value + 1) % acModes.length
  }
}

// 调节温度
const decreaseTemp = () => {
  if (targetTemp.value > 16) {
    targetTemp.value = targetTemp.value - 1
  }
}

const increaseTemp = () => {
  if (targetTemp.value < 32) {
    targetTemp.value = targetTemp.value + 1
  }
}

// 切换自动模式
const toggleAutoMode = () => {
  isAutoMode.value = !isAutoMode.value
  
  if (isAutoMode.value) {
    // 开启自动模式，随机选择一个风速档位
    currentFanSpeed.value = Math.floor(Math.random() * 3) // 随机0-2
  }
}

// 切换风速
const toggleFanSpeed = () => {
  currentFanSpeed.value = (currentFanSpeed.value + 1) % fanSpeeds.length
}

// 切换功能选择（多选）
const toggleFunction = (func: string) => {
  const index = selectedFunctions.value.indexOf(func)
  if (index > -1) {
    selectedFunctions.value.splice(index, 1)
  } else {
    selectedFunctions.value.push(func)
  }
}

// 切换风向模式（单选）
const toggleWindMode = (mode: string) => {
  if (windMode.value === mode) {
    // 如果点击的是当前激活的模式，则取消选中
    windMode.value = null
  } else {
    // 否则切换到新模式
    windMode.value = mode
  }
}

// 监听设备状态变化，关机时清除所有选中状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    selectedFunctions.value = []
    windMode.value = null
    // 关闭自动模式
    isAutoMode.value = false
  }
})
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content ac-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">空调</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="ac-layout">
          <!-- 室内温湿度显示 -->
          <div class="indoor-info">
            <div class="info-item">
              <div class="info-value">{{ indoorTemp }}</div>
              <div class="info-label">室内温度(℃)</div>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <div class="info-value">{{ indoorHumidity }}</div>
              <div class="info-label">相对湿度(%)</div>
            </div>
          </div>

          <!-- 电源开关和定时 -->
          <div class="ac-power-section">
            <div 
              class="ac-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="ac-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="ac-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
            
            <div 
              class="ac-power-btn"
              :class="{ 
                active: device.status === 'online' && (device.timerOffEnabled || device.timerOnEnabled),
                disabled: device.status === 'offline'
              }"
              @click="device.status === 'online' && emit('open-timer')"
            >
              <svg class="ac-power-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="ac-power-label">定时</span>
            </div>
          </div>

          <!-- 温度调节区域（仅在开机时显示） -->
          <transition name="expand">
            <div v-if="device.status === 'online'" class="temp-control-section">
              <!-- 当前模式标签 -->
              <div class="current-mode-label">{{ currentModeIndex !== null ? acModes[currentModeIndex] : '未选择模式' }}</div>
              
              <!-- 温度调节 -->
              <div class="temp-adjust-container">
                <button class="temp-adjust-btn" @click="decreaseTemp" :disabled="targetTemp <= 16">
                  <svg class="adjust-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                
                <div class="target-temp-display">
                  <span class="temp-value">{{ targetTemp }}</span>
                  <span class="temp-unit">°C</span>
                </div>
                
                <button class="temp-adjust-btn" @click="increaseTemp" :disabled="targetTemp >= 32">
                  <svg class="adjust-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              
              <!-- 风速控制 -->
              <div class="fan-speed-container">
                <div class="fan-speed-slider">
                  <input 
                    type="range" 
                    v-model.number="currentFanSpeed" 
                    min="0" 
                    max="2" 
                    step="1"
                    class="slider-input"
                    :disabled="isAutoMode"
                  />
                  <div class="slider-track">
                    <div class="slider-fill" :style="{ width: `${((currentFanSpeed + 1) / 3) * 100}%` }"></div>
                    <span class="slider-current-label">
                      风速{{ currentFanSpeed + 1 }}
                    </span>
                  </div>
                </div>
                <button class="auto-btn" :class="{ active: isAutoMode }" @click="toggleAutoMode">
                  自动
                </button>
              </div>
            </div>
          </transition>

          <!-- 功能按钮组 -->
          <div class="function-section">
            <!-- 第一行：模式、节能、睡眠 -->
            <div class="function-row">
              <!-- 模式按钮 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && currentModeIndex !== null,
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleAcMode()"
                >
                  <!-- 默认模式图标 -->
                  <svg v-if="currentModeIndex === null" class="function-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <!-- 制冷图标（雪花） -->
                  <svg v-else-if="currentModeIndex === 0" class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 7l-5 5-5-5M17 17l-5-5-5 5M2 12h20M7 7l5 5 5-5M7 17l5-5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- 制热图标（太阳） -->
                  <svg v-else-if="currentModeIndex === 1" class="function-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- 除湿图标（水滴） -->
                  <svg v-else-if="currentModeIndex === 2" class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="function-label">{{ currentModeIndex !== null ? acModes[currentModeIndex] : '模式' }}</span>
              </div>

              <!-- 节能 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && selectedFunctions.includes('eco'),
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleFunction('eco')"
                >
                  <svg class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8 2 5 5 5 9c0 4 3 7 7 7 0-4 3-7 7-7 0-4-3-7-7-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 16v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="function-label">节能</span>
              </div>

              <!-- 睡眠 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && selectedFunctions.includes('sleep'),
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleFunction('sleep')"
                >
                  <svg class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="function-label">睡眠</span>
              </div>
            </div>

            <!-- 第二行：扫风、防直吹、定向扫 -->
            <div class="function-row">
              <!-- 扫风 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && windMode === 'sweep',
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleWindMode('sweep')"
                >
                  <svg class="function-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="6" width="4" height="12" rx="1" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8h6M12 12h8M12 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="function-label">扫风</span>
              </div>

              <!-- 防直吹 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && windMode === 'noDirect',
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleWindMode('noDirect')"
                >
                  <svg class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="function-label">防直吹</span>
              </div>

              <!-- 定向扫 -->
              <div class="function-item">
                <div 
                  class="function-btn"
                  :class="{ 
                    active: device.status === 'online' && windMode === 'directional',
                    disabled: device.status === 'offline'
                  }"
                  @click="device.status === 'online' && toggleWindMode('directional')"
                >
                  <svg class="function-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 8v8M8 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="function-label">定向扫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    rgba(13, 13, 26, 0.95) 0%,
    rgba(26, 26, 46, 0.95) 25%,
    rgba(42, 58, 90, 0.95) 50%,
    rgba(58, 90, 122, 0.95) 75%,
    rgba(58, 106, 154, 0.95) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.ac-dialog {
  width: 380px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.device-info {
  flex: 1;
}

.device-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
}

.device-type-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.device-status-tag {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.device-status-tag.online {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.2) 100%);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.device-status-tag.offline {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(100, 116, 139, 0.15) 100%);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

/* 空调专用布局样式 */
.ac-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ac-power-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
}

.ac-power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 14px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ac-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.ac-power-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.ac-power-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.ac-power-icon {
  width: 16px;
  height: 16px;
}

.ac-power-label {
  font-size: 15px;
  font-weight: 600;
}

/* 温度调节区域 */
.temp-control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
}

.current-mode-label {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.temp-adjust-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.temp-adjust-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.temp-adjust-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.12) 100%
  );
  transform: scale(1.08);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.temp-adjust-btn:active:not(:disabled) {
  transform: scale(1.02);
}

.temp-adjust-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.adjust-icon {
  width: 18px;
  height: 18px;
}

.target-temp-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.temp-value {
  font-size: 52px;
  font-weight: 200;
  color: white;
  line-height: 1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: -2px;
}

.temp-unit {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 300;
  margin-bottom: 2px;
}

.fan-speed-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.fan-speed-slider {
  flex: 1;
  position: relative;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 2;
}

.slider-track {
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: visible;
  position: relative;
  border: none;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 172, 254, 0.95) 50%,
    rgba(99, 192, 255, 1) 100%
  );
  border-radius: 20px;
  transition: width 0.15s ease;
  pointer-events: none;
}

.slider-current-label {
  position: relative;
  font-size: 14px;
  font-weight: 600;
  color: white;
  z-index: 1;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.auto-btn {
  min-width: 70px;
  height: 40px;
  padding: 0 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.auto-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.auto-btn.active {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.9) 0%,
    rgba(79, 172, 254, 0.95) 50%,
    rgba(99, 192, 255, 1) 100%
  );
  color: white;
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* 室内温湿度显示 */
.indoor-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.info-value {
  font-size: 42px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.info-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.info-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
}

/* 功能按钮组 */
.function-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.function-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.function-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.function-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
}

.function-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.function-btn:active {
  transform: translateY(0);
}

.function-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.function-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.function-icon {
  width: 28px;
  height: 28px;
}

.function-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  text-align: center;
}

/* 弹窗动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
