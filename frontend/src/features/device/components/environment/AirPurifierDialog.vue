<!--
  空气净化器长按弹窗
  功能：显示空气净化器详细控制界面，包括开关、模式、摆风角度、PM2.5显示等功能
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

// 空气净化器模式
const purifierModes = [
  { label: '智能', icon: 'A' },
  { label: '睡眠', icon: 'moon' },
  { label: '净化', icon: 'purify' },
  { label: '风扇', icon: 'wind' }
]

const currentModeIndex = computed({
  get: () => (props.device as any)?.purifierModeIndex ?? 0,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setPurifierMode(props.device.id, value)
    }
  }
})

// 监听设备变化，确保模式索引已初始化
watch(() => props.device, (device) => {
  if (device) {
    const d = device as any
    if (d.purifierModeIndex === undefined) {
      devicesStore.setPurifierMode(device.id, 0)
    }
    if (d.swingEnabled === undefined) {
      devicesStore.setSwingEnabled(device.id, false)
    }
    if (d.swingAngle === undefined) {
      devicesStore.setSwingAngle(device.id, 90)
    }
  }
}, { immediate: true })

// 摆风开关
const swingEnabled = computed({
  get: () => (props.device as any)?.swingEnabled ?? false,
  set: (value: boolean) => {
    if (props.device) {
      devicesStore.setSwingEnabled(props.device.id, value)
    }
  }
})

// 摆风角度
const swingAngles = [30, 60, 90]
const selectedAngle = computed({
  get: () => (props.device as any)?.swingAngle ?? 90,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setSwingAngle(props.device.id, value)
    }
  }
})

// PM2.5等级
const pm25Levels = [
  { label: '优/良', color: '#26d0ce', range: '0-75' },
  { label: '中轻度', color: '#f59e0b', range: '76-150' },
  { label: '重度', color: '#ef4444', range: '151+' }
]

// 模拟数据 - 实际应该从设备获取
const pm25Value = ref(1)
const vocStatus = ref('😊')
const airQuality = ref('空气优')
const temperature = ref(25)
const humidity = ref(73)

// 屏幕亮度
const brightnessOptions = ['关闭', '自动', '微光', '亮光']
const showBrightnessDialog = ref(false)

const brightnessLevel = computed({
  get: () => (props.device as any)?.brightnessLevel ?? 0,
  set: (value: number) => {
    if (props.device) {
      devicesStore.setBrightnessLevel(props.device.id, value)
    }
  }
})

