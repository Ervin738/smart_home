<!--
  亮度控制组件
  功能：控制灯光设备的亮度，显示在页面底部
  触发：在 App.vue 中选择灯光设备后显示
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/stores/devices'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:brightness', value: number): void
  (e: 'toggle-power'): void
  (e: 'close'): void
}>()

const localBrightness = ref(props.device?.brightness ?? 0)

watch(() => props.device, (newDevice) => {
  if (newDevice) {
    localBrightness.value = newDevice.brightness ?? 0
  }
})

function onSliderChange(value: number) {
  localBrightness.value = value
  emit('update:brightness', value)
}

function onPowerClick() {
  emit('toggle-power')
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="device" class="brightness-wrapper">
      <div class="top-info">
        <span class="device-name">{{ device.name }} · {{ device.lightType === 'table-lamp' ? '台灯' : '吸顶灯' }}</span>
        <span class="percentage">{{ localBrightness }}%</span>
      </div>
      
      <div class="control-bar">
        <div class="power-btn" :class="{ active: device.status === 'online' }" @click="onPowerClick">
          <span class="power-text">{{ device.status === 'online' ? '关闭电源' : '开启电源' }}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="slider-section" :class="{ disabled: device.status === 'offline' }">
          <svg class="sun-icon sun-small" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          
          <div class="brightness-track">
            <div class="brightness-fill" :style="{ width: localBrightness + '%' }"></div>
            <input 
              type="range" 
              v-model.number="localBrightness" 
              min="0" 
              max="100" 
              class="brightness-input"
              :disabled="device.status === 'offline'"
              @input="onSliderChange(localBrightness)"
            />
          </div>
          
          <svg class="sun-icon sun-large" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.brightness-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
}

.top-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.percentage {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.control-bar {
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.power-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.power-btn.active {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
}

.power-btn:hover { transform: scale(1.02); }
.power-btn:active { transform: scale(0.98); }
.power-text { font-size: 13px; font-weight: 600; white-space: nowrap; }

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

.brightness-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  border-radius: 20px;
  min-width: 10px;
  transition: width 0.15s ease;
  box-shadow: 0 0 15px rgba(100, 180, 255, 0.4);
}

.brightness-input {
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

.sun-icon { color: rgba(180, 220, 255, 0.9); flex-shrink: 0; }
.sun-small { width: 20px; height: 20px; opacity: 0.6; }
.sun-large { width: 26px; height: 26px; }

.slide-up-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-leave-active { transition: all 0.25s ease-out; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
