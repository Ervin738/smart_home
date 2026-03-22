<!--
  电热水壶长按弹窗
  功能：显示电热水壶控制界面，包括温度显示和加热控制
-->
<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const devicesStore = useDevicesStore()

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

// 当前水温
const currentTemp = ref(40)
// 目标温度
const targetTemp = ref(70)
// 是否正在加热
const isHeating = ref(false)
// 是否正在保温
const isKeepingWarm = ref(false)
// 是否显示温度选择器
const showTempSelector = ref(false)
// 是否从底部弹窗打开（如果是，则隐藏长按弹窗主内容）
const openedFromBottomBar = ref(false)
// 是否显示温度预设选择
const showTempPresets = ref(false)
// 临时选择的温度（用于picker）
const tempPickerValue = ref(70)
// 自动定温
const autoKeepWarm = ref(true)

const autoKeepWarmComputed = computed({
  get: () => (props.device as any)?.kettleAutoKeepWarm ?? true,
  set: (v: boolean) => {
    autoKeepWarm.value = v
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { kettleAutoKeepWarm: v })
  }
})
// 定温时长（小时）
const keepWarmDuration = ref(1.0)
// 是否显示定温时长选择器
const showKeepWarmDurationPicker = ref(false)
// 临时选择的定温时长
const tempKeepWarmDuration = ref(1.0)
// 定温时长选项（0.5到24小时，步长0.5）
const keepWarmDurationOptions = Array.from({ length: 48 }, (_, i) => (i + 1) * 0.5)
// 加热定时器
let heatingInterval: number | null = null
// 拖动相关
const isDragging = ref(false)
const dragStartY = ref(0)
const dragStartScrollTop = ref(0)

// 预设温度选项
const tempPresets = [
  { temp: 45, label: '45°C', desc: '温水' },
  { temp: 60, label: '60°C', desc: '冲奶' },
  { temp: 80, label: '80°C', desc: '泡茶' },
  { temp: 100, label: '100°C', desc: '沸水' }
]

// 生成温度范围 40-100
const tempRange = Array.from({ length: 61 }, (_, i) => 40 + i)

const openTempSelector = () => {
  if (props.device?.status === 'offline') return
  showTempSelector.value = true
}

const openTempPresets = () => {
  tempPickerValue.value = targetTemp.value
  showTempPresets.value = true
}

const openKeepWarmDurationPicker = () => {
  tempKeepWarmDuration.value = keepWarmDuration.value
  showKeepWarmDurationPicker.value = true
}

const cancelKeepWarmDurationSelection = () => {
  showKeepWarmDurationPicker.value = false
}

const confirmKeepWarmDurationSelection = () => {
  keepWarmDuration.value = tempKeepWarmDuration.value
  showKeepWarmDurationPicker.value = false
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { kettleKeepWarmDuration: keepWarmDuration.value })
}

const cancelTempSelection = () => {
  showTempPresets.value = false
}

const confirmTempSelection = () => {
  targetTemp.value = tempPickerValue.value
  showTempPresets.value = false
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { kettleTargetTemp: targetTemp.value })
}

const onTempScroll = (event: Event) => {
  const container = event.target as HTMLElement
  const scrollTop = container.scrollTop
  const itemHeight = 56 // 48px height + 8px gap
  const centerIndex = Math.round(scrollTop / itemHeight)
  if (centerIndex >= 0 && centerIndex < tempRange.length) {
    const temp = tempRange[centerIndex]
    if (temp !== undefined) {
      tempPickerValue.value = temp
    }
  }
}

const onTempWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 1 : -1
  const currentIndex = tempRange.indexOf(tempPickerValue.value)
  const newIndex = Math.max(0, Math.min(tempRange.length - 1, currentIndex + delta))
  const temp = tempRange[newIndex]
  if (temp !== undefined) {
    tempPickerValue.value = temp
  }
  
  // 滚动到对应位置
  const container = event.currentTarget as HTMLElement
  const itemHeight = 56
  container.scrollTop = newIndex * itemHeight
}

const onTempMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  dragStartY.value = event.clientY
  const container = event.currentTarget as HTMLElement
  dragStartScrollTop.value = container.scrollTop
  container.style.cursor = 'grabbing'
  container.style.userSelect = 'none'
}

const onTempMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return
  event.preventDefault()
  
  const container = event.currentTarget as HTMLElement
  const deltaY = event.clientY - dragStartY.value
  const newScrollTop = dragStartScrollTop.value - deltaY
  container.scrollTop = newScrollTop
}

