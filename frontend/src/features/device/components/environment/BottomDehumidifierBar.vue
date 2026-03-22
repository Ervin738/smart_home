<!--
  除湿机底部控制栏
  功能：单击除湿机设备卡片后显示，提供电源开关和模式切换
  触发：单击除湿机设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
}>()

const devicesStore = useDevicesStore()

// 目标湿度 (40-70%)
const targetHumidity = ref(50)
const tempTargetHumidity = ref(50)
const isDragging = ref(false)

// 监听设备目标湿度变化，同步临时值
watch(() => (props.device as any)?.targetHumidity, (newValue) => {
  if (newValue !== undefined && !isDragging.value) {
    tempTargetHumidity.value = newValue
    targetHumidity.value = newValue
  }
}, { immediate: true })

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const device = props.device as any
    const humidity = device.targetHumidity ?? 50
    targetHumidity.value = humidity
    tempTargetHumidity.value = humidity
  }
})

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
  if (props.device) {
    devicesStore.setTargetHumidity(props.device.id, roundedValue)
  }
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-dehumidifier-bar" @click.stop>
      <div class="dehumidifier-bar-content">
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
        
        <!-- 右侧湿度滑条 -->
        <div class="humidity-section" :class="{ disabled: device.status === 'offline' }">
          <div class="humidity-slider-wrapper">
            <div class="slider-track">
              <div 
                class="humidity-indicator" 
                :class="{ dragging: isDragging }"
                :style="{ left: `calc(((${tempTargetHumidity} - 40) / 30) * (100% - 40px))` }"
              >
              </div>
              <div 
                class="slider-fill"
                :class="{ dragging: isDragging }"
                :style="{ 
                  width: tempTargetHumidity === 40 ? '0' : 
                         tempTargetHumidity === 70 ? '100%' : 
                         `calc(((${tempTargetHumidity} - 40) / 30) * (100% - 40px) + 40px)` 
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
        
        <!-- 顶部居中设备名称和湿度显示 -->
        <div class="device-info-top">
          <span class="device-name">{{ device.name }} · 除湿机</span>
          <span class="info-divider">|</span>
          <span class="humidity-display">目标湿度 {{ Math.round(tempTargetHumidity) }}%</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-dehumidifier-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.dehumidifier-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
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
  background: var(--bottom-bar-active-bg);
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

.humidity-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
  transition: opacity 0.3s ease;
}

.humidity-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.humidity-display {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.device-info-top {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  flex-wrap: nowrap;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  letter-spacing: 1px;
}

.info-divider {
  color: rgba(255, 255, 255, 0.4);
  font-size: 15px;
}

.humidity-slider-wrapper {
  position: relative;
  width: 100%;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 20;
}

.slider-track {
  height: 40px;
  background: linear-gradient(
    90deg,
    rgba(58, 58, 110, 0.7) 0%,
    rgba(74, 74, 122, 0.6) 50%,
    rgba(77, 90, 122, 0.5) 100%
  );
  border-radius: 20px;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.4);
  z-index: 10;
  transition: left 0.15s ease-out;
}

.humidity-indicator.dragging {
  transition: none;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #26d0ce 0%, #1fa19f 100%);
  border-radius: 20px;
  transition: width 0.15s ease-out;
  pointer-events: none;
  box-shadow:
    0 0 20px rgba(38, 208, 206, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.slider-fill.dragging {
  transition: none;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
