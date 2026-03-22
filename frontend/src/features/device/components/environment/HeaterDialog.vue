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
watch(() => (props.device as any)?.targetTemp, (newTemp) => {
  if (newTemp !== undefined) {
    targetTemp.value = newTemp
  }
})

// 当设备改变时，恢复该设备的温度状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    targetTemp.value = (props.device as any).targetTemp ?? 25
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    targetTemp.value = (props.device as any).targetTemp ?? 25
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
    const d = device as any
    // 如果设备关闭，自动禁用延时关闭
    if (device.status === 'offline' && d.delayShutdownEnabled) {
      devicesStore.setDelayShutdown(device.id, false)
      delayShutdownEnabled.value = false
    } else {
      delayShutdownEnabled.value = d.delayShutdownEnabled || false
    }
    // 根据延时关闭时长设置索引
    if (d.delayShutdownDuration) {
      const index = delayTimeMinutes.indexOf(d.delayShutdownDuration)
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
    delayShutdownEnabled.value = false
    return
  }
  
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
              <label class="swing-toggle">
                <input 
                  type="checkbox" 
                  v-model="delayShutdownEnabled"
                  :disabled="device.status === 'offline'"
                  @change="toggleDelayShutdown"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div v-if="delayShutdownEnabled" class="delay-time-display" @click="openDelayTimePicker">
              <span class="delay-time-label">延迟时间</span>
              <span class="delay-time-value">{{ delayTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 延时关闭时间选择器弹窗 -->
  <transition name="dialog">
    <div v-if="showDelayTimePicker" class="dialog-overlay" @click="showDelayTimePicker = false">
      <div class="time-picker-dialog" @click.stop>
        <div class="time-picker-header">
          <span>选择延时关闭时间</span>
        </div>
        <div class="time-picker-options">
          <button
            v-for="(option, index) in delayTimeOptions"
            :key="index"
            class="time-option"
            :class="{ active: index === delayTimeIndex }"
            @click="selectDelayTime(index)"
          >
            {{ option }}
          </button>
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
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
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
  background: var(--dialog-btn-active-bg-1);
  color: white;
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
  background: linear-gradient(135deg, #ff9a3c 0%, #ff7a1f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(255, 154, 60, 0.3);
}

.delay-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.delay-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex: 1;
}

/* Toggle 开关样式 */
.swing-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.swing-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  transition: all 0.3s ease;
  border-radius: 32px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 3px;
  background: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.swing-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #ff9a3c 0%, #ff7a1f 100%);
  border-color: rgba(255, 154, 60, 0.4);
  box-shadow: 0 0 12px rgba(255, 154, 60, 0.4);
}

.swing-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.swing-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
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

/* 时间选择器弹窗 */
.time-picker-dialog {
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  background: linear-gradient(135deg, #ff9a3c 0%, #ff7a1f 100%);
  color: white;
}

.time-option.active:hover {
  background: linear-gradient(135deg, #ffaa4c 0%, #ff8a2f 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 154, 60, 0.5);
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
