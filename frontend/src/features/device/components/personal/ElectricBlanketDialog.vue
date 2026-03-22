<!--
  电热毯长按弹窗
  功能：显示电热毯控制界面，包括A区B区档位控制、待机、区域选择
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const areaALevel = ref(1) // A区档位 0-6
const areaBLevel = ref(1) // B区档位 0-6
const selectedZone = ref(0) // 选中区域 0-AB区 1-A区 2-B区

// 延时关闭状态
const delayShutdownEnabled = ref(false)
const delayTimeOptions = ['30分钟', '1小时', '2小时', '3小时']
const delayTimeMinutes = [30, 60, 120, 180]
const delayTimeIndex = ref(1) // 默认 1小时
const delayTime = computed(() => delayTimeOptions[delayTimeIndex.value])
const showDelayTimePicker = ref(false)

// 当设备改变时，恢复该设备的状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    const d = props.device as any
    areaALevel.value = d.blanketAreaALevel ?? 1
    areaBLevel.value = d.blanketAreaBLevel ?? 1
    selectedZone.value = d.blanketSelectedZone ?? 0
    
    // 如果设备关闭，自动禁用延时关闭
    if (props.device.status === 'offline' && d.delayShutdownEnabled) {
      devicesStore.setDelayShutdown(props.device.id, false)
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
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    areaALevel.value = d.blanketAreaALevel ?? 1
    areaBLevel.value = d.blanketAreaBLevel ?? 1
    selectedZone.value = d.blanketSelectedZone ?? 0
    delayShutdownEnabled.value = d.delayShutdownEnabled ?? false
    if (d.delayShutdownDuration) {
      const index = delayTimeMinutes.indexOf(d.delayShutdownDuration)
      if (index !== -1) {
        delayTimeIndex.value = index
      }
    }
  }
})

// 监听设备状态变化，设备关闭时自动关闭延时关闭按钮并重置档位
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    if (delayShutdownEnabled.value) {
      delayShutdownEnabled.value = false
      if (props.device) {
        devicesStore.setDelayShutdown(props.device.id, false)
      }
    }
    areaALevel.value = 1
    areaBLevel.value = 1
    selectedZone.value = 0
  }
})

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
  // 保存当前状态到设备
  if (props.device) {
    devicesStore.setElectricBlanketAreaALevel(props.device.id, areaALevel.value)
    devicesStore.setElectricBlanketAreaBLevel(props.device.id, areaBLevel.value)
    devicesStore.setElectricBlanketSelectedZone(props.device.id, selectedZone.value)
  }
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 选择区域
const selectZone = (zone: number) => {
  if (props.device?.status === 'offline') return
  selectedZone.value = zone
  if (props.device) {
    devicesStore.setElectricBlanketSelectedZone(props.device.id, zone)
  }
}

// 调整档位（根据选中区域）
const onLevelChange = (level: number) => {
  if (selectedZone.value === 0) {
    // AB区：两个区域同时变化
    areaALevel.value = level
    areaBLevel.value = level
    if (props.device) {
      devicesStore.setElectricBlanketAreaALevel(props.device.id, level)
      devicesStore.setElectricBlanketAreaBLevel(props.device.id, level)
    }
  } else if (selectedZone.value === 1) {
    // A区：只改变A区
    areaALevel.value = level
    if (props.device) {
      devicesStore.setElectricBlanketAreaALevel(props.device.id, level)
    }
  } else {
    // B区：只改变B区
    areaBLevel.value = level
    if (props.device) {
      devicesStore.setElectricBlanketAreaBLevel(props.device.id, level)
    }
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

// 打开延时关闭时间选择器
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
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @mousedown.self="close">
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

          <!-- A区和B区档位显示 -->
          <div class="zones-display">
            <div class="zone-card">
              <div class="zone-label">A区</div>
              <div class="zone-level">{{ areaALevel }}</div>
              <div class="zone-text">目标档位</div>
            </div>
            <div class="zone-card">
              <div class="zone-label">B区</div>
              <div class="zone-level">{{ areaBLevel }}</div>
              <div class="zone-text">目标档位</div>
            </div>
          </div>

          <!-- 区域选择 -->
          <div class="zone-selection">
            <button 
              class="zone-btn" 
              :class="{ active: selectedZone === 0 }"
              :disabled="device.status === 'offline'"
              @click="selectZone(0)"
            >
              AB区
            </button>
            <button 
              class="zone-btn" 
              :class="{ active: selectedZone === 1 }"
              :disabled="device.status === 'offline'"
              @click="selectZone(1)"
            >
              A区
            </button>
            <button 
              class="zone-btn" 
              :class="{ active: selectedZone === 2 }"
              :disabled="device.status === 'offline'"
              @click="selectZone(2)"
            >
              B区
            </button>
          </div>

          <!-- 目标档位显示和选择 -->
          <div class="target-level-section">
            <div class="target-level-title">
              目标档位 | 
              <span v-if="selectedZone === 0">AB区{{ areaALevel }}档</span>
              <span v-else-if="selectedZone === 1">A区{{ areaALevel }}档</span>
              <span v-else>B区{{ areaBLevel }}档</span>
            </div>
            <div class="level-buttons">
              <button 
                v-for="level in [0, 1, 2, 3, 4, 5, 6]" 
                :key="level"
                class="level-btn"
                :class="{ 
                  active: selectedZone === 0 ? areaALevel === level : 
                          selectedZone === 1 ? areaALevel === level : 
                          areaBLevel === level 
                }"
                :disabled="device.status === 'offline'"
                @click="onLevelChange(level)"
              >
                {{ level }}档
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
    </transition>
  </teleport>

  <!-- 延时关闭时间选择器弹窗 -->
  <teleport to="body">
    <transition name="dialog">
      <div v-if="showDelayTimePicker" class="time-picker-overlay" @click="showDelayTimePicker = false">
        <div class="time-picker-dialog" @click.stop>
          <div class="time-picker-header">
            <span>选择延时关闭时间</span>
          </div>
          <div class="time-picker-options">
            <button
              v-for="(option, index) in delayTimeOptions"
              :key="index"
              class="time-option"
              :class="{ active: delayTimeIndex === index }"
              @click="selectDelayTime(index)"
            >
              {{ option }}
            </button>
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

/* 区域档位显示 */
.zones-display {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.zone-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.zone-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 165, 0, 0.9);
  margin-bottom: 8px;
}

.zone-level {
  font-size: 40px;
  font-weight: 700;
  color: white;
  line-height: 1;
  margin-bottom: 6px;
}

.zone-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

/* 区域选择 */
.zone-selection {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.zone-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(245, 158, 11, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.zone-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.zone-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.zone-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 目标档位显示 */
.target-level-section {
  margin-bottom: 0;
}

.target-level-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-align: left;
  margin-bottom: 12px;
}

.target-level-title span {
  color: rgba(255, 255, 255, 0.7);
}

/* 档位选择 */
.level-buttons {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 8px;
}

.level-btn {
  flex: 1;
  padding: 12px 4px;
  background: transparent;
  border: none;
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 0;
}

.level-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.level-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.level-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

.delay-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.delay-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: white;
}

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

.toggle-slider {
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

.toggle-slider:before {
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
.time-picker-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}

.time-picker-dialog {
  background: linear-gradient(
    180deg,
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
  background: var(--dialog-btn-active-bg-2);
  transform: translateY(-2px);
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