const onTempMouseUp = (event: MouseEvent) => {
  if (!isDragging.value) return
  isDragging.value = false
  const container = event.currentTarget as HTMLElement
  container.style.cursor = 'grab'
  container.style.userSelect = 'auto'
}

const onTempMouseLeave = (event: MouseEvent) => {
  if (!isDragging.value) return
  isDragging.value = false
  const container = event.currentTarget as HTMLElement
  container.style.cursor = 'grab'
  container.style.userSelect = 'auto'
}

const confirmHeating = () => {
  if (props.device?.status === 'offline') return
  showTempSelector.value = false
  
  // 如果是从底部弹窗打开的，关闭整个弹窗
  if (openedFromBottomBar.value) {
    openedFromBottomBar.value = false
    emit('update:visible', false)
  }
  
  startHeating()
}

const closeTempSelector = () => {
  showTempSelector.value = false
  if (openedFromBottomBar.value) {
    // 如果是从底部弹窗打开的，关闭温度选择器时也关闭整个弹窗
    openedFromBottomBar.value = false
    emit('update:visible', false)
  }
}

const startHeating = () => {
  if (props.device?.status === 'offline' || !props.device) return
  isHeating.value = true
  isKeepingWarm.value = false
  
  devicesStore.setDeviceExtra(props.device.id, { electricKettleHeating: true, electricKettleKeepingWarm: false })
  
  // 模拟加热过程：每秒增加1-2度
  heatingInterval = window.setInterval(() => {
    if (currentTemp.value < targetTemp.value) {
      const increment = Math.random() > 0.5 ? 2 : 1
      currentTemp.value = Math.min(currentTemp.value + increment, targetTemp.value)
      // 每5秒同步一次当前温度
      if (props.device && Math.floor(Date.now() / 5000) % 1 === 0) {
        devicesStore.setDeviceExtra(props.device.id, { kettleCurrentTemp: currentTemp.value })
      }
    } else {
      // 达到目标温度
      if (heatingInterval) {
        clearInterval(heatingInterval)
        heatingInterval = null
      }
      
      if (autoKeepWarm.value) {
        // 如果开启自动定温，进入保温状态
        isHeating.value = false
        isKeepingWarm.value = true
        
        if (props.device) {
          devicesStore.setDeviceExtra(props.device.id, { electricKettleHeating: false, electricKettleKeepingWarm: true })
        }
        
        // 如果开启自动定温，进入保温状态
      } else {
        // 否则停止加热
        isHeating.value = false
        
        if (props.device) {
          devicesStore.setDeviceExtra(props.device.id, { electricKettleHeating: false, electricKettleKeepingWarm: false })
        }
        
        // 已达到目标温度
      }
    }
  }, 1000)
}

const stopHeating = () => {
  isHeating.value = false
  isKeepingWarm.value = false
  
  if (props.device) {
    devicesStore.setDeviceExtra(props.device.id, { electricKettleHeating: false, electricKettleKeepingWarm: false })
  }
  
  if (heatingInterval) {
    clearInterval(heatingInterval)
    heatingInterval = null
  }
  // 停止加热后，温度慢慢降回40度
  const coolingInterval = window.setInterval(() => {
    if (currentTemp.value > 40) {
      currentTemp.value = Math.max(currentTemp.value - 1, 40)
    } else {
      clearInterval(coolingInterval)
    }
  }, 2000)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (heatingInterval) {
    clearInterval(heatingInterval)
    heatingInterval = null
  }
  // 移除事件监听
  window.removeEventListener('open-electric-kettle-temp-selector', handleOpenTempSelector as EventListener)
  window.removeEventListener('open-electric-kettle-temp-selector-direct', handleOpenTempSelectorDirect as EventListener)
})

// 组件挂载时添加事件监听
onMounted(() => {
  window.addEventListener('open-electric-kettle-temp-selector', handleOpenTempSelector as EventListener)
  window.addEventListener('open-electric-kettle-temp-selector-direct', handleOpenTempSelectorDirect as EventListener)
  
  // 检查是否有待处理的温度选择器打开请求
  checkAndOpenTempSelector()
})

