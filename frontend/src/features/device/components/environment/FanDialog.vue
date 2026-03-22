<!--
  风扇长按弹窗
  功能：显示风扇详细控制界面，包括开关、模式、风速调节等功能
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

// 风扇模式
const fanModes = ['直吹风', '自然风']
const currentModeIndex = computed({
  get: () => (props.device as any)?.fanModeIndex ?? 0,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setFanMode(props.device.id, value)
    }
  }
})

// 直吹风档位 (1-4)，独立存储
const directSpeed = computed({
  get: () => (props.device as any)?.fanDirectSpeed ?? 1,
  set: (value: number) => {
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { fanDirectSpeed: value })
  }
})

// 自然风档位 (1-4)，独立存储
const natureSpeed = computed({
  get: () => (props.device as any)?.fanNatureSpeed ?? 1,
  set: (value: number) => {
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { fanNatureSpeed: value })
  }
})

// 直吹风滑块临时值（用于拖动时实时显示）
const tempDirectSpeed = ref(directSpeed.value)
watch(() => (props.device as any)?.fanDirectSpeed, (v) => {
  if (v !== undefined) tempDirectSpeed.value = v
}, { immediate: true })

// 滑块事件处理
const onSpeedInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  tempDirectSpeed.value = Number(target.value)
}

const onSpeedChange = () => {
  directSpeed.value = Math.round(tempDirectSpeed.value)
  tempDirectSpeed.value = directSpeed.value
}

// 兼容旧字段（BottomFanBar 仍用 speedLevel）
const speedLevel = computed({
  get: () => currentModeIndex.value === 0 ? directSpeed.value : natureSpeed.value,
  set: (value: number) => {
    if (currentModeIndex.value === 0) directSpeed.value = value
    else natureSpeed.value = value
  }
})

// 切换风扇模式
const toggleFanMode = () => {
  currentModeIndex.value = (currentModeIndex.value + 1) % fanModes.length
}

// 扫风开关
const swingEnabled = computed({
  get: () => {
    const value = (props.device as any)?.swingEnabled ?? false
    console.log('swingEnabled get:', value, 'device:', props.device)
    return value
  },
  set: (value: boolean) => {
    console.log('swingEnabled set:', value)
    if (props.device) {
      devicesStore.setSwingEnabled(props.device.id, value)
    }
  }
})

// 手动调节扫风方向
const adjustSwingLeft = () => {
  console.log('向左调节')
  // TODO: 实现向左调节逻辑
}

const adjustSwingRight = () => {
  console.log('向右调节')
  // TODO: 实现向右调节逻辑
}

// 扫风角度
const swingAngle = computed(() => (props.device as any)?.swingAngle ?? 140)

// 调节扫风角度
const showAngleSelector = ref(false)
const adjustSwingAngle = () => {
  showAngleSelector.value = true
}

