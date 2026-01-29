<!--
  电暖器长按弹窗
  功能：显示电暖器详细控制界面，包括开关、目标温度调节
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'update:targetTemp', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const targetTemp = ref(25)

// 监听设备对象的目标温度变化，实时同步
watch(() => props.device?.targetTemp, (newTemp) => {
  if (newTemp !== undefined) {
    targetTemp.value = newTemp
  }
})

// 当设备改变时，恢复该设备的温度状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    targetTemp.value = props.device.targetTemp ?? 25
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    targetTemp.value = props.device.targetTemp ?? 25
  }
})

// 延时关闭状态
const delayShutdownEnabled = ref(false)
const delayTimeOptions = ['30分钟', '1小时', '2小时', '3小时']
const delayTimeMinutes = [30, 60, 120, 180]
const delayTimeIndex = ref(1) // 默认 1小时
const delayTime = computed(() => delayTimeOptions[delayTimeIndex.value])
const showDelayTimePicker = ref(false)

// 监听设备变化，同步延时关闭状态
watch(() => props.device, (device) => {
  if (device) {
    // 如果设备关闭，自动禁用延时关闭
    if (device.status === 'offline' && device.delayShutdownEnabled) {
      devicesStore.setDelayShutdown(device.id, false)
      delayShutdownEnabled.value = false
    } else {
      delayShutdownEnabled.value = device.delayShutdownEnabled || false
    }
    // 根据延时关闭时长设置索引
    if (device.delayShutdownDuration) {
      const index = delayTimeMinutes.indexOf(device.delayShutdownDuration)
      if (index !== -1) {
        delayTimeIndex.value = index
      }
    }
  }
}, { immediate: true })

// 监听设备状态变化，设备关闭时自动关闭延时关闭按钮
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && delayShutdownEnabled.value) {
    delayShutdownEnabled.value = false
    if (props.device) {
      devicesStore.setDelayShutdown(props.device.id, false)
    }
  }
})

const decreaseTemp = () => {
  if (targetTemp.value > 16) {
    const newTemp = targetTemp.value - 1
    targetTemp.value = newTemp
    emit('update:targetTemp', newTemp)
  }
}

const increaseTemp = () => {
  if (targetTemp.value < 32) {
    const newTemp = targetTemp.value + 1
    targetTemp.value = newTemp
    emit('update:targetTemp', newTemp)
  }
}

// 根据温度计算渐变色
const getTempGradient = (temp: number) => {
  // 温度范围 16-32，计算百分比
  const percentage = (temp - 16) / (32 - 16)
  
  // 从浅橙色到深橙红色
  if (percentage <= 0.33) {
    // 低温：浅橙色
    return 'linear-gradient(90deg, #ffb366 0%, #ff9a3c 100%)'
  } else if (percentage <= 0.66) {
    // 中温：橙色
    return 'linear-gradient(90deg, #ff9a3c 0%, #ff7a1f 100%)'
  } else {
    // 高温：深橙红色
    return 'linear-gradient(90deg, #ff7a1f 0%, #ff5500 100%)'
  }
}

// 切换延时关闭
const toggleDelayShutdown = () => {
  // 只有在设备开启状态时才能启用延时关闭
  if (props.device?.status !== 'online' && !delayShutdownEnabled.value) {
    return
  }
  
  delayShutdownEnabled.value = !delayShutdownEnabled.value
  if (props.device) {
    devicesStore.setDelayShutdown(
      props.device.id,
      delayShutdownEnabled.value,
      delayShutdownEnabled.value ? delayTimeMinutes[delayTimeIndex.value] : undefined
    )
  }
}

// 打开时间选择器
const openDelayTimePicker = () => {
  showDelayTimePicker.value = true
}

