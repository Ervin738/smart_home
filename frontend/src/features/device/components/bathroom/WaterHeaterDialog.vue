<!--
  热水器长按弹窗
  功能：显示热水器控制界面，包括水温显示、洗浴模式选择
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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

// 洗浴模式数据
const bathModes = [
  { id: 0, name: 'AI控温', icon: 'AI', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 1, name: '舒适洗', icon: '🚿', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 2, name: '厨房洗', icon: '∩', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 3, name: '儿童洗', icon: '👶', color: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)' },
  { id: 4, name: '宠物洗', icon: '🐕', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }
]

const selectedMode = computed<number>({
  get: () => (props.device as any)?.waterHeaterMode ?? 0,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { waterHeaterMode: v }) }
})
const currentTemp = ref(26) // 当前水温
const isHeating = computed<boolean>({
  get: () => (props.device as any)?.waterHeaterIsHeating ?? false,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { waterHeaterIsHeating: v }) }
})
const showManagement = ref(false) // 显示管理页面
const isDragging = ref(false) // 是否正在拖动滑块
const preheatEnabled = computed<boolean>({
  get: () => (props.device as any)?.waterHeaterPreheatEnabled ?? true,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { waterHeaterPreheatEnabled: v }) }
})
const preheatDuration = computed<number>({
  get: () => (props.device as any)?.waterHeaterPreheatDuration ?? 9,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { waterHeaterPreheatDuration: v }) }
})
const energySavingMode = ref(false) // 节能模式
const showDurationPicker = ref(false) // 显示预热时长选择器

let heatingInterval: number | null = null

// 使用computed从设备获取目标温度
const targetTemp = computed<number>({
  get: () => (props.device as any)?.targetTemp ?? 45,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setTargetTemp(props.device.id, value)
    }
  }
})

// 计算加热进度百分比
const heatingProgress = computed(() => {
  if (currentTemp.value >= targetTemp.value) return 100
  const progress = ((currentTemp.value - 20) / (targetTemp.value - 20)) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
})

// 监听设备状态变化，开启时开始加热，离线时停止并重置
watch(() => props.device?.status, (newStatus) => {
  if (!props.visible || !props.device) return
  
  if (newStatus === 'online') {
    startHeating()
  } else if (newStatus === 'offline') {
    stopHeating()
    currentTemp.value = 26
  }
})

// 监听弹窗打开，如果设备在线则开始加热
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.device?.status === 'online') {
    startHeating()
  } else if (!isVisible) {
    stopHeating()
  }
})

// 开始加热
const startHeating = () => {
  // 如果预热未开启，不加热
  if (!preheatEnabled.value) {
    isHeating.value = false
    return
  }
  
  if (heatingInterval) return
  
  isHeating.value = true
  heatingInterval = window.setInterval(() => {
    if (currentTemp.value < targetTemp.value) {
      // 每秒升温0.5度
      currentTemp.value = Math.min(targetTemp.value, currentTemp.value + 0.5)
    } else {
      isHeating.value = false
      if (heatingInterval) {
        clearInterval(heatingInterval)
        heatingInterval = null
      }
    }
  }, 1000)
}

// 停止加热
const stopHeating = () => {
  isHeating.value = false
  if (heatingInterval) {
    clearInterval(heatingInterval)
    heatingInterval = null
  }
}

// 切换预热开关（computed setter 不能直接用 !preheatEnabled.value 赋值，需要显式）
const togglePreheat = () => {
  preheatEnabled.value = !preheatEnabled.value
}

// 监听目标温度变化，如果设备在线且当前温度低于目标温度，重新开始加热
watch(targetTemp, (newTarget) => {
  if (props.device?.status === 'online' && currentTemp.value < newTarget) {
    stopHeating()
    startHeating()
  }
})