// 监听visible变化，当弹窗打开时检查是否需要显示温度选择器
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 从设备状态恢复
    if (props.device) {
      const d = props.device as any
      targetTemp.value = d.kettleTargetTemp ?? 70
      tempPickerValue.value = targetTemp.value
      autoKeepWarm.value = d.kettleAutoKeepWarm ?? true
      keepWarmDuration.value = d.kettleKeepWarmDuration ?? 1.0
      currentTemp.value = d.kettleCurrentTemp ?? 40
      isHeating.value = d.electricKettleHeating ?? false
      isKeepingWarm.value = d.electricKettleKeepingWarm ?? false
    }
    checkAndOpenTempSelector()
  } else {
    // 弹窗关闭时重置状态
    showTempSelector.value = false
    showTempPresets.value = false
    openedFromBottomBar.value = false
  }
})

// 监听设备离线，停止加热
watch(() => props.device?.status, (status) => {
  if (status === 'offline') {
    if (heatingInterval) { clearInterval(heatingInterval); heatingInterval = null }
    isHeating.value = false
    isKeepingWarm.value = false
  }
})

// 检查并打开温度选择器的辅助函数
const checkAndOpenTempSelector = () => {
  const shouldOpen = sessionStorage.getItem('openElectricKettleTempSelector')
  if (shouldOpen === 'true') {
    const temp = parseInt(sessionStorage.getItem('electricKettleTargetTemp') || '70')
    targetTemp.value = temp
    tempPickerValue.value = temp
    showTempSelector.value = true
    openedFromBottomBar.value = true // 标记为从底部弹窗打开
    // 清除标记
    sessionStorage.removeItem('openElectricKettleTempSelector')
    sessionStorage.removeItem('electricKettleTargetTemp')
  }
}

// 处理从底部弹窗直接打开温度选择器的事件（不显示长按弹窗）
const handleOpenTempSelectorDirect = (event: CustomEvent) => {
  const { temp } = event.detail
  if (temp) {
    targetTemp.value = temp
    tempPickerValue.value = temp
  }
  // 直接打开温度选择器弹窗，不打开长按弹窗
  console.log('ElectricKettleDialog: 设置 showTempSelector = true')
  showTempSelector.value = true
}

// 处理从底部弹窗打开温度选择器的事件
const handleOpenTempSelector = (event: CustomEvent) => {
  console.log('ElectricKettleDialog: 接收到打开温度选择器事件', event.detail)
  const { temp } = event.detail
  if (temp) {
    targetTemp.value = temp
    tempPickerValue.value = temp
  }
  // 直接打开温度选择器弹窗
  console.log('ElectricKettleDialog: 设置 showTempSelector = true')
  showTempSelector.value = true
}

</script>

