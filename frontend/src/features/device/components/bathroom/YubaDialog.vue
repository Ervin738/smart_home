<!--
  浴霸长按弹窗
  功能：显示浴霸控制界面，包括照明、换气、暖风、温度调节等功能
-->
<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @click="close">
        <div class="dialog-box" @click.stop>
          <div class="dialog-header">
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
            </div>
            <div class="device-status" :class="device.status">
              {{ device.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>

          <!-- 环境温度显示 -->
          <div class="temperature-display">
            <div class="temp-label">环境温度</div>
            <div class="temp-value">
              <span class="temp-number">{{ temperature }}</span>
              <span class="temp-unit">°C</span>
            </div>
          </div>

          <!-- 当前模式显示 -->
          <div v-if="activeModes" class="active-modes">
            {{ activeModes }}
          </div>

          <!-- 控制按钮 -->
          <div class="control-buttons">
            <button 
              class="control-btn"
              :class="{ active: device.status === 'online' }"
              @click="handleYubaToggle"
            >
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="control-text">{{ device.status === 'online' ? '停止浴霸' : '开启浴霸' }}</span>
            </button>

            <button 
              class="control-btn"
              :class="{ active: lightEnabled, disabled: device.status === 'offline' }"
              @click="handleLightToggle"
            >
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="control-text">开启照明</span>
            </button>
          </div>

          <!-- 彩光模式 -->
          <div class="color-mode-section">
            <div class="section-title">彩光模式</div>
            <div class="color-mode-toggle">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="colorModeEnabled"
                  :disabled="device.status === 'offline'"
                  @change="devicesStore.setDeviceExtra(device.id, { yubaColorModeEnabled: colorModeEnabled })"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 暖风/吹风切换 -->
          <div class="wind-mode-section">
            <button 
              class="wind-mode-btn"
              :class="{ active: windMode === 'warm', disabled: device.status === 'offline' }"
              @click="setWindMode('warm')"
            >
              暖风
            </button>
            <button 
              class="wind-mode-btn"
              :class="{ active: windMode === 'blow', disabled: device.status === 'offline' }"
              @click="setWindMode('blow')"
            >
              吹风
            </button>
          </div>

          <!-- 风力模式按钮 -->
          <div class="wind-level-buttons">
            <button 
              class="wind-level-btn"
              :class="{ active: currentWindLevel === 'low', disabled: device.status === 'offline' }"
              @click="setWindLevel('low')"
            >
              <svg class="wind-level-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <span class="wind-level-text">{{ windMode === 'warm' ? '暖风低挡' : '吹风低挡' }}</span>
            </button>

            <button 
              class="wind-level-btn"
              :class="{ active: currentWindLevel === 'high', disabled: device.status === 'offline' }"
              @click="setWindLevel('high')"
            >
              <svg class="wind-level-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="wind-level-text">{{ windMode === 'warm' ? '暖风高挡' : '吹风高挡' }}</span>
            </button>

            <button 
              class="wind-level-btn"
              :class="{ active: currentWindLevel === 'natural', disabled: device.status === 'offline' }"
              @click="setWindLevel('natural')"
            >
              <svg class="wind-level-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2c-1.5 0-2.5 1-2.5 2.5S10.5 7 12 7s2.5-1 2.5-2.5S13.5 2 12 2z" stroke="currentColor" stroke-width="2"/>
                <path d="M8 10c-2 0-3 1.5-3 3s1 3 3 3 3-1.5 3-3-1-3-3-3zM16 10c2 0 3 1.5 3 3s-1 3-3 3-3-1.5-3-3 1-3 3-3z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span class="wind-level-text">自然风</span>
            </button>
          </div>

          <!-- 换气功能区域 -->
          <div class="ventilation-section">
            <div class="section-title">换气</div>
            <div class="ventilation-buttons">
              <button 
                class="ventilation-btn"
                :class="{ active: ventilationLevel === 'low', disabled: device.status === 'offline' }"
                @click="setVentilationLevel('low')"
              >
                <span class="ventilation-text">换气低挡</span>
              </button>

              <button 
                class="ventilation-btn"
                :class="{ active: ventilationLevel === 'high', disabled: device.status === 'offline' }"
                @click="setVentilationLevel('high')"
              >
                <span class="ventilation-text">换气高挡</span>
              </button>
            </div>
          </div>

          <!-- 浴霸延时关闭 -->
          <div class="delay-shutdown-section" :class="{ disabled: device.status === 'offline' }">
            <div class="delay-header">
              <div class="delay-icon-wrapper">
                <svg class="delay-icon-svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="delay-label-text">浴霸延时</span>
              <label class="delay-toggle">
                <input 
                  type="checkbox" 
                  v-model="yubaDelayEnabled"
                  :disabled="device.status === 'offline'"
                  @change="toggleYubaDelayShutdown"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div v-if="yubaDelayEnabled" class="delay-time-display" @click="openYubaDelayTimePicker">
              <span class="delay-time-label">延迟时间</span>
              <span class="delay-time-value">{{ yubaDelayTime }}</span>
            </div>
          </div>

          <!-- 照明延时关闭 -->
          <div class="delay-shutdown-section" :class="{ disabled: device.status === 'offline' }">
            <div class="delay-header">
              <div class="delay-icon-wrapper">
                <svg class="delay-icon-svg" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="delay-label-text">照明延时</span>
              <label class="delay-toggle">
                <input 
                  type="checkbox" 
                  v-model="lightDelayEnabled"
                  :disabled="device.status === 'offline'"
                  @change="toggleLightDelayShutdown"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div v-if="lightDelayEnabled" class="delay-time-display" @click="openLightDelayTimePicker">
              <span class="delay-time-label">延迟时间</span>
              <span class="delay-time-value">{{ lightDelayTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- 浴霸延时时间选择器 -->
  <teleport to="body">
    <transition name="dialog">
      <div v-if="showYubaDelayTimePicker" class="dialog-overlay-picker" @click="showYubaDelayTimePicker = false">
        <div class="time-picker-dialog" @click.stop>
          <div class="time-picker-header">
            <span>选择浴霸延时时间</span>
          </div>
          <div class="time-picker-options">
            <button
              v-for="(option, index) in delayTimeOptions"
              :key="index"
              class="time-option"
              :class="{ active: yubaDelayTimeIndex === index }"
              @click="selectYubaDelayTime(index)"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- 照明延时时间选择器 -->
  <teleport to="body">
    <transition name="dialog">
      <div v-if="showLightDelayTimePicker" class="dialog-overlay-picker" @click="showLightDelayTimePicker = false">
        <div class="time-picker-dialog" @click.stop>
          <div class="time-picker-header">
            <span>选择照明延时时间</span>
          </div>
          <div class="time-picker-options">
            <button
              v-for="(option, index) in delayTimeOptions"
              :key="index"
              class="time-option"
              :class="{ active: lightDelayTimeIndex === index }"
              @click="selectLightDelayTime(index)"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const devicesStore = useDevicesStore()

interface Props {
  visible: boolean
  device: Device | null
  windMode?: 'warm' | 'blow'
  ventilationEnabled?: boolean
  heatingEnabled?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'update:windMode', value: 'warm' | 'blow'): void
  (e: 'open-timer'): void
}

const props = withDefaults(defineProps<Props>(), {
  windMode: 'warm',
  ventilationEnabled: false,
  heatingEnabled: false
})
const emit = defineEmits<Emits>()

const temperature = ref(12)
const lightEnabled = ref(false)
const colorModeEnabled = ref(false)
// 暖风和吹风各自独立的档位状态
const warmWindLevel = ref<'low' | 'high' | 'natural'>('low')
const blowWindLevel = ref<'low' | 'high' | 'natural'>('low')
// 换气档位状态
const ventilationLevel = ref<'low' | 'high'>('low')

// 计算当前显示的档位（根据暖风/吹风模式）
const currentWindLevel = computed(() => {
  return props.windMode === 'warm' ? warmWindLevel.value : blowWindLevel.value
})

// 计算当前激活的模式文本
const activeModes = computed(() => {
  // 离线状态不显示任何模式
  if (props.device?.status === 'offline') {
    return ''
  }
  
  const modes: string[] = []
  
  // 根据底部弹窗的按钮状态显示
  if (props.ventilationEnabled) {
    modes.push('换气')
  }
  if (props.heatingEnabled) {
    modes.push('暖风')
  }
  
  // 如果没有选中任何按钮，不显示
  if (modes.length === 0) {
    return ''
  }
  
  return modes.join(' | ') + '已开启'
})

// 每次打开弹窗时重置状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    lightEnabled.value = d.yubaLightEnabled ?? false
    colorModeEnabled.value = d.yubaColorModeEnabled ?? false
    warmWindLevel.value = d.yubaWarmWindLevel ?? 'low'
    blowWindLevel.value = d.yubaBlowWindLevel ?? 'low'
    ventilationLevel.value = d.yubaVentilationLevel ?? 'low'
  }
})