const selectAngle = (angle: number) => {
  if (props.device) {
    devicesStore.setSwingAngle(props.device.id, angle)
  }
  showAngleSelector.value = false
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
      <div class="dialog-content fan-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">风扇</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="fan-layout">
          <!-- 电源开关和定时 -->
          <div class="fan-power-section">
            <div 
              class="fan-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="fan-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="fan-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
            
            <div 
              class="fan-power-btn"
              :class="{ 
                active: device.status === 'online' && (device.timerOffEnabled || device.timerOnEnabled),
                disabled: device.status === 'offline'
              }"
              @click="device.status === 'online' && emit('open-timer')"
            >
              <svg class="fan-power-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="fan-power-label">定时</span>
            </div>
          </div>

          <!-- 风速调节区域 -->
          <div class="speed-control-section" :class="{ disabled: device.status === 'offline' }">
            <!-- 模式选择按钮 -->
            <div class="mode-selection">
              <div class="mode-select-item">
                <button 
                  class="mode-select-btn"
                  :class="{ active: currentModeIndex === 0 }"
                  :disabled="device.status === 'offline'"
                  @click="currentModeIndex = 0"
                >
                  <svg class="mode-select-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8h3M3 12h2M3 16h3M10 5v3M14 5v2M18 5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M9 12c0-2 1-3 3-3s3 1 3 3-1 3-3 3-3-1-3-3z" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 15c2 0 4 1 6 3M12 15c-2 0-4 1-6 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <span class="mode-select-text">直吹风</span>
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
                    <path d="M12 2C12 2 10 6 10 9C10 10.6569 11.3431 12 13 12C14.6569 12 16 10.6569 16 9C16 6 14 2 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M9 15C9 15 8 16 8 17C8 18 9 19 10 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 15C15 15 16 16 16 17C16 18 15 19 14 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <span class="mode-select-text">自然风</span>
                </button>
              </div>
            </div>
            
            <!-- 四档调节 -->
            <div v-if="currentModeIndex === 0" class="speed-adjust-container">
              <div class="speed-label-header">
                <span class="speed-label-text">无级调节</span>
                <span class="speed-label-divider">|</span>
                <span class="speed-label-value">{{ Math.round(tempDirectSpeed) }}</span>
              </div>
              <div class="speed-slider-wrapper">
                <div class="slider-track">
                  <div 
                    class="speed-indicator" 
                    :style="{ left: `calc(((${tempDirectSpeed} - 1) / 3) * (100% - 44px))` }"
                  >
                    {{ Math.round(tempDirectSpeed) }}
                  </div>
                  <div 
                    class="slider-fill" 
                    :style="{ 
                      width: tempDirectSpeed === 1 ? '0' : 
                             tempDirectSpeed === 4 ? '100%' : 
                             `calc(((${tempDirectSpeed} - 1) / 3) * (100% - 44px) + 44px)` 
                    }"
                  ></div>
                  <div class="slider-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
                <input 
                  type="range" 
                  v-model.number="tempDirectSpeed" 
                  min="1" 
                  max="4" 
                  step="1"
                  class="slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onSpeedInput"
                  @change="onSpeedChange"
                />
              </div>
            </div>

            <!-- 自然风档位选择 -->
            <div v-else class="speed-adjust-container">
              <div class="speed-label-header">
                <span class="speed-label-text">自然风调节</span>
                <span class="speed-label-divider">|</span>
                <span class="speed-label-value">{{ ['湖畔', '霜营', '果岭', '梯田'][natureSpeed - 1] }}</span>
              </div>
              <div class="speed-levels">
                <div 
                  v-for="(name, index) in ['湖畔', '霜营', '果岭', '梯田']"
                  :key="index"
                  class="speed-level-item"
                >
                  <button
                    class="speed-level-circle"
                    :class="{ active: natureSpeed === index + 1 }"
                    :disabled="device.status === 'offline'"
                    @click="natureSpeed = index + 1"
                  >
                    {{ index + 1 }}
                  </button>
                  <span class="speed-level-name">{{ name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 扫风控制 -->
          <div class="swing-section">
            <!-- 自动左右扫风 -->
            <div class="swing-control">
              <div class="swing-icon-wrapper">
                <svg class="swing-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12L12 7L17 12M7 12L12 17L17 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="swing-label">自动左右扫风</span>
              <label class="swing-toggle">
                <input 
                  type="checkbox" 
                  v-model="swingEnabled"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- 手动调节 -->
            <div v-if="!swingEnabled" class="manual-control">
              <span class="manual-label">手动调节</span>
              <div class="manual-buttons">
                <button 
                  class="manual-btn"
                  :disabled="device.status === 'offline'"
                  @click="adjustSwingLeft"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button 
                  class="manual-btn"
                  :disabled="device.status === 'offline'"
                  @click="adjustSwingRight"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 扫风角度 -->
            <div v-else class="swing-angle-control" @click="adjustSwingAngle">
              <span class="swing-angle-label">扫风角度</span>
              <div class="swing-angle-value">
                <span>{{ swingAngle }}°</span>
                <svg class="angle-arrow" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
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

  <!-- 角度选择弹窗 -->
  <transition name="dialog">
    <div v-if="showAngleSelector" class="dialog-overlay" @click="showAngleSelector = false">
      <div class="angle-selector-dialog" @click.stop>
        <div class="angle-selector-header">
          <span>选择扫风角度</span>
        </div>
        <div class="angle-options">
          <button
            v-for="angle in [30, 60, 90, 120, 140]"
            :key="angle"
            class="angle-option"
            :class="{ active: swingAngle === angle }"
            @click="selectAngle(angle)"
          >
            {{ angle }}°
          </button>
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

.fan-dialog {
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

/* 风扇专用布局样式 */
.fan-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fan-power-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
}

.fan-power-btn {
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

.fan-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.fan-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.fan-power-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.fan-power-icon {
  width: 16px;
  height: 16px;
}

.fan-power-label {
  font-size: 15px;
  font-weight: 600;
}

/* 风速调节区域 */
.speed-control-section {
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

.speed-control-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.current-mode-label {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 模式选择按钮 */
.mode-selection {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.mode-select-item {
  flex: 1;
}

.mode-select-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 8px;
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

.mode-select-btn.active:hover {
  background: var(--dialog-btn-active-bg-2);
  transform: translateY(-2px);
}

.mode-select-btn:disabled {
  cursor: not-allowed;
}

.mode-select-icon {
  width: 20px;
  height: 20px;
}

.mode-select-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.speed-adjust-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.speed-label-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-label-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.speed-label-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.speed-label-value {
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

.speed-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 300;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.4);
  z-index: 10;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.2);
  font-family: 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.speed-slider-wrapper {
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
  padding-right: 0;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #26d0ce 0%, #1fa19f 100%);
  border-radius: 22px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow:
    0 0 20px rgba(38, 208, 206, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.slider-dots {
  position: absolute;
  top: 50%;
  left: 52px;
  right: 52px;
  display: flex;
  justify-content: space-evenly;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.slider-max {
  position: absolute;
  right: -40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  z-index: 1;
}

/* 自然风档位选择 */
.speed-levels {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.speed-level-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.speed-level-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  color: rgba(255, 255, 255, 0.95);
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.speed-level-circle:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.speed-level-circle.active {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(38, 208, 206, 0.4);
}

.speed-level-circle.active:hover {
  background: linear-gradient(135deg, #30e0de 0%, #29b1af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(38, 208, 206, 0.5);
}

.speed-level-circle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.speed-level-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-align: center;
}

.speed-level-item:has(.speed-level-circle.active) .speed-level-name {
  color: #26d0ce;
  font-weight: 600;
}

/* 扫风控制区域 */
.swing-section {
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
}

/* 自动左右扫风 */
.swing-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.swing-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
}

.swing-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.swing-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

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
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.swing-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.swing-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 手动调节 */
.manual-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.manual-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.manual-buttons {
  display: flex;
  gap: 12px;
}

.manual-btn {
  width: 100px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.4) 0%, rgba(100, 150, 200, 0.3) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #26d0ce;
}

.manual-btn svg {
  width: 28px;
  height: 28px;
}

.manual-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.5) 0%, rgba(110, 160, 210, 0.4) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.manual-btn:active {
  transform: translateY(0);
}

.manual-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* 扫风角度 */
.swing-angle-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 0;
  border-radius: 12px;
}

.swing-angle-control:hover {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  margin: 0 -12px;
}

.swing-angle-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.swing-angle-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.angle-arrow {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;
}

.swing-angle-control:hover .angle-arrow {
  transform: translateX(4px);
}

/* 角度选择弹窗 */
.angle-selector-dialog {
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

.angle-selector-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.angle-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.angle-option {
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

.angle-option:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.angle-option.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
  border-color: transparent;
}

.angle-option.active:hover {
  background: var(--dialog-btn-active-bg-1);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--dialog-btn-active-shadow);
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
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
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
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  color: white;
}

.time-option.active:hover {
  background: linear-gradient(135deg, #30e0de 0%, #29b1af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(38, 208, 206, 0.5);
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

/* 功能按钮组 */
.function-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.function-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.function-item {
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
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.6) 0%, rgba(0, 151, 167, 0.5) 100%);
  border-color: rgba(0, 188, 212, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(0, 188, 212, 0.3);
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