// 监听预热开关变化
watch(preheatEnabled, (enabled) => {
  if (enabled && props.device?.status === 'online' && currentTemp.value < targetTemp.value) {
    // 开启预热时，如果设备在线且温度未达标，开始加热
    startHeating()
  } else if (!enabled) {
    // 关闭预热时，停止加热
    stopHeating()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopHeating()
})

// 调整目标温度
const adjustTargetTemp = (delta: number) => {
  if (props.device?.status === 'offline') return
  targetTemp.value = Math.max(35, Math.min(65, targetTemp.value + delta))
}

// 滑块拖动
const handleSliderClick = (event: MouseEvent) => {
  if (props.device?.status === 'offline') return
  const slider = event.currentTarget as HTMLElement
  const rect = slider.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  targetTemp.value = Math.round(35 + percentage * 30) // 35-65℃
}

const handleSliderDragStart = (event: MouseEvent | TouchEvent) => {
  if (props.device?.status === 'offline') return
  isDragging.value = true
  event.preventDefault()
}

const handleSliderDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  const slider = document.querySelector('.temp-slider') as HTMLElement
  if (!slider) return
  
  const rect = slider.getBoundingClientRect()
  const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  targetTemp.value = Math.round(35 + percentage * 30) // 35-65℃
}

const handleSliderDragEnd = () => {
  isDragging.value = false
}

// 计算滑块位置百分比
const sliderPercentage = computed(() => {
  return ((targetTemp.value - 35) / 30) * 100
})

// 选择模式
const selectMode = (modeId: number) => {
  if (props.device?.status === 'offline') return
  selectedMode.value = modeId
  const mode = bathModes[modeId]
  if (mode) {
    console.log('选择洗浴模式:', mode.name)
  }
}

// 打开管理页面
const openManagement = () => {
  showManagement.value = true
}

// 打开预热时长设置
const openPreheatDuration = () => {
  showDurationPicker.value = true
}

// 关闭预热时长选择器
const closeDurationPicker = () => {
  showDurationPicker.value = false
}

// 调整预热时长
const adjustDuration = (delta: number) => {
  preheatDuration.value = Math.max(1, Math.min(60, preheatDuration.value + delta))
}

// 打开定时预热设置
const openScheduledPreheat = () => {
  emit('open-timer')
}

// 关闭管理页面
const closeManagement = () => {
  showManagement.value = false
}

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}
</script>

<template>
  <teleport to="body">
    <!-- 主弹窗 -->
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

          <!-- 水温显示区域 -->
          <div class="temp-display-section">
            <div class="temp-label">{{ device.status === 'online' ? '当前水温 (℃)' : '待机 | 目标' + targetTemp + '℃' }}</div>
            <div class="temp-value">{{ currentTemp }}</div>
            <div class="heating-status" :class="{ active: isHeating && preheatEnabled }" v-if="device.status === 'online'">
              {{ (isHeating && preheatEnabled) ? `预热中 | 目标${targetTemp}℃` : `待机 | 目标${targetTemp}℃` }}
            </div>
          </div>

          <!-- 关机按钮 -->
          <div class="power-section">
            <button 
              class="power-btn" 
              :class="{ active: device.status === 'online' }"
              @click="togglePower"
            >
              <span class="power-icon">⏻</span>
              <span class="power-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </button>
            
            <button 
              class="schedule-btn"
              @click="openScheduledPreheat"
            >
              <span class="schedule-icon">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="schedule-text">定时预热</span>
            </button>
          </div>

          <!-- 目标温度调节 -->
          <div class="temp-control-section">
            <div class="temp-control-header">
              <span class="control-label">目标温度</span>
              <span class="control-value">{{ targetTemp }}℃</span>
            </div>
            
            <div class="temp-slider-container">
              <button 
                class="temp-adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustTargetTemp(-1)"
              >
                <span>−</span>
              </button>
              
              <div 
                class="temp-slider"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleSliderClick"
                @mousedown="handleSliderDragStart"
                @mousemove="handleSliderDrag"
                @mouseup="handleSliderDragEnd"
                @mouseleave="handleSliderDragEnd"
                @touchstart="handleSliderDragStart"
                @touchmove="handleSliderDrag"
                @touchend="handleSliderDragEnd"
              >
                <div class="slider-track">
                  <div class="slider-fill" :style="{ width: sliderPercentage + '%' }"></div>
                </div>
              </div>
              
              <button 
                class="temp-adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustTargetTemp(1)"
              >
                <span>+</span>
              </button>
            </div>
          </div>

          <!-- 管理按钮 -->
          <div class="features-section">
            <!-- 预热开关 -->
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <div class="feature-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
              <div class="feature-label">预热</div>
              <div class="feature-control">
                <div 
                  class="toggle-switch" 
                  :class="{ active: preheatEnabled }"
                  @click="togglePreheat"
                >
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>

            <!-- 预热时长 -->
            <div class="feature-item clickable" @click="openPreheatDuration">
              <div class="feature-icon-wrapper">
                <div class="feature-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
              <div class="feature-label">预热时长</div>
              <div class="feature-value">
                <span>{{ preheatDuration }}分钟</span>
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 管理页面弹窗 -->
    <transition name="dialog">
      <div v-if="showManagement" class="dialog-overlay settings-overlay" @click="closeManagement">
        <div class="dialog-box settings-dialog" @click.stop>
          <div class="settings-header">
            <span class="settings-title">热水器管理</span>
            <button class="close-btn" @click="closeManagement">✕</button>
          </div>
          <div class="settings-content">
            <div class="setting-item">
              <span>目标温度设置</span>
              <span>{{ targetTemp }}℃</span>
            </div>
            <div class="setting-item">
              <span>预约加热</span>
              <span>未设置</span>
            </div>
            <div class="setting-item">
              <span>节能模式</span>
              <span>关闭</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 预热时长选择器弹窗 -->
    <transition name="dialog">
      <div v-if="showDurationPicker" class="dialog-overlay settings-overlay" @click="closeDurationPicker">
        <div class="dialog-box picker-dialog" @click.stop>
          <div class="picker-header">
            <span class="picker-title">预热时长</span>
            <button class="close-btn" @click="closeDurationPicker">✕</button>
          </div>
          <div class="picker-content">
            <button class="adjust-btn" @click="adjustDuration(-1)">-</button>
            <div class="picker-value">
              <span class="value-number">{{ preheatDuration }}</span>
              <span class="value-unit">分钟</span>
            </div>
            <button class="adjust-btn" @click="adjustDuration(1)">+</button>
          </div>
          <div class="picker-range">1 - 60 分钟</div>
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