// 设备离线时重置本地状态
watch(() => props.device?.status, (status) => {
  if (status === 'offline') {
    lightEnabled.value = false
    colorModeEnabled.value = false
    warmWindLevel.value = 'low'
    blowWindLevel.value = 'low'
    ventilationLevel.value = 'low'
    yubaDelayEnabled.value = false
  }
})

const close = () => {
  emit('update:visible', false)
}

const handleYubaToggle = () => {
  // 切换设备在线/离线状态
  emit('toggle-power')
}

const handleLightToggle = () => {
  if (props.device?.status === 'offline') return
  lightEnabled.value = !lightEnabled.value
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { yubaLightEnabled: lightEnabled.value })
}

const setWindMode = (mode: 'warm' | 'blow') => {
  if (props.device?.status === 'offline') return
  console.log('[长按弹窗] 切换暖风/吹风模式:', mode)
  emit('update:windMode', mode)
}

const setWindLevel = (level: 'low' | 'high' | 'natural') => {
  if (props.device?.status === 'offline') return
  console.log('[长按弹窗] 切换风力档位:', level, '当前模式:', props.windMode)
  if (props.windMode === 'warm') {
    warmWindLevel.value = level
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { yubaWarmWindLevel: level })
  } else {
    blowWindLevel.value = level
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { yubaBlowWindLevel: level })
  }
}

