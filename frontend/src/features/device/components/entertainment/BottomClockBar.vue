<!--
  时钟底部控制栏
  功能：快速控制时钟开关和亮度
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
  brightness: number
}

interface Emits {
  (e: 'toggle-power'): void
  (e: 'update:brightness', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleTogglePower = () => {
  emit('toggle-power')
}

const localBrightness = computed({
  get: () => props.brightness,
  set: (value: number) => emit('update:brightness', value)
})

const adjustBrightness = (delta: number) => {
  const newValue = Math.max(0, Math.min(100, props.brightness + delta))
  emit('update:brightness', newValue)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-clock-bar" @click.stop>
      <div class="clock-bar-content">
        <!-- 电源开关 -->
        <div 
          class="power-btn"
          :class="{ active: device.status === 'online' }"
          @click="handleTogglePower"
        >
          <svg class="power-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="power-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
        </div>

        <!-- 亮度调节 -->
        <div class="brightness-section">
          <div class="brightness-control">
            <div 
              class="adjust-btn"
              @click="adjustBrightness(-5)"
            >
              <span>−</span>
            </div>
            
            <div class="slider-wrapper">
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: brightness + '%' }"></div>
              </div>
              <input 
                type="range" 
                v-model.number="localBrightness" 
                min="0" 
                max="100" 
                class="slider-input"
              />
            </div>
            
            <div 
              class="adjust-btn"
              @click="adjustBrightness(5)"
            >
              <span>+</span>
            </div>
          </div>
        </div>
        
        <!-- 顶部居中设备名称和亮度 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 时钟</span>
          <span class="brightness-info">亮度 {{ brightness }}%</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-clock-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.bottom-clock-bar * {
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.clock-bar-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
  overflow: visible;
  outline: none;
  user-select: none;
  min-width: 500px;
}

/* 电源开关 */
.power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.power-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.power-btn.active {
  background: var(--bottom-bar-active-bg);
  border: none;
  box-shadow: none;
}

.power-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.power-btn.active .power-icon {
  color: white;
}

.power-text {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}

.power-btn.active .power-text {
  color: white;
}

/* 亮度调节 */
.brightness-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
}

.brightness-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.adjust-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}

.adjust-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.slider-wrapper {
  flex: 1;
  height: 32px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.slider-track {
  position: relative;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--bottom-bar-active-bg);
  border-radius: 16px;
  transition: width 0.2s ease;
  min-width: 10px;
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

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.brightness-info {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
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
