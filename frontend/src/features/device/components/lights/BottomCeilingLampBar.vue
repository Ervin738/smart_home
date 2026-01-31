<!--
  吸顶灯底部控制栏
  功能：单击吸顶灯设备卡片后显示，提供电源开关和亮度调节
  触发：单击吸顶灯设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'update:brightness', value: number): void
}>()

const localBrightness = ref(0)

// 当设备改变时，恢复该设备的亮度状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    localBrightness.value = props.device.brightness ?? 0
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    localBrightness.value = props.device.brightness ?? 0
  }
})

// 当设备亮度改变时同步
watch(() => props.device?.brightness, (newBrightness) => {
  if (newBrightness !== undefined) {
    localBrightness.value = newBrightness
  }
})

const onSliderChange = (value: number) => {
  localBrightness.value = value
  emit('update:brightness', value)
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-ceiling-lamp-bar" @click.stop>
      <div class="ceiling-lamp-bar-content">
        <!-- 左侧电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧亮度调节 -->
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
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 吸顶灯</span>
          <div class="name-divider"></div>
          <span class="device-percentage">{{ localBrightness }}%</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-ceiling-lamp-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.ceiling-lamp-bar-content {
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

.brightness-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: none;
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

.sun-icon {
  color: rgba(180, 220, 255, 0.9);
  flex-shrink: 0;
}

.sun-small {
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.sun-large {
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

.device-percentage {
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
