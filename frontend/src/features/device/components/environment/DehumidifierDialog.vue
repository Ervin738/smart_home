<!--
  除湿机长按弹窗
  功能：显示除湿机详细控制界面，包括开关、模式、目标湿度调节、延时关闭等功能
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

// 除湿机模式
const dehumidifierModes = ['智能', '睡眠', '干衣']
const currentModeIndex = computed({
  get: () => (props.device as any)?.dehumidifierModeIndex ?? 0,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setDehumidifierMode(props.device.id, value)
    }
  }
})

// 监听设备变化，确保模式索引已初始化
watch(() => props.device, (device) => {
  if (device) {
    const d = device as any
    if (d.dehumidifierModeIndex === undefined) {
      devicesStore.setDehumidifierMode(device.id, 0)
    }
    if (d.targetHumidity === undefined) {
      devicesStore.setTargetHumidity(device.id, 50)
    }
  }
}, { immediate: true })

// 目标湿度 (40-70%)
const targetHumidity = computed({
  get: () => (props.device as any)?.targetHumidity ?? 50,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setTargetHumidity(props.device.id, value)
    }
  }
})

// 临时滑动值，用于实时跟踪滑块位置
const tempTargetHumidity = ref(targetHumidity.value)
const isDragging = ref(false)

// 监听设备目标湿度变化，同步临时值
watch(() => (props.device as any)?.targetHumidity, (newValue) => {
  if (newValue !== undefined && !isDragging.value) {
    tempTargetHumidity.value = newValue
  }
}, { immediate: true })

// 滑块拖动时更新临时值
const onHumidityInput = (event: Event) => {
  isDragging.value = true
  const target = event.target as HTMLInputElement
  tempTargetHumidity.value = Number(target.value)
}

// 滑块释放时更新实际值（四舍五入到整数）
const onHumidityChange = () => {
  isDragging.value = false
  const roundedValue = Math.round(tempTargetHumidity.value)
  tempTargetHumidity.value = roundedValue
  targetHumidity.value = roundedValue
}

// 延时关闭状态
const delayShutdownEnabled = ref(false)
const delayTimeOptions = ['30分钟', '1小时', '2小时', '3小时']
const delayTimeMinutes = [30, 60, 120, 180]
const delayTimeIndex = ref(1) // 默认1小时
const delayTime = computed(() => delayTimeOptions[delayTimeIndex.value])
const showDelayTimePicker = ref(false)

// 监听设备变化，同步延时关闭状态
watch(() => props.device, (device) => {
  if (device) {
    const d = device as any
    if (device.status === 'offline' && d.delayShutdownEnabled) {
      devicesStore.setDelayShutdown(device.id, false)
    }
    delayShutdownEnabled.value = d.delayShutdownEnabled || false
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
  }
})

// 切换延时关闭
const toggleDelayShutdown = () => {
  if (props.device?.status !== 'online' && !delayShutdownEnabled.value) {
    delayShutdownEnabled.value = false
    return
  }
  
  if (props.device) {
    if (delayShutdownEnabled.value) {
      devicesStore.setDelayShutdown(
        props.device.id,
        true,
        delayTimeMinutes[delayTimeIndex.value]
      )
    } else {
      devicesStore.setDelayShutdown(props.device.id, false)
    }
  }
}

// 打开延时关闭时间选择器
const openDelayTimePicker = () => {
  showDelayTimePicker.value = true
}