// 选择延时关闭时间
const selectDelayTime = (index: number) => {
  delayTimeIndex.value = index
  showDelayTimePicker.value = false
  // 如果延时关闭已开启，更新延时关闭时长
  if (delayShutdownEnabled.value && props.device) {
    devicesStore.setDelayShutdown(
      props.device.id,
      true,
      delayTimeMinutes[index]
    )
  }
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content heater-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">电暖器</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="heater-layout">
          <!-- 电源开关 -->
          <div class="heater-power-section">
            <div 
              class="heater-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="heater-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="heater-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
          </div>

          <!-- 目标温度 -->
          <div class="heater-temp-section" :class="{ disabled: device.status === 'offline' }">
            <div class="temp-header">
              <span class="temp-label">目标温度</span>
              <span class="temp-hint">加热到 {{ targetTemp }} 度时进入保温</span>
            </div>
            
            <div class="temp-slider-container">
              <button class="temp-icon-btn" @click="decreaseTemp" :disabled="targetTemp <= 16 || device.status === 'offline'">
                <span class="temp-icon">−</span>
              </button>
              
              <div class="temp-display" :style="{ background: getTempGradient(targetTemp) }">
                <span class="temp-number">{{ targetTemp }}</span>
              </div>
              
              <button class="temp-icon-btn" @click="increaseTemp" :disabled="targetTemp >= 32 || device.status === 'offline'">
                <span class="temp-icon">+</span>
              </button>
            </div>
          </div>

          <!-- 延时关闭 -->
          <div class="delay-shutdown-section" :class="{ disabled: device.status === 'offline' }">
            <div class="delay-header">
              <div class="delay-icon-wrapper">
                <svg class="delay-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="delay-label">延时关闭</span>
              <div class="delay-toggle" :class="{ active: delayShutdownEnabled }" @click="toggleDelayShutdown">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            
            <div v-if="delayShutdownEnabled" class="delay-time-display" @click="openDelayTimePicker">
              <span class="delay-time-label">延时关闭时间</span>
              <span class="delay-time-value">{{ delayTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 延时关闭时间选择器弹窗 -->
  <transition name="picker">
    <div v-if="showDelayTimePicker" class="time-picker-overlay" @click="showDelayTimePicker = false">
      <div class="time-picker-content" @click.stop>
        <div class="time-picker-header">
          <span class="time-picker-title">选择延时关闭时间</span>
        </div>
        <div class="time-picker-options">
          <div 
            v-for="(option, index) in delayTimeOptions" 
            :key="index"
            class="time-option"
            :class="{ active: index === delayTimeIndex }"
            @click="selectDelayTime(index)"
          >
            <span class="option-text">{{ option }}</span>
            <svg v-if="index === delayTimeIndex" class="check-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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

.heater-dialog {
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

/* 电暖器专用布局样式 */
.heater-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.heater-power-section {
  display: flex;
  justify-content: center;
}

.heater-power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.heater-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.heater-power-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.heater-power-icon {
  width: 18px;
  height: 18px;
}

.heater-power-label {
  font-size: 16px;
  font-weight: 700;
}

.heater-temp-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.heater-temp-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.temp-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temp-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.temp-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.temp-slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.temp-icon-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.7);
}

.temp-icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.temp-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.temp-icon {
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}

.temp-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-radius: 28px;
  transition: background 0.3s ease;
}

.temp-number {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.delay-shutdown-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delay-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.delay-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex: 1;
}

.delay-toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.delay-toggle.active {
  background: linear-gradient(135deg, #ff9a3c 0%, #ff7a1f 100%);
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delay-toggle.active .toggle-thumb {
  left: 22px;
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

.time-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.time-picker-content {
  background: linear-gradient(
    180deg,
    rgba(13, 13, 26, 0.98) 0%,
    rgba(26, 26, 46, 0.98) 25%,
    rgba(42, 58, 90, 0.98) 50%,
    rgba(58, 90, 122, 0.98) 75%,
    rgba(58, 106, 154, 0.98) 100%
  );
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  min-width: 280px;
}

.time-picker-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.time-picker-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.time-picker-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.time-option:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.time-option.active {
  background: linear-gradient(135deg, rgba(255, 154, 60, 0.25) 0%, rgba(255, 122, 31, 0.25) 100%);
  border-color: rgba(255, 154, 60, 0.4);
}

.option-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: #ff9a3c;
}

/* 选择器动画 */
.picker-enter-active,
.picker-leave-active {
  transition: all 0.3s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
}

.picker-enter-from .time-picker-content,
.picker-leave-to .time-picker-content {
  transform: scale(0.9);
  opacity: 0;
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
