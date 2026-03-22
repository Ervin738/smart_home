<!--
  智能床长按弹窗
  功能：显示智能床控制界面，包括背部升降和腿部升降调节
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
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

const backAngle = ref(5) // 背部升降角度 0-60
const legAngle = ref(0) // 腿部升降角度 0-45
const morningWakeup = ref(false) // 晨起唤醒开关

// 当设备改变时，恢复该设备的状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    const d = props.device as any
    backAngle.value = d.backAngle ?? 5
    legAngle.value = d.legAngle ?? 0
    morningWakeup.value = d.morningWakeup ?? false
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    backAngle.value = d.backAngle ?? 5
    legAngle.value = d.legAngle ?? 0
    morningWakeup.value = d.morningWakeup ?? false
  }
})

// 离线时重置本地状态并持久化
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    backAngle.value = 5
    legAngle.value = 0
    morningWakeup.value = false
    devicesStore.setDeviceExtra(props.device.id, { backAngle: 5, legAngle: 0, morningWakeup: false })
  }
})

// 关闭弹窗
const close = () => {
  // 保存当前状态到设备
  if (props.device) {
    devicesStore.setSmartBedBackAngle(props.device.id, backAngle.value)
    devicesStore.setSmartBedLegAngle(props.device.id, legAngle.value)
  }
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 调整背部角度
const onBackAngleChange = (value: number) => {
  backAngle.value = value
  if (props.device) {
    devicesStore.setSmartBedBackAngle(props.device.id, value)
  }
}

// 调整腿部角度
const onLegAngleChange = (value: number) => {
  legAngle.value = value
  if (props.device) {
    devicesStore.setSmartBedLegAngle(props.device.id, value)
  }
}
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

          <!-- 床的图示 -->
          <div class="bed-visualization">
            <svg viewBox="0 0 400 120" class="bed-svg">
              <!-- 床架 -->
              <rect x="40" y="95" width="320" height="5" fill="rgba(255, 255, 255, 0.2)" rx="2.5"/>
              <rect x="50" y="100" width="5" height="14" fill="rgba(255, 255, 255, 0.2)" rx="2"/>
              <rect x="345" y="100" width="5" height="14" fill="rgba(255, 255, 255, 0.2)" rx="2"/>
              
              <!-- 背部（向上旋转，旋转中心在底部右侧） -->
              <g :transform="`rotate(${backAngle} 160 95)`">
                <rect x="60" y="78" width="100" height="17" fill="rgba(150, 160, 180, 0.8)" rx="4"/>
              </g>
              
              <!-- 中间平坦部分 -->
              <rect x="160" y="78" width="80" height="17" fill="rgba(150, 160, 180, 0.8)"/>
              
              <!-- 腿部（向上旋转，旋转中心在底部左侧） -->
              <g :transform="`rotate(${-legAngle} 240 95)`">
                <rect x="240" y="78" width="100" height="17" fill="rgba(150, 160, 180, 0.8)" rx="4"/>
              </g>
              
              <!-- 角度标注 - 背部 -->
              <text x="20" y="55" fill="rgba(255, 255, 255, 0.9)" font-size="20" font-weight="300">{{ backAngle }}°</text>
              <path d="M 110 95 Q 90 85 70 75" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1" stroke-dasharray="3,3" fill="none"/>
              
              <!-- 角度标注 - 腿部 -->
              <text x="358" y="55" fill="rgba(255, 255, 255, 0.9)" font-size="20" font-weight="300">{{ legAngle }}°</text>
              <path d="M 290 95 Q 310 85 330 75" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1" stroke-dasharray="3,3" fill="none"/>
            </svg>
          </div>

          <!-- 背部升降 -->
          <div class="control-section">
            <div class="control-header">
              <span class="control-label">背部升降</span>
              <span class="control-value">{{ backAngle }}°</span>
            </div>
            <div class="slider-container">
              <span class="slider-min">0</span>
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(backAngle / 60) * 100}%` }"></div>
                <input 
                  type="range" 
                  v-model.number="backAngle" 
                  min="0" 
                  max="60" 
                  class="slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onBackAngleChange(backAngle)"
                />
              </div>
              <span class="slider-max">60</span>
            </div>
          </div>

          <!-- 腿部升降 -->
          <div class="control-section">
            <div class="control-header">
              <span class="control-label">腿部升降</span>
              <span class="control-value">{{ legAngle }}°</span>
            </div>
            <div class="slider-container">
              <span class="slider-min">0</span>
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(legAngle / 45) * 100}%` }"></div>
                <input 
                  type="range" 
                  v-model.number="legAngle" 
                  min="0" 
                  max="45" 
                  class="slider-input"
                  :disabled="device.status === 'offline'"
                  @input="onLegAngleChange(legAngle)"
                />
              </div>
              <span class="slider-max">45</span>
            </div>
          </div>

          <!-- 晨起唤醒开关 -->
          <div class="feature-section">
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="feature-label">晨起唤醒</div>
              <label class="feature-toggle">
                <input type="checkbox" v-model="morningWakeup" :disabled="device.status === 'offline'" @change="devicesStore.setDeviceExtra(device.id, { morningWakeup })" />
                <span class="toggle-slider"></span>
              </label>
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

/* 床的图示 */
.bed-visualization {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
}

.bed-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* 控制区域 */
.control-section {
  margin-bottom: 24px;
}

.control-section:last-child {
  margin-bottom: 0;
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
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-min,
.slider-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 20px;
}

.slider-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--bottom-bar-active-bg);
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
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

.slider-input:disabled {
  cursor: not-allowed;
}

/* 功能区域 */
.feature-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s;
}

.feature-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--dialog-btn-active-bg-1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon {
  color: white;
}

.feature-label {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.feature-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.feature-toggle input {
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
  background: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.3s;
  border-radius: 50%;
}

.feature-toggle input:checked + .toggle-slider {
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
}

.feature-toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.feature-toggle input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
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