<template>
  <!-- 长按弹窗 -->
  <transition name="dialog">
    <div v-if="visible && device && !openedFromBottomBar" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content kettle-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">电热水壶</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <div class="kettle-layout">
          <!-- 顶部按钮组 -->
          <div class="top-buttons">
            <!-- 电源按钮 -->
            <div 
              class="kettle-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>

            <!-- 定时按钮 -->
            <div 
              class="timer-btn"
              :class="{ disabled: device.status === 'offline' }"
              @click="device.status === 'online' && emit('open-timer')"
            >
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="timer-label">定时</span>
            </div>
          </div>

          <!-- 温度显示 -->
          <div class="temp-display-section">
            <div class="temp-label">当前水温</div>
            <div class="temp-value-large">
              <span class="temp-number">{{ currentTemp }}</span>
              <span class="temp-unit">°C</span>
            </div>
            <div v-if="isHeating" class="heating-status">
              <svg class="heating-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="heating-text">加热中······</span>
            </div>
            <div v-if="isKeepingWarm" class="heating-status keep-warm">
              <svg class="heating-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="heating-text">保温中······</span>
            </div>
          </div>

          <!-- 加热控制 -->
          <div class="heating-control">
            <button 
              v-if="!isHeating && !isKeepingWarm"
              class="heat-btn start"
              :disabled="device.status === 'offline'"
              @click="openTempSelector"
            >
              <svg class="heat-icon" viewBox="0 0 24 24" fill="none">
                <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="heat-text">加热</span>
            </button>
            <button 
              v-else
              class="heat-btn stop"
              @click="stopHeating"
            >
              <svg class="heat-icon" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
              </svg>
              <span class="heat-text">{{ isKeepingWarm ? '停止保温' : '停止加热' }}</span>
            </button>
          </div>

          <!-- 保温选项 -->
          <div class="keep-warm-option">
            <div class="option-item">
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">保温功能</span>
              <label class="option-toggle">
                <input 
                  type="checkbox"
                  v-model="autoKeepWarmComputed"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 温度选择器弹窗 (独立于长按弹窗) -->
  <transition name="selector">
    <div v-if="showTempSelector && device" class="temp-selector-overlay" @click="closeTempSelector">
      <div class="temp-selector" @click.stop>
        <!-- 标题：当前水温 -->
        <div class="selector-header">
          <span class="header-title">当前水温</span>
        </div>

        <!-- 分割线 -->
        <div class="header-divider"></div>

        <!-- 温度数值显示 -->
        <div class="temp-value-display">
          <span class="temp-number-large">{{ currentTemp }}</span>
          <span class="temp-unit-large">°C</span>
        </div>

        <!-- 加热温度选择 -->
        <div class="temp-select-row" @click="openTempPresets">
          <span class="select-label">加热温度</span>
          <div class="select-value">
            <span class="value-text">{{ targetTemp }}°C</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 自动定温开关 -->
        <div class="keep-warm-row">
          <span class="keep-warm-label">到达温度后自动定温</span>
          <label class="keep-warm-toggle">
            <input type="checkbox" v-model="autoKeepWarmComputed" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 定温时长选择（仅在开启自动定温时显示） -->
        <div v-if="autoKeepWarm" class="temp-select-row" @click="openKeepWarmDurationPicker">
          <span class="select-label">定温时长</span>
          <div class="select-value">
            <span class="value-text">{{ keepWarmDuration }} 小时</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 开始加热按钮 -->
        <button class="start-heating-btn" @click="confirmHeating">
          开始加热
        </button>
      </div>
    </div>
  </transition>

  <!-- 温度预设选择弹窗 (独立于长按弹窗) -->
  <transition name="selector">
    <div v-if="showTempPresets && device" class="temp-selector-overlay" @click="cancelTempSelection">
      <div class="temp-presets-selector" @click.stop>
        <div class="selector-title">加热温度</div>
        
        <!-- 温度滚动选择器 -->
        <div class="temp-picker-container">
          <div class="picker-highlight"></div>
          <div 
            class="temp-picker" 
            @scroll="onTempScroll" 
            @wheel="onTempWheel"
            @mousedown="onTempMouseDown"
            @mousemove="onTempMouseMove"
            @mouseup="onTempMouseUp"
            @mouseleave="onTempMouseLeave"
          >
            <div 
              v-for="temp in tempRange" 
              :key="temp"
              class="temp-option"
              :class="{ active: temp === tempPickerValue }"
              @click="tempPickerValue = temp"
            >
              {{ temp }}<span class="temp-unit-suffix">°C</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="selector-buttons">
          <button class="selector-btn cancel-btn" @click="cancelTempSelection">
            取消
          </button>
          <button class="selector-btn confirm-btn" @click="confirmTempSelection">
            确定
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 定温时长选择弹窗 -->
  <transition name="selector">
    <div v-if="showKeepWarmDurationPicker && device" class="temp-selector-overlay" @click="cancelKeepWarmDurationSelection">
      <div class="temp-presets-selector" @click.stop>
        <div class="selector-title">定温时长</div>
        
        <!-- 时长滚动选择器 -->
        <div class="temp-picker-container">
          <div class="picker-highlight"></div>
          <div class="temp-picker">
            <div 
              v-for="duration in keepWarmDurationOptions" 
              :key="duration"
              class="temp-option"
              :class="{ active: duration === tempKeepWarmDuration }"
              @click="tempKeepWarmDuration = duration"
            >
              {{ duration }}<span class="temp-unit-suffix"> 小时</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="selector-buttons">
          <button class="selector-btn cancel-btn" @click="cancelKeepWarmDurationSelection">
            取消
          </button>
          <button class="selector-btn confirm-btn" @click="confirmKeepWarmDurationSelection">
            确定
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