// 选择延时关闭时间
const selectDelayTime = (index: number) => {
  delayTimeIndex.value = index
  showDelayTimePicker.value = false
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
      <div class="dialog-content dehumidifier-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">除湿机</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="dehumidifier-layout">
          <!-- 电源开关 -->
          <div class="dehumidifier-power-section">
            <div 
              class="dehumidifier-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="dehumidifier-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="dehumidifier-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
          </div>

          <!-- 模式选择 -->
          <div class="mode-control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="mode-selection">
              <div class="mode-select-item">
                <button 
                  class="mode-select-btn"
                  :class="{ active: currentModeIndex === 0 }"
                  :disabled="device.status === 'offline'"
                  @click="currentModeIndex = 0"
                >
                  <div class="mode-select-icon">
                    <span class="mode-icon-text">A</span>
                  </div>
                  <span class="mode-select-text">智能</span>
                </button>
              </div>
              <div class="mode-select-item">
                <button 
                  class="mode-select-btn"
                  :class="{ active: currentModeIndex === 1 }"
                  :disabled="device.status === 'offline'"
                  @click="currentModeIndex = 1"
                >
                  <svg class="mode-select-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="mode-select-text">睡眠</span>
                </button>
              </div>
              <div class="mode-select-item">
                <button 
                  class="mode-select-btn"
                  :class="{ active: currentModeIndex === 2 }"
                  :disabled="device.status === 'offline'"
                  @click="currentModeIndex = 2"
                >
                  <svg class="mode-select-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="mode-select-text">干衣</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 目标湿度调节 -->
          <div class="humidity-control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="humidity-label-header">
              <span class="humidity-label-text">目标湿度</span>
              <span class="humidity-label-divider">|</span>
              <span class="humidity-label-value">{{ Math.round(tempTargetHumidity) }}%</span>
            </div>
            <div class="humidity-slider-wrapper">
              <div class="slider-track">
                <div 
                  class="humidity-indicator" 
                  :class="{ dragging: isDragging }"
                  :style="{ left: `calc(((${tempTargetHumidity} - 40) / 30) * (100% - 44px))` }"
                >
                  {{ Math.round(tempTargetHumidity) }}
                </div>
                <div 
                  class="slider-fill"
                  :class="{ dragging: isDragging }"
                  :style="{ 
                    width: tempTargetHumidity === 40 ? '0' : 
                           tempTargetHumidity === 70 ? '100%' : 
                           `calc(((${tempTargetHumidity} - 40) / 30) * (100% - 44px) + 44px)` 
                  }"
                ></div>
              </div>
              <input 
                type="range" 
                v-model.number="tempTargetHumidity" 
                min="40" 
                max="70" 
                step="0.1"
                class="slider-input"
                :disabled="device.status === 'offline'"
                @input="onHumidityInput"
                @change="onHumidityChange"
              />
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
              <label class="delay-toggle">
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

.dehumidifier-dialog {
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

/* 除湿机专用布局样式 */
.dehumidifier-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dehumidifier-power-section {
  display: flex;
  justify-content: center;
}

.dehumidifier-power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.dehumidifier-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.dehumidifier-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.dehumidifier-power-icon {
  width: 16px;
  height: 16px;
}

.dehumidifier-power-label {
  font-size: 15px;
  font-weight: 600;
}

/* 模式控制区域 */
.mode-control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
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
  transition: opacity 0.3s ease;
}

.mode-control-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.mode-selection {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.mode-select-item {
  flex: 1;
}

.mode-select-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mode-select-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.mode-select-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.mode-select-btn:disabled {
  cursor: not-allowed;
}

.mode-select-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon-text {
  font-size: 32px;
  font-weight: 700;
}

.mode-select-text {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

/* 目标湿度调节区域 */
.humidity-control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
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
  transition: opacity 0.3s ease;
}

.humidity-control-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.humidity-label-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.humidity-label-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.humidity-label-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.humidity-label-value {
  font-size: 28px;
  font-weight: 200;
  color: white;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.6),
    0 0 40px rgba(255, 255, 255, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: -1px;
  font-family: 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.humidity-slider-wrapper {
  flex: 1;
  position: relative;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 20;
}

.slider-track {
  height: 44px;
  background: linear-gradient(
    90deg,
    rgba(58, 58, 110, 0.7) 0%,
    rgba(74, 74, 122, 0.6) 50%,
    rgba(77, 90, 122, 0.5) 100%
  );
  border-radius: 22px;
  position: relative;
  overflow: visible;
  border: 1px solid rgba(150, 180, 220, 0.25);
  display: flex;
  align-items: center;
}

.humidity-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--dialog-btn-active-bg-1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px var(--dialog-btn-active-shadow);
  z-index: 10;
  transition: left 0.15s ease-out;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.2);
  font-family: 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.humidity-indicator.dragging {
  transition: none;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--dialog-btn-active-bg-1);
  border-radius: 22px;
  transition: width 0.15s ease-out;
  pointer-events: none;
  box-shadow:
    0 0 20px var(--dialog-btn-active-shadow),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.slider-fill.dragging {
  transition: none;
}


/* 延时关闭 */
.delay-shutdown-section {
  padding: 14px 18px;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--dialog-btn-active-bg-1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px var(--dialog-btn-active-shadow);
}

.delay-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.delay-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.delay-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.delay-toggle input {
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

.delay-toggle input:checked + .toggle-slider {
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
  box-shadow: 0 0 12px var(--dialog-btn-active-shadow);
}

.delay-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.delay-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

.delay-time-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 0;
  border-radius: 12px;
}

.delay-time-display:hover {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  margin: 0 -12px;
}

.delay-time-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.delay-time-value {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
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
  background: var(--dialog-btn-active-bg-1);
  color: white;
  border-color: transparent;
}

.time-option.active:hover {
  background: var(--dialog-btn-active-bg-1);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--dialog-btn-active-shadow);
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