.settings-overlay {
  background: rgba(0, 0, 0, 0.4);
  z-index: 2001;
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
  padding: 24px;
  width: 340px;
  max-width: 90vw;
  min-height: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 水温显示区域 */
.temp-display-section {
  text-align: center;
  padding: 20px 16px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.temp-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.temp-value {
  font-size: 56px;
  font-weight: 200;
  color: white;
  line-height: 1;
  margin-bottom: 10px;
}

.heating-status {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s;
}

.heating-status.active {
  color: #ffa751;
}

/* 关机按钮 */
.power-section {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
}

.power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex: 1;
}

.power-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.power-icon {
  font-size: 22px;
}

.schedule-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex: 1;
}

.schedule-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.schedule-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 目标温度调节 */
.temp-control-section {
  margin-bottom: 20px;
}

.temp-control-header {
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

.temp-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temp-adjust-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
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
}

.temp-adjust-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.temp-adjust-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.temp-slider {
  flex: 1;
  height: 44px;
  cursor: pointer;
  user-select: none;
}

.temp-slider.disabled {
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
  background: var(--bottom-bar-active-bg);
  border-radius: 24px 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.2s ease;
  min-width: 80px;
}

.slider-value {
  font-size: 20px;
  font-weight: 600;
  color: white;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.slider-max {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
}

/* 功能列表 */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-item.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.feature-item.clickable:hover {
  background: rgba(255, 255, 255, 0.03);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}

.feature-icon-wrapper {
  flex-shrink: 0;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.feature-icon.blue {
  background: var(--dialog-btn-active-bg-1);
}

.feature-icon.light-blue {
  background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%);
}

.feature-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: white;
}

.feature-control {
  flex-shrink: 0;
}

.feature-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

.toggle-switch {
  width: 52px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-switch.active {
  background: rgb(34, 197, 94);
}

.toggle-thumb {
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.toggle-switch.active .toggle-thumb {
  left: 24px;
}

/* 管理按钮 */
.management-section {
  display: flex;
  justify-content: center;
}

.management-btn {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.management-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 管理页面 */
.settings-dialog {
  width: 340px;
  max-width: 90vw;
  min-height: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: white;
  font-size: 15px;
}

/* 预热时长选择器 */
.picker-dialog {
  width: 360px;
  max-width: 90vw;
  min-height: auto;
  padding: 20px 24px 16px 24px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.picker-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.picker-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 20px;
}

.adjust-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adjust-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.adjust-btn:active {
  transform: scale(0.95);
}

.picker-value {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.value-number {
  font-size: 56px;
  font-weight: 200;
  color: white;
  line-height: 1;
}

.value-unit {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.picker-range {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0;
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