const setVentilationLevel = (level: 'low' | 'high') => {
  if (props.device?.status === 'offline') return
  console.log('[长按弹窗] 切换换气档位:', level)
  ventilationLevel.value = level
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { yubaVentilationLevel: level })
}

// 浴霸延时关闭
const yubaDelayEnabled = ref(false)
const yubaDelayTimeIndex = ref(0)
const showYubaDelayTimePicker = ref(false)
const delayTimeOptions = ['15分钟', '30分钟', '1小时', '2小时']
const delayTimeMinutes = [15, 30, 60, 120]
const yubaDelayTime = computed(() => delayTimeOptions[yubaDelayTimeIndex.value])

const toggleYubaDelayShutdown = () => {
  console.log('[浴霸延时] 切换状态', yubaDelayEnabled.value)
  if (!props.device || props.device.status === 'offline') {
    yubaDelayEnabled.value = false
    return
  }
  
  devicesStore.setYubaDelayShutdown(
    props.device.id,
    yubaDelayEnabled.value,
    yubaDelayEnabled.value ? delayTimeMinutes[yubaDelayTimeIndex.value] : undefined
  )
}

const openYubaDelayTimePicker = () => {
  showYubaDelayTimePicker.value = true
}

const selectYubaDelayTime = (index: number) => {
  yubaDelayTimeIndex.value = index
  showYubaDelayTimePicker.value = false
  if (yubaDelayEnabled.value && props.device) {
    devicesStore.setYubaDelayShutdown(
      props.device.id,
      true,
      delayTimeMinutes[index]
    )
  }
}

