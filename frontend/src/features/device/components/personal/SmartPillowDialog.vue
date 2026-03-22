<!--
  智能枕头长按弹窗
  功能：显示智能枕头控制界面，包括自动模式、加热模式、时间调节
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const autoMode = ref(0) // 自动模式 0-颈部按摩 1-深度拉伸
const heatingMode = ref(1) // 加热模式 0-关闭 1-1档 2-2档
const timeAdjust = ref(15) // 时间调节 5-30分钟
const gearLevel = ref(3) // 挡位调节 1-5档

// 当设备改变时，恢复该设备的状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    autoMode.value = props.device.pillowAutoMode ?? 0
    heatingMode.value = props.device.pillowHeatingMode ?? 1
    timeAdjust.value = props.device.pillowTimeAdjust ?? 15
    gearLevel.value = props.device.pillowGearLevel ?? 3
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    autoMode.value = props.device.pillowAutoMode ?? 0
    heatingMode.value = props.device.pillowHeatingMode ?? 1
    timeAdjust.value = props.device.pillowTimeAdjust ?? 15
    gearLevel.value = props.device.pillowGearLevel ?? 3
  }
})

// 离线时重置本地状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    autoMode.value = 0
    heatingMode.value = 0
    gearLevel.value = 1
  }
})

// 关闭弹窗
const close = () => {
  // 保存当前状态到设备
  if (props.device) {
    devicesStore.setSmartPillowAutoMode(props.device.id, autoMode.value)
    devicesStore.setSmartPillowHeatingMode(props.device.id, heatingMode.value)
    devicesStore.setSmartPillowTimeAdjust(props.device.id, timeAdjust.value)
    devicesStore.setSmartPillowGearLevel(props.device.id, gearLevel.value)
  }
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 选择自动模式
const selectAutoMode = (mode: number) => {
  if (props.device?.status === 'offline') return
  autoMode.value = mode
  if (props.device) {
    devicesStore.setSmartPillowAutoMode(props.device.id, mode)
  }
}

// 选择加热模式
const selectHeatingMode = (mode: number) => {
  if (props.device?.status === 'offline') return
  heatingMode.value = mode
  if (props.device) {
    devicesStore.setSmartPillowHeatingMode(props.device.id, mode)
  }
}

// 调整时间
const onTimeAdjustChange = (value: number) => {
  timeAdjust.value = value
  if (props.device) {
    devicesStore.setSmartPillowTimeAdjust(props.device.id, value)
  }
}

// 调整挡位
const onGearLevelChange = (value: number) => {
  gearLevel.value = value
  if (props.device) {
    devicesStore.setSmartPillowGearLevel(props.device.id, value)
  }
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

          <!-- 电源按钮 -->
          <div class="power-section">
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
          </div>

          <!-- 自动模式 -->
          <div class="mode-section">
            <div class="section-title">自动模式</div>
            <div class="mode-options">
              <div 
                class="mode-option" 
                :class="{ active: autoMode === 0, disabled: device.status === 'offline' }"
                @click="selectAutoMode(0)"
              >
                <div class="mode-icon-wrapper">
                  <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="mode-label">颈部按摩</div>
              </div>
              <div 
                class="mode-option" 
                :class="{ active: autoMode === 1, disabled: device.status === 'offline' }"
                @click="selectAutoMode(1)"
              >
                <div class="mode-icon-wrapper">
                  <svg class="mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 11v6M9 14l3-3 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="mode-label">深度拉伸</div>
              </div>
            </div>
          </div>

          <!-- 加热模式 -->
          <div class="heating-section">
            <div class="section-title">加热模式 | {{ heatingMode === 0 ? '关闭' : heatingMode + '档' }}</div>
            <div class="heating-options">
              <button 
                class="heating-btn" 
                :class="{ active: heatingMode === 0 }"
                :disabled="device.status === 'offline'"
                @click="selectHeatingMode(0)"
              >
                关闭
              </button>
              <button 
                class="heating-btn" 
                :class="{ active: heatingMode === 1 }"
                :disabled="device.status === 'offline'"
                @click="selectHeatingMode(1)"
              >
                1档
              </button>
              <button 
                class="heating-btn" 
                :class="{ active: heatingMode === 2 }"
                :disabled="device.status === 'offline'"
                @click="selectHeatingMode(2)"
              >
                2档
              </button>
            </div>
          </div>

          <!-- 时间调节 -->
          <div class="time-section">
            <div class="section-title">时间调节 | {{ timeAdjust }}分钟</div>
            <div class="time-slider-container">
              <span class="time-min">5</span>
              <div class="time-slider-track">
                <div class="time-slider-fill" :style="{ width: `${((timeAdjust - 5) / 25) * 100}%` }"></div>
                <input 
                  type="range" 
                  v-model.number="timeAdjust" 
                  min="5" 
                  max="30" 
                  step="5"
                  class="time-slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onTimeAdjustChange(timeAdjust)"
                />
              </div>
              <span class="time-max">30</span>
            </div>
          </div>

          <!-- 挡位调节 -->
          <div class="gear-section">
            <div class="section-title">挡位调节 | {{ gearLevel }}档</div>
            <div class="gear-slider-container">
              <span class="gear-min">1</span>
              <div class="gear-slider-track">
                <div class="gear-slider-fill" :style="{ width: `${((gearLevel - 1) / 4) * 100}%` }"></div>
                <input 
                  type="range" 
                  v-model.number="gearLevel" 
                  min="1" 
                  max="5" 
                  step="1"
                  class="gear-slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onGearLevelChange(gearLevel)"
                />
              </div>
              <span class="gear-max">5</span>
            </div>
          </div>
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

/* 电源按钮 */
.power-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
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

/* 区域标题 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

/* 自动模式 */
.mode-section {
  margin-bottom: 16px;
}

.mode-options {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.mode-option {
  flex: 1;
  max-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.mode-option.active {
  background: var(--dialog-btn-active-bg-1);
}

.mode-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.mode-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--dialog-btn-active-bg-1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.mode-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 加热模式 */
.heating-section {
  margin-bottom: 16px;
}

.heating-options {
  display: flex;
  gap: 8px;
}

.heating-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.heating-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.heating-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.heating-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 时间调节 */
.time-section {
  margin-bottom: 16px;
}

.time-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-min,
.time-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 20px;
}

.time-slider-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
}

.time-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--bottom-bar-active-bg);
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
}

.time-slider-input {
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

.time-slider-input:disabled {
  cursor: not-allowed;
}

/* 挡位调节 */
.gear-section {
  margin-bottom: 0;
}

.gear-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gear-min,
.gear-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 20px;
}

.gear-slider-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
}

.gear-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--bottom-bar-active-bg);
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
}

.gear-slider-input {
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

.gear-slider-input:disabled {
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