const selectBrightness = (index: number) => {
  brightnessLevel.value = index
  showBrightnessDialog.value = false
}

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content purifier-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">空气净化器</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="purifier-layout">
          <!-- 电源开关和定时开关 -->
          <div class="power-timer-section">
            <div 
              class="purifier-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="purifier-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="purifier-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>

            <div class="timer-btn clickable" @click="emit('open-timer')">
              <div class="feature-icon-wrapper timer">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="feature-label">定时</span>
            </div>
          </div>

          <!-- 模式选择 -->
          <div class="mode-control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="mode-selection">
              <div 
                v-for="(mode, index) in purifierModes" 
                :key="index"
                class="mode-select-item"
              >
                <button 
                  class="mode-select-btn"
                  :class="{ active: currentModeIndex === index }"
                  :disabled="device.status === 'offline'"
                  @click="currentModeIndex = index"
                >
                  <div class="mode-select-icon">
                    <span v-if="mode.icon === 'A'" class="mode-icon-text">A</span>
                    <svg v-else-if="mode.icon === 'moon'" viewBox="0 0 24 24" fill="none">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg v-else-if="mode.icon === 'purify'" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg v-else-if="mode.icon === 'wind'" viewBox="0 0 24 24" fill="none">
                      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <span class="mode-select-text">{{ mode.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 左右摆风控制 -->
          <div class="swing-control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="swing-header">
              <span class="swing-label">左右摆风</span>
              <span class="swing-divider">|</span>
              <span class="swing-angle-display">{{ selectedAngle }}°</span>
              <label class="swing-toggle">
                <input 
                  type="checkbox" 
                  v-model="swingEnabled"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div v-if="swingEnabled" class="swing-angle-selection">
              <button
                v-for="angle in swingAngles"
                :key="angle"
                class="angle-btn"
                :class="{ active: selectedAngle === angle }"
                :disabled="device.status === 'offline'"
                @click="selectedAngle = angle"
              >
                {{ angle }}
              </button>
            </div>
          </div>

          <!-- 负离子 -->
          <div 
            class="feature-item"
            :class="{ disabled: device.status === 'offline' }"
          >
            <div class="feature-icon-wrapper negative-ion">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="feature-label">负离子</span>
            <label class="feature-toggle">
              <input 
                type="checkbox" 
                :disabled="device.status === 'offline'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 滤芯 -->
          <div class="feature-item clickable">
            <div class="feature-icon-wrapper filter">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-label">滤芯</span>
              <span class="feature-sublabel">预计还可以使用180天</span>
            </div>
          </div>

          <!-- 屏幕亮度 -->
          <div 
            class="feature-item clickable" 
            :class="{ disabled: device.status === 'offline' }"
            @click="device.status === 'online' && (showBrightnessDialog = true)"
          >
            <div class="feature-icon-wrapper brightness">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-label">屏幕亮度</span>
              <span class="feature-sublabel">{{ brightnessOptions[brightnessLevel] }}</span>
            </div>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 屏幕亮度选择弹窗 -->
  <transition name="dialog">
    <div v-if="showBrightnessDialog" class="dialog-overlay" @click="showBrightnessDialog = false">
      <div class="brightness-picker-dialog" @click.stop>
        <div class="brightness-picker-header">
          <span>选择屏幕亮度</span>
        </div>
        <div class="brightness-picker-options">
          <button
            v-for="(option, index) in brightnessOptions"
            :key="index"
            class="brightness-option"
            :class="{ active: index === brightnessLevel }"
            @click="selectBrightness(index)"
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

.purifier-dialog {
  width: 320px;
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

/* 空气净化器专用布局样式 */
.purifier-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.power-timer-section {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.purifier-power-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timer-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.purifier-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.purifier-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.purifier-power-icon {
  width: 16px;
  height: 16px;
}

.purifier-power-label {
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
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
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
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

.mode-select-icon svg {
  width: 24px;
  height: 24px;
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

/* 摆风控制区域 */
.swing-control-section {
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

.swing-control-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.swing-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.swing-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.swing-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.swing-angle-display {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
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
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
  box-shadow: 0 0 12px var(--dialog-btn-active-shadow);
}

.swing-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.swing-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

.swing-angle-selection {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.angle-btn {
  flex: 1;
  padding: 10px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.angle-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.angle-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.angle-btn:disabled {
  cursor: not-allowed;
}

/* 功能项 */
.feature-item {
  display: flex;
  align-items: center;
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

.feature-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.feature-item.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-item.clickable:not(.disabled):hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 6px 20px rgba(0, 0, 0, 0.15);
}

.feature-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.feature-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.feature-sublabel {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.feature-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
  margin-left: auto;
}

.feature-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.feature-toggle .toggle-slider {
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

.feature-toggle .toggle-slider:before {
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

.feature-toggle input:checked + .toggle-slider {
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
  box-shadow: 0 0 12px var(--dialog-btn-active-shadow);
}

.feature-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.feature-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  margin-left: auto;
}

/* 亮度选择弹窗 */
.brightness-picker-dialog {
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
  min-width: 280px;
}

.brightness-picker-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.brightness-picker-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brightness-option {
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

.brightness-option:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.brightness-option.active {
  background: var(--dialog-btn-active-bg-1);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px var(--dialog-btn-active-shadow);
}

.brightness-option.active:hover {
  background: var(--dialog-btn-active-bg-1);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(38, 208, 206, 0.5);
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