// 照明延时关闭
const lightDelayEnabled = ref(false)
const lightDelayTimeIndex = ref(0)
const showLightDelayTimePicker = ref(false)
const lightDelayTime = computed(() => delayTimeOptions[lightDelayTimeIndex.value])

const toggleLightDelayShutdown = () => {
  console.log('[照明延时] 切换状态', lightDelayEnabled.value)
  if (!props.device || props.device.status === 'offline') {
    lightDelayEnabled.value = false
    return
  }
  
  devicesStore.setLightDelayShutdown(
    props.device.id,
    lightDelayEnabled.value,
    lightDelayEnabled.value ? delayTimeMinutes[lightDelayTimeIndex.value] : undefined
  )
}

const openLightDelayTimePicker = () => {
  showLightDelayTimePicker.value = true
}

const selectLightDelayTime = (index: number) => {
  lightDelayTimeIndex.value = index
  showLightDelayTimePicker.value = false
  if (lightDelayEnabled.value && props.device) {
    devicesStore.setLightDelayShutdown(
      props.device.id,
      true,
      delayTimeMinutes[index]
    )
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
}

.dialog-box {
  background: linear-gradient(135deg, var(--dialog-bg-1) 0%, var(--dialog-bg-2) 50%, var(--dialog-bg-3) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  width: 340px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: visible;
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

/* 环境温度显示 */
.temperature-display {
  text-align: center;
  padding: 20px 20px 12px;
  margin-bottom: 0;
}

.temp-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.temp-value {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
}

.temp-number {
  font-size: 56px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.temp-unit {
  font-size: 20px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 6px;
}

/* 当前模式显示 */
.active-modes {
  text-align: center;
  padding: 8px 20px 12px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
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
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.control-icon {
  width: 20px;
  height: 20px;
}

.control-text {
  font-size: 15px;
  font-weight: 600;
}

/* 暖风/吹风切换 */
.wind-mode-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.wind-mode-btn {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
}

.wind-mode-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.wind-mode-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 风力模式按钮 */
.wind-level-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.wind-level-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.wind-level-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.wind-level-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.wind-level-icon {
  width: 24px;
  height: 24px;
}

.wind-level-text {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* 彩光模式 */
.color-mode-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

/* 换气功能区域 */
.ventilation-section {
  margin-bottom: 16px;
}

.ventilation-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  padding-left: 4px;
}

.ventilation-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ventilation-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.ventilation-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.ventilation-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.ventilation-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 延时关闭 */
.delay-shutdown-section {
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-top: 16px;
  transition: opacity 0.3s ease;
}

.delay-shutdown-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.delay-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delay-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.delay-icon-svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.delay-label-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: white;
}

.delay-time-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: transparent;
  border-radius: 12px;
  margin-left: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
  padding-top: 16px;
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
}

.delay-time-display:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.99);
}

.delay-time-label {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

.delay-time-value {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

/* 彩光模式开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch .toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-switch .toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--dialog-btn-active-bg-1);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 延时关闭开关 */
.delay-toggle {
  position: relative;
  width: 52px;
  height: 30px;
  cursor: pointer;
}

.delay-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.delay-toggle .toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  transition: all 0.3s ease;
}

.delay-toggle .toggle-slider:before {
  content: '';
  position: absolute;
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 3px;
  background: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delay-toggle input:checked + .toggle-slider {
  background: var(--dialog-btn-active-bg-1);
}

.delay-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.delay-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 时间选择器弹窗遮罩层 */
.dialog-overlay-picker {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

/* 时间选择器弹窗 */
.time-picker-dialog {
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  min-width: 300px;
}

.time-picker-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.time-picker-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-option {
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.time-option:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.time-option.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.time-option.active:hover {
  background: var(--dialog-btn-active-bg-1);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--dialog-btn-active-shadow);
}

.dialog-enter-active, .dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from, .dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-box, .dialog-leave-to .dialog-box {
  transform: scale(0.9);
}
</style>
