<!--
  时钟长按弹窗
  功能：显示时钟控制界面，包括时间显示、闹钟设置等功能
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
  (e: 'update-alarm', data: { enabled: boolean; hour: number; minute: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const currentTime = ref('')
const currentDate = ref('')
const brightness = ref(80) // 亮度 0-100
const alarmEnabled = ref(false) // 闹钟开关
const alarmHour = ref(7) // 闹钟小时
const alarmMinute = ref(0) // 闹钟分钟

// 弹窗打开时从设备状态恢复
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    brightness.value = d.clockBrightness ?? 80
    alarmEnabled.value = d.alarmEnabled ?? false
    if (d.alarmTime) {
      const parts = (d.alarmTime as string).split(':').map(Number)
      alarmHour.value = parts[0] ?? 7
      alarmMinute.value = parts[1] ?? 0
    }
  }
}, { immediate: true })

// 离线时重置闹钟本地状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    alarmEnabled.value = false
    alarmHour.value = 7
    alarmMinute.value = 0
  }
})

// 拖动相关
const isDraggingHour = ref(false)
const isDraggingMinute = ref(false)
const dragStartY = ref(0)
const dragStartValue = ref(0)

let timeInterval: number | null = null

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 打开定时器
const openTimer = () => {
  console.log('ClockDialog: openTimer clicked')
  emit('open-timer')
}

// 调整亮度
const adjustBrightness = (delta: number) => {
  if (props.device?.status === 'offline') return
  brightness.value = Math.max(0, Math.min(100, brightness.value + delta))
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { clockBrightness: brightness.value })
}

// 切换闹钟
const toggleAlarm = () => {
  if (props.device?.status === 'offline') return
  alarmEnabled.value = !alarmEnabled.value
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { alarmEnabled: alarmEnabled.value })
  emitAlarmUpdate()
}

const emitAlarmUpdate = () => {
  emit('update-alarm', {
    enabled: alarmEnabled.value,
    hour: alarmHour.value,
    minute: alarmMinute.value
  })
}

// 小时拖动开始
const startDragHour = (e: MouseEvent | TouchEvent) => {
  if (props.device?.status === 'offline') return
  isDraggingHour.value = true
  dragStartY.value = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  dragStartValue.value = alarmHour.value
  document.addEventListener('mousemove', onDragHour)
  document.addEventListener('mouseup', stopDragHour)
  document.addEventListener('touchmove', onDragHour)
  document.addEventListener('touchend', stopDragHour)
}

const onDragHour = (e: MouseEvent | TouchEvent) => {
  if (!isDraggingHour.value) return
  const currentY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  const deltaY = dragStartY.value - currentY
  const steps = Math.round(deltaY / 10)
  let newValue = dragStartValue.value + steps
  if (newValue < 0) newValue = 23
  if (newValue > 23) newValue = 0
  alarmHour.value = newValue
}

const stopDragHour = () => {
  isDraggingHour.value = false
  document.removeEventListener('mousemove', onDragHour)
  document.removeEventListener('mouseup', stopDragHour)
  document.removeEventListener('touchmove', onDragHour)
  document.removeEventListener('touchend', stopDragHour)
  if (alarmEnabled.value) emitAlarmUpdate()
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { alarmTime: `${String(alarmHour.value).padStart(2,'0')}:${String(alarmMinute.value).padStart(2,'0')}` })
}

// 分钟拖动开始
const startDragMinute = (e: MouseEvent | TouchEvent) => {
  if (props.device?.status === 'offline') return
  isDraggingMinute.value = true
  dragStartY.value = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  dragStartValue.value = alarmMinute.value
  document.addEventListener('mousemove', onDragMinute)
  document.addEventListener('mouseup', stopDragMinute)
  document.addEventListener('touchmove', onDragMinute)
  document.addEventListener('touchend', stopDragMinute)
}

const onDragMinute = (e: MouseEvent | TouchEvent) => {
  if (!isDraggingMinute.value) return
  const currentY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
  const deltaY = dragStartY.value - currentY
  const steps = Math.round(deltaY / 5)
  let newValue = dragStartValue.value + steps
  if (newValue < 0) newValue = 59
  if (newValue > 59) newValue = 0
  alarmMinute.value = newValue
}

const stopDragMinute = () => {
  isDraggingMinute.value = false
  document.removeEventListener('mousemove', onDragMinute)
  document.removeEventListener('mouseup', stopDragMinute)
  document.removeEventListener('touchmove', onDragMinute)
  document.removeEventListener('touchend', stopDragMinute)
  if (alarmEnabled.value) emitAlarmUpdate()
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { alarmTime: `${String(alarmHour.value).padStart(2,'0')}:${String(alarmMinute.value).padStart(2,'0')}` })
}

// 调整小时
const adjustHour = (delta: number) => {
  if (props.device?.status === 'offline') return
  let newValue = alarmHour.value + delta
  if (newValue < 0) newValue = 23
  if (newValue > 23) newValue = 0
  alarmHour.value = newValue
  if (alarmEnabled.value) emitAlarmUpdate()
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { alarmTime: `${String(alarmHour.value).padStart(2,'0')}:${String(alarmMinute.value).padStart(2,'0')}` })
}

// 调整分钟
const adjustMinute = (delta: number) => {
  if (props.device?.status === 'offline') return
  let newValue = alarmMinute.value + delta
  if (newValue < 0) newValue = 59
  if (newValue > 59) newValue = 0
  alarmMinute.value = newValue
  if (alarmEnabled.value) emitAlarmUpdate()
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { alarmTime: `${String(alarmHour.value).padStart(2,'0')}:${String(alarmMinute.value).padStart(2,'0')}` })
}

