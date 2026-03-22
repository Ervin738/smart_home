<!--
  吸顶灯设备对话框
  功能：长按吸顶灯设备卡片后显示，提供亮度、色温、情景模式控制
  触发：长按吸顶灯设备卡片
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
  (e: 'update:brightness', value: number): void
  (e: 'update:colorTemp', value: number): void
  (e: 'update:mode', index: number): void
}>()

const devicesStore = useDevicesStore()
const dialogBrightness = ref(0)
const dialogColorTemp = ref(2700)

const activeModeIndex = computed(() => (props.device as any)?.lightModeIndex ?? -1)

watch(() => props.device, (device) => {
  if (device && device.type === 'light') {
    dialogBrightness.value = device.brightness ?? 0
    dialogColorTemp.value = device.colorTemp ?? 2700
  }
}, { flush: 'post' })

const onDialogBrightnessChange = (value: number) => {
  emit('update:brightness', value)
}

const onDialogColorTempChange = (value: number) => {
  emit('update:colorTemp', value)
}

const modeOptions = [
  { label: '明亮模式', brightness: 100, colorTemp: 5500 },
  { label: '休闲模式', brightness: 50, colorTemp: 3500 },
  { label: '电视模式', brightness: 30, colorTemp: 3000 },
  { label: '温馨模式', brightness: 60, colorTemp: 3200 },
  { label: '夜灯模式', brightness: 10, colorTemp: 2700 }
]

const handleModeSelect = (mode: any, index: number) => {
  if (!props.device || props.device.status === 'offline') return
  devicesStore.setLightMode(props.device.id, index)
  dialogBrightness.value = mode.brightness
  dialogColorTemp.value = mode.colorTemp
  emit('update:brightness', mode.brightness)
  emit('update:colorTemp', mode.colorTemp)
  emit('update:mode', index)
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content ceiling-lamp-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">吸顶灯</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <!-- 亮度调节 -->
        <div class="brightness-section" :class="{ disabled: device.status === 'offline' }">
          <div class="brightness-header">
            <span class="brightness-label">亮度</span>
            <span class="brightness-divider">|</span>
            <span class="brightness-value">{{ dialogBrightness }}%</span>
          </div>
          <div class="brightness-slider-container">
            <svg class="brightness-icon-left" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="brightness-track">
              <div class="brightness-fill" :style="{ width: dialogBrightness + '%' }"></div>
            </div>
            <svg class="brightness-icon-right" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input 
              type="range" 
              v-model="dialogBrightness" 
              min="0" 
              max="100" 
              class="brightness-input"
              :disabled="device.status === 'offline'"
              @input="onDialogBrightnessChange(dialogBrightness)"
            />
          </div>
        </div>
        
        <!-- 色温调节 -->
        <div class="color-temp-section" :class="{ disabled: device.status === 'offline' }">
          <div class="color-temp-header">
            <span class="color-temp-label">色温</span>
            <span class="color-temp-divider">|</span>
            <span class="color-temp-value">{{ dialogColorTemp }} K</span>
          </div>
          <div class="color-temp-slider-container">
            <div class="color-temp-track">
              <div class="color-temp-thumb" :style="{ left: `calc(${((dialogColorTemp - 2700) / (6500 - 2700)) * 100}% - ${((dialogColorTemp - 2700) / (6500 - 2700)) * 38}px + 3px)` }"></div>
            </div>
            <input 
              type="range" 
              v-model="dialogColorTemp" 
              min="2700" 
              max="6500" 
              class="color-temp-input"
              :disabled="device.status === 'offline'"
              @input="onDialogColorTempChange(dialogColorTemp)"
            />
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
          <div 
            class="control-btn"
            @click="emit('open-timer')"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="btn-label">定时</span>
          </div>
        </div>
        
        <!-- 情景模式 -->
        <div class="mode-section">
          <div class="mode-title">情景模式</div>
          <div class="mode-grid" :class="{ disabled: device.status === 'offline' }">
            <div 
              v-for="(mode, index) in modeOptions" 
              :key="index"
              class="mode-btn"
              :class="{ active: activeModeIndex === index, disabled: device.status === 'offline' }"
              @click="handleModeSelect(mode, index)"
            >
              {{ mode.label }}
            </div>
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
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.ceiling-lamp-dialog {
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

/* 亮度调节样式 */
.brightness-section {
  margin-bottom: 24px;
}

.brightness-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.brightness-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.brightness-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.brightness-divider {
  color: rgba(255, 255, 255, 0.3);
}

.brightness-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.brightness-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.brightness-icon-left,
.brightness-icon-right {
  width: 24px;
  height: 24px;
  color: rgba(150, 200, 255, 0.8);
  flex-shrink: 0;
}

.brightness-icon-left {
  opacity: 0.6;
  width: 20px;
  height: 20px;
}

.brightness-track {
  flex: 1;
  height: 44px;
  background: linear-gradient(
    90deg,
    rgba(58, 58, 110, 0.7) 0%,
    rgba(74, 74, 122, 0.6) 50%,
    rgba(77, 90, 122, 0.5) 100%
  );
  border-radius: 22px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(150, 180, 220, 0.25);
}

.brightness-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(120, 180, 240, 0.9) 0%,
    rgba(180, 220, 255, 0.95) 50%,
    rgba(230, 245, 255, 1) 100%
  );
  border-radius: 22px;
  transition: width 0.1s ease;
  min-width: 10px;
  box-shadow:
    0 0 20px rgba(100, 180, 255, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.brightness-input {
  position: absolute;
  top: 0;
  left: 44px;
  right: 44px;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

/* 色温调节样式 */
.color-temp-section {
  margin-bottom: 24px;
}

.color-temp-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.color-temp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.color-temp-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.color-temp-divider {
  color: rgba(255, 255, 255, 0.3);
}

.color-temp-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.color-temp-slider-container {
  position: relative;
}

.color-temp-track {
  height: 44px;
  background: linear-gradient(
    90deg,
    #ffb347 0%,
    #ffcc80 20%,
    #ffe4b5 40%,
    #f5f5dc 60%,
    #e0f0ff 80%,
    #87ceeb 100%
  );
  border-radius: 22px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-temp-thumb {
  position: absolute;
  width: 38px;
  height: 38px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  top: 50%;
  transform: translateY(-50%);
}

.color-temp-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

/* 控制按钮样式 */
.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-label {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

/* 模式选择样式 */
.mode-section {
  margin-top: 8px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 14px;
  text-align: center;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mode-grid.disabled {
  pointer-events: none;
}

.mode-btn {
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-grid.vertical .mode-btn {
  padding: 18px 10px;
}

.mode-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.mode-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
}

.mode-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