.kettle-dialog {
  width: 360px;
  max-width: 90vw;
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

/* 电热水壶布局 */
.kettle-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部按钮组 */
.top-buttons {
  display: flex;
  gap: 12px;
}

.kettle-power-btn {
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

.kettle-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.kettle-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.power-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.power-label {
  font-size: 15px;
  font-weight: 600;
}

.timer-btn {
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

.timer-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.timer-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-icon {
  width: 16px;
  height: 16px;
}

.timer-label {
  font-size: 15px;
  font-weight: 600;
}

/* 温度显示 */
.temp-display-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.temp-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.temp-value-large {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.temp-number {
  font-size: 44px;
  font-weight: 200;
  color: white;
  line-height: 1;
  letter-spacing: -2px;
}

.temp-unit {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.heating-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 10px;
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.15) 100%);
  border-radius: 8px;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.heating-icon {
  width: 14px;
  height: 14px;
  color: rgb(251, 146, 60);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.heating-text {
  font-size: 11px;
  font-weight: 600;
  color: rgb(251, 146, 60);
}

.heating-status.keep-warm {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.15) 100%);
  border-color: rgba(251, 146, 60, 0.3);
}

.heating-status.keep-warm .heating-icon {
  color: rgb(251, 146, 60);
}

.heating-status.keep-warm .heating-text {
  color: rgb(251, 146, 60);
}

/* 温度选择器弹窗 */
.temp-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.temp-selector {
  width: 360px;
  max-width: 90vw;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 32px 24px 24px 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.selector-header {
  text-align: center;
  padding-bottom: 16px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2px;
}

.header-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  margin: -12px 0;
}

.temp-value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.temp-number-large {
  font-size: 80px;
  font-weight: 200;
  color: white;
  line-height: 1;
  letter-spacing: -4px;
}

.temp-unit-large {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.temp-select-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.temp-select-row:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.select-label {
  font-size: 16px;
  color: white;
  font-weight: 500;
}

.select-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.keep-warm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.keep-warm-label {
  font-size: 16px;
  color: white;
  font-weight: 500;
}

.keep-warm-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.keep-warm-toggle input {
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

.keep-warm-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.keep-warm-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.start-heating-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
}

.start-heating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 208, 206, 0.4);
}

.start-heating-btn:active {
  transform: translateY(0);
}

/* 温度预设选择弹窗 */
.temp-presets-selector {
  width: 360px;
  max-width: 90vw;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.selector-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-align: center;
}

.temp-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.temp-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  width: 100%;
  padding: 76px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  cursor: grab;
}

.temp-picker:active {
  cursor: grabbing;
}

.temp-picker::-webkit-scrollbar {
  display: none;
}

.temp-option {
  font-size: 32px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  scroll-snap-align: center;
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
  padding: 0 20px;
}

.temp-option.active {
  font-size: 48px;
  font-weight: 400;
  color: rgb(38, 208, 206);
  transform: scale(1.2);
}

.temp-unit-suffix {
  font-size: 0.5em;
  margin-left: 4px;
  opacity: 0.8;
}

.picker-highlight {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 56px;
  pointer-events: none;
  z-index: 1;
}

.selector-buttons {
  display: flex;
  gap: 12px;
}

.selector-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: rgba(100, 116, 139, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.cancel-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 208, 206, 0.4);
}

/* 快捷温度预设（备用） */
.temp-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.preset-btn.active {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
}

.preset-temp {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.preset-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 加热控制 */
.heating-control {
  display: flex;
}

.heat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 600;
}

.heat-btn.start {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.2) 0%,
    rgba(22, 163, 74, 0.15) 100%
  );
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: rgb(34, 197, 94);
}

.heat-btn.start:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.3) 0%,
    rgba(22, 163, 74, 0.25) 100%
  );
  border-color: rgba(34, 197, 94, 0.5);
  transform: translateY(-2px);
}

.heat-btn.stop {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.2) 0%,
    rgba(220, 38, 38, 0.15) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: rgb(239, 68, 68);
}

.heat-btn.stop:hover {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.3) 0%,
    rgba(220, 38, 38, 0.25) 100%
  );
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.heat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.heat-icon {
  width: 24px;
  height: 24px;
}

.heat-text {
  font-size: 16px;
  font-weight: 600;
}

/* 保温选项 */
.keep-warm-option {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.option-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.option-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.option-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.option-toggle input {
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

.option-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.option-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.option-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
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

/* 选择器动画 */
.selector-enter-active,
.selector-leave-active {
  transition: all 0.3s ease;
}

.selector-enter-from,
.selector-leave-to {
  opacity: 0;
}

.selector-enter-from .temp-selector,
.selector-leave-to .temp-selector {
  transform: scale(0.9);
  opacity: 0;
}

.selector-enter-from .temp-presets-selector,
.selector-leave-to .temp-presets-selector {
  transform: scale(0.9);
  opacity: 0;
}
</style>