// 格式化时间显示
const formatTime = (value: number) => {
  return value.toString().padStart(2, '0')
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
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
              <div class="device-status" :class="device.status">
                {{ device.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
          </div>

          <!-- 时间显示 -->
          <div class="time-display">
            <div class="current-time">{{ currentTime }}</div>
            <div class="current-date">{{ currentDate }}</div>
          </div>

          <!-- 亮度调节 -->
          <div class="brightness-control">
            <div class="control-header">
              <span class="control-label">亮度</span>
              <span class="control-value">{{ brightness }}%</span>
            </div>
            
            <div class="slider-container">
              <div 
                class="adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustBrightness(-5)"
              >
                <span>−</span>
              </div>
              
              <div 
                class="slider-wrapper"
                :class="{ disabled: device.status === 'offline' }"
              >
                <div class="slider-track">
                  <div class="slider-fill" :style="{ width: brightness + '%' }"></div>
                </div>
                <input 
                  type="range" 
                  v-model.number="brightness" 
                  min="0" 
                  max="100" 
                  class="slider-input"
                  :disabled="device.status === 'offline'"
                  @input="devicesStore.setDeviceExtra(device.id, { clockBrightness: brightness })"
                />
              </div>
              
              <div 
                class="adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustBrightness(5)"
              >
                <span>+</span>
              </div>
            </div>
          </div>

          <!-- 闹钟设置 -->
          <div class="alarm-section">
            <div class="alarm-header">
              <div class="alarm-info">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="13" r="7" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 9v4l2 2M5 3L2 6M19 3l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="alarm-label">闹钟</span>
              </div>
              <div 
                class="alarm-toggle"
                :class="{ active: alarmEnabled, disabled: device.status === 'offline' }"
                @click="toggleAlarm"
              >
                <div class="toggle-slider"></div>
              </div>
            </div>
            
            <div v-if="alarmEnabled" class="alarm-time-setting">
              <div class="time-picker">
                <!-- 小时选择 -->
                <div class="time-unit">
                  <div 
                    class="time-value"
                    :class="{ dragging: isDraggingHour, disabled: device.status === 'offline' }"
                    @mousedown="startDragHour"
                    @touchstart="startDragHour"
                  >
                    {{ formatTime(alarmHour) }}
                  </div>
                  <div class="time-controls">
                    <div 
                      class="time-btn"
                      :class="{ disabled: device.status === 'offline' }"
                      @click="adjustHour(1)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div 
                      class="time-btn"
                      :class="{ disabled: device.status === 'offline' }"
                      @click="adjustHour(-1)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <span class="time-separator">:</span>

                <!-- 分钟选择 -->
                <div class="time-unit">
                  <div 
                    class="time-value"
                    :class="{ dragging: isDraggingMinute, disabled: device.status === 'offline' }"
                    @mousedown="startDragMinute"
                    @touchstart="startDragMinute"
                  >
                    {{ formatTime(alarmMinute) }}
                  </div>
                  <div class="time-controls">
                    <div 
                      class="time-btn"
                      :class="{ disabled: device.status === 'offline' }"
                      @click="adjustMinute(1)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div 
                      class="time-btn"
                      :class="{ disabled: device.status === 'offline' }"
                      @click="adjustMinute(-1)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 功能按钮 -->
          <div class="action-buttons">
            <div 
              class="action-btn"
              :class="{ active: device.status === 'online' }"
              @click="togglePower"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
            
            <div 
              class="action-btn"
              @click="openTimer"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>定时</span>
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
  margin-bottom: 6px;
}

.device-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.device-status.online {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.device-status.offline {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

/* 时间显示 */
.time-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.current-time {
  font-size: 56px;
  font-weight: 200;
  color: white;
  line-height: 1;
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
}

.current-date {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

/* 亮度调节 */
.brightness-control {
  margin-bottom: 16px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.control-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.adjust-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 26px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}

.adjust-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.adjust-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.slider-wrapper {
  flex: 1;
  height: 44px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.slider-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.slider-track {
  position: relative;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--slider-active-color-1) 0%, var(--slider-active-color-3) 100%);
  border-radius: 24px;
  transition: width 0.2s ease;
  min-width: 10px;
}

.slider-input {
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

/* 闹钟设置 */
.alarm-section {
  margin-bottom: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.alarm-label {
  font-size: 16px;
  font-weight: 500;
}

.alarm-toggle {
  position: relative;
  width: 52px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.alarm-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.alarm-toggle.active {
  background: var(--dialog-btn-active-bg-1);
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.alarm-toggle.active .toggle-slider {
  transform: translateX(24px);
}

.alarm-time-setting {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border-radius: 16px;
}

.time-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-value {
  font-size: 32px;
  font-weight: 300;
  color: white;
  min-width: 60px;
  text-align: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: grab;
  user-select: none;
  transition: all 0.2s;
  font-variant-numeric: tabular-nums;
}

.time-value:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.time-value.dragging {
  cursor: grabbing;
  background: var(--dialog-btn-active-light-bg-1);
  transform: scale(1.05);
}

.time-value.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-separator {
  font-size: 32px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 2px;
}

.time-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);
}

.time-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.time-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.time-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

/* 功能按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.action-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
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
