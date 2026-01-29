<!--
  电暖器底部控制栏
  功能：快速控制电暖器开关和目标温度
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'toggle-power'): void
  (e: 'update:targetTemp', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localTargetTemp = ref(25)

// 当设备改变时，恢复该设备的温度状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    localTargetTemp.value = props.device.targetTemp ?? 25
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    localTargetTemp.value = props.device.targetTemp ?? 25
  }
})

// 当设备温度改变时同步
watch(() => props.device?.targetTemp, (newTemp) => {
  if (newTemp !== undefined) {
    localTargetTemp.value = newTemp
  }
})

const handleTogglePower = () => {
  emit('toggle-power')
}

const onSliderChange = (value: number) => {
  localTargetTemp.value = value
  emit('update:targetTemp', value)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-heater-bar" @click.stop>
      <div class="heater-bar-content">
        <!-- 左侧电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="handleTogglePower"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧温度调节 -->
        <div class="slider-section" :class="{ disabled: device.status === 'offline' }">
          <svg class="temp-icon temp-small" viewBox="0 0 24 24" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          <div class="temp-track">
            <div class="temp-fill" :style="{ width: `${((localTargetTemp - 16) / (32 - 16)) * 100}%` }"></div>
            <input 
              type="range" 
              v-model.number="localTargetTemp" 
              min="16" 
              max="32" 
              class="temp-input"
              :disabled="device.status === 'offline'"
              @input="onSliderChange(localTargetTemp)"
            />
          </div>
          
          <svg class="temp-icon temp-large" viewBox="0 0 24 24" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 电暖器</span>
          <div class="name-divider"></div>
          <span class="device-temp">{{ localTargetTemp }}°C</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-heater-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.heater-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(30, 40, 60, 0.95) 0%,
    rgba(40, 55, 80, 0.95) 50%,
    rgba(50, 70, 100, 0.95) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
  overflow: visible;
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.control-btn.active {
  background: rgb(59, 130, 246);
  border: none;
  border-radius: 16px;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.slider-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 320px;
}

.slider-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.temp-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
}

.temp-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(251, 146, 60, 0.9) 0%,
    rgba(249, 115, 22, 0.95) 50%,
    rgba(234, 88, 12, 1) 100%
  );
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
}

.temp-input {
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

.temp-icon {
  color: rgba(251, 146, 60, 0.9);
  flex-shrink: 0;
}

.temp-small {
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.temp-large {
  width: 26px;
  height: 26px;
}

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.name-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.device-temp {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
