<!--
  浴霸底部控制栏
  功能：快速控制浴霸照明、换气、暖风和温度
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
  windMode?: 'warm' | 'blow'
}

interface Emits {
  (e: 'toggle-power'): void
  (e: 'update:windMode', value: 'warm' | 'blow'): void
  (e: 'update:ventilationEnabled', value: boolean): void
  (e: 'update:heatingEnabled', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  windMode: 'warm'
})
const emit = defineEmits<Emits>()

const store = useDevicesStore()
const isDragging = ref(false)
const sliderRef = ref<HTMLElement | null>(null)

const lightEnabled = computed({
  get: () => (props.device as any)?.yubaLightEnabled ?? false,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { yubaLightEnabled: v }) }
})

const ventilationEnabled = computed({
  get: () => (props.device as any)?.yubaVentilationEnabled ?? false,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { yubaVentilationEnabled: v }) }
})

const heatingEnabled = computed({
  get: () => (props.device as any)?.yubaHeatingEnabled ?? false,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { yubaHeatingEnabled: v }) }
})

const targetTemp = computed({
  get: () => (props.device as any)?.yubaTargetTemp ?? 37,
  set: (v: number) => { if (props.device) store.setDeviceExtra(props.device.id, { yubaTargetTemp: v }) }
})

// 监听设备状态，离线时取消所有选中
watch(() => props.device?.status, (status) => {
  if (status === 'offline' && props.device) {
    store.setDeviceExtra(props.device.id, {
      yubaLightEnabled: false,
      yubaVentilationEnabled: false,
      yubaHeatingEnabled: false
    })
    emit('update:ventilationEnabled', false)
    emit('update:heatingEnabled', false)
    emit('update:windMode', 'warm')
  }
})

const toggleLight = () => { lightEnabled.value = !lightEnabled.value }

const toggleVentilation = () => {
  ventilationEnabled.value = !ventilationEnabled.value
  emit('update:ventilationEnabled', ventilationEnabled.value)
  if (ventilationEnabled.value) emit('update:windMode', 'blow')
}

const toggleHeating = () => {
  heatingEnabled.value = !heatingEnabled.value
  emit('update:heatingEnabled', heatingEnabled.value)
  if (heatingEnabled.value) emit('update:windMode', 'warm')
}

const handleTogglePower = () => { emit('toggle-power') }

const updateTempFromPosition = (clientX: number) => {
  if (!sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  targetTemp.value = Math.round(10 + percentage * 40)
}

const onSliderMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  updateTempFromPosition(e.clientX)
  document.body.style.userSelect = 'none'
}

const onSliderMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  updateTempFromPosition(e.clientX)
}

const onSliderMouseUp = () => {
  isDragging.value = false
  document.body.style.userSelect = 'auto'
}

const cleanup = () => {
  document.removeEventListener('mousemove', onSliderMouseMove)
  document.removeEventListener('mouseup', onSliderMouseUp)
}

watch(isDragging, (dragging) => {
  if (dragging) {
    document.addEventListener('mousemove', onSliderMouseMove)
    document.addEventListener('mouseup', onSliderMouseUp)
  } else {
    cleanup()
  }
})

onUnmounted(() => { cleanup() })

const sliderPercentage = computed(() => ((targetTemp.value - 10) / 40) * 100)
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-yuba-bar" @click.stop>
      <div class="yuba-bar-content">
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

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 功能按钮区域 -->
        <div class="function-buttons">
          <div 
            class="function-btn"
            :class="{ active: lightEnabled }"
            @click="toggleLight"
          >
            <div class="btn-circle">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="btn-label">照明</span>
          </div>

          <div 
            class="function-btn"
            :class="{ active: ventilationEnabled }"
            @click="toggleVentilation"
          >
            <div class="btn-circle">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L8 8h8l-4-6zM12 22l4-6H8l4 6zM2 12l6-4v8l-6-4zM22 12l-6 4V8l6 4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="btn-label">换气</span>
          </div>

          <div 
            class="function-btn"
            :class="{ active: heatingEnabled }"
            @click="toggleHeating"
          >
            <div class="btn-circle">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <span class="btn-label">暖风</span>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 温度控制区域 -->
        <div class="temp-control">
          <div 
            ref="sliderRef"
            class="temp-slider"
            @mousedown.prevent="onSliderMouseDown"
          >
            <div class="slider-track">
              <div class="slider-fill" :style="{ width: sliderPercentage + '%' }"></div>
            </div>
          </div>
        </div>
        
        <!-- 顶部居中设备名称和温度 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 浴霸</span>
          <div class="name-divider"></div>
          <div class="temp-info">
            <span class="temp-info-label">设定温度</span>
            <span class="temp-info-value">{{ targetTemp }}°C</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-yuba-bar {
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

.bottom-yuba-bar * {
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.yuba-bar-content {
  display: flex;
  flex-direction: row;
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
  overflow: visible;
  outline: none;
  user-select: none;
}

/* 功能按钮区域 */
.function-buttons {
  display: flex;
  gap: 8px;
}

.function-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.function-btn.active .btn-circle {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.function-btn.active .btn-icon {
  color: white;
}

.btn-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.function-btn.active .btn-label {
  color: rgba(255, 255, 255, 0.95);
}

/* 温度控制区域 */
.temp-control {
  display: flex;
  align-items: center;
}

/* 温度滑条 */
.temp-slider {
  width: 200px;
  height: 32px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.temp-slider:focus {
  outline: none;
}

.slider-track {
  position: relative;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  transition: width 0.1s ease;
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
}

/* 电源开关 */
.power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 24px;
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
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
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

.temp-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-info-label {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.temp-info-value {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
