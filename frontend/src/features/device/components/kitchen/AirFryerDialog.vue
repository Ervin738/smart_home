<!--
  空气炸锅长按弹窗
  功能：显示空气炸锅控制界面，包括烹饪模式选择（可左右滑动）
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// 烹饪模式数据（两页，各自独立，含默认温度和时间）
const cookingModesPage1 = [
  { id: 6, name: '手动模式', icon: '👆', color: 'linear-gradient(135deg, #4dd0e1 0%, #26c6da 100%)', defaultTemp: 190, defaultTime: 20 },
  { id: 7, name: '冷冻薯条', icon: '🔥', color: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', defaultTemp: 200, defaultTime: 18 },
  { id: 8, name: '鸡翅', icon: '🍗', color: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)', defaultTemp: 200, defaultTime: 25 },
  { id: 9, name: '甜甜圈', icon: '🍩', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', defaultTemp: 175, defaultTime: 12 },
  { id: 10, name: '蛋挞', icon: '🥧', color: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)', defaultTemp: 180, defaultTime: 20 },
  { id: 11, name: '牛排', icon: '🥩', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', defaultTemp: 220, defaultTime: 15 }
]

const cookingModesPage2 = [
  { id: 0, name: '五花肉', icon: '🥓', color: 'linear-gradient(135deg, #ee7752 0%, #e73c7e 100%)', defaultTemp: 200, defaultTime: 30 },
  { id: 1, name: '虾', icon: '🦐', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', defaultTemp: 180, defaultTime: 10 },
  { id: 2, name: '蛋挞', icon: '🧁', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', defaultTemp: 180, defaultTime: 20 },
  { id: 3, name: '披萨', icon: '🍕', color: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)', defaultTemp: 200, defaultTime: 15 },
  { id: 4, name: '烤果干', icon: '🥭', color: 'linear-gradient(135deg, #4dd0e1 0%, #26c6da 100%)', defaultTemp: 70, defaultTime: 60 },
  { id: 5, name: '解冻', icon: '💧', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', defaultTemp: 80, defaultTime: 15 }
]

const currentPage = ref(0)
// 两页各自独立的选中模式，-1 表示未选中
const selectedModePage1 = ref(-1)
const selectedModePage2 = ref(-1)
const showModeSettings = ref(false) // 显示模式设置页面
const settingsModeId = ref(0) // 当前设置的模式ID
const settingsModeName = ref('') // 当前设置的模式名称
const isCooking = ref(false) // 是否正在烹饪
const showTempPicker = ref(false) // 显示温度选择器
const showTimePicker = ref(false) // 显示时间选择器

// 监听设备烹饪状态变化，同步到本地isCooking
watch(() => (props.device as any)?.airFryerCooking, (newValue) => {
  isCooking.value = newValue || false
}, { immediate: true })

// 弹窗打开时从设备状态恢复
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    cookingTemp.value = d.airFryerCookingTemp ?? 190
    cookingTime.value = d.airFryerCookingTime ?? 20
    autoKeepWarm.value = d.airFryerAutoKeepWarm ?? true
  }
}, { immediate: true })

// 监听设备状态变化，如果离线则关闭设置页面并重置烹饪状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    showModeSettings.value = false
    isCooking.value = false
    selectedModePage1.value = -1
    selectedModePage2.value = -1
    currentPage.value = 0
  }
})

// 烹饪设置
const cookingTemp = ref(190) // 烹饪温度
const cookingTime = ref(20) // 烹饪时间（分钟）
const autoKeepWarm = ref(true) // 自动保温

// 当前显示的模式列表
const currentModes = computed(() => {
  return currentPage.value === 0 ? cookingModesPage1 : cookingModesPage2
})

// 切换页面
const nextPage = () => {
  currentPage.value = 1
}

const prevPage = () => {
  currentPage.value = 0
}

// 选择模式 — 点击直接进入该模式的设置页
const selectMode = (modeId: number) => {
  if (props.device?.status === 'offline') return

  const allModes = [...cookingModesPage1, ...cookingModesPage2]
  const mode = allModes.find(m => m.id === modeId)
  if (!mode) return

  // 各页独立记录选中
  if (currentPage.value === 0) {
    selectedModePage1.value = modeId
  } else {
    selectedModePage2.value = modeId
  }

  // 用该模式的默认温度/时间填充设置页
  cookingTemp.value = mode.defaultTemp
  cookingTime.value = mode.defaultTime
  if (props.device) devicesStore.setDeviceExtra(props.device.id, {
    airFryerSelectedMode: modeId,
    airFryerCookingTemp: mode.defaultTemp,
    airFryerCookingTime: mode.defaultTime,
  })

  settingsModeId.value = modeId
  settingsModeName.value = mode.name
  showModeSettings.value = true
}

// 关闭设置页面（不重置选中，保留上次选中）
const closeModeSettings = () => {
  showModeSettings.value = false
}

// 开始烹饪
const startCooking = () => {
  if (!props.device) return
  
  console.log('开始烹饪:', {
    mode: settingsModeName.value,
    temp: cookingTemp.value,
    time: cookingTime.value,
    autoKeepWarm: autoKeepWarm.value
  })
  
  // 设置烹饪状态
  devicesStore.setAirFryerCooking(
    props.device.id,
    true,
    cookingTime.value,
    settingsModeId.value,
    settingsModeName.value
  )
  
  isCooking.value = true
  // 不关闭弹窗
}

// 停止烹饪
const stopCooking = () => {
  if (!props.device) return
  
  console.log('停止烹饪')
  
  // 停止烹饪状态
  devicesStore.setAirFryerCooking(props.device.id, false)
  
  isCooking.value = false
}

// 打开温度选择器
const openTempPicker = () => {
  if (!isCooking.value) {
    showTempPicker.value = true
  }
}

// 打开时间选择器
const openTimePicker = () => {
  if (!isCooking.value) {
    showTimePicker.value = true
  }
}

// 调整温度
const adjustTemp = (delta: number) => {
  cookingTemp.value = Math.max(100, Math.min(230, cookingTemp.value + delta))
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { airFryerCookingTemp: cookingTemp.value })
}

// 调整时间
const adjustTime = (delta: number) => {
  cookingTime.value = Math.max(1, Math.min(60, cookingTime.value + delta))
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { airFryerCookingTime: cookingTime.value })
}

// 温度滚轮调整
const handleTempWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -5 : 5
  adjustTemp(delta)
}

// 时间滚轮调整
const handleTimeWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  adjustTime(delta)
}

// 温度拖动
const tempDragStart = ref<{ y: number; value: number } | null>(null)

const handleTempDragStart = (event: MouseEvent | TouchEvent) => {
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  tempDragStart.value = { y: clientY, value: cookingTemp.value }
}

const handleTempDrag = (event: MouseEvent | TouchEvent) => {
  if (!tempDragStart.value) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = tempDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 10)
  const newValue = Math.max(100, Math.min(230, tempDragStart.value.value + steps * 5))
  cookingTemp.value = newValue
}

const handleTempDragEnd = () => {
  tempDragStart.value = null
}

// 时间拖动
const timeDragStart = ref<{ y: number; value: number } | null>(null)

const handleTimeDragStart = (event: MouseEvent | TouchEvent) => {
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  timeDragStart.value = { y: clientY, value: cookingTime.value }
}

const handleTimeDrag = (event: MouseEvent | TouchEvent) => {
  if (!timeDragStart.value) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = timeDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 20)
  const newValue = Math.max(1, Math.min(60, timeDragStart.value.value + steps))
  cookingTime.value = newValue
}

const handleTimeDragEnd = () => {
  timeDragStart.value = null
}

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 触摸滑动相关
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0]?.clientX ?? 0
  isDragging.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  touchEndX.value = e.touches[0]?.clientX ?? 0
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) { // 滑动距离超过50px才触发
    if (diff > 0 && currentPage.value === 0) {
      nextPage()
    } else if (diff < 0 && currentPage.value === 1) {
      prevPage()
    }
  }
  isDragging.value = false
}

// 鼠标拖动相关
const mouseStartX = ref(0)
const mouseEndX = ref(0)
const isMouseDragging = ref(false)

const handleMouseDown = (e: MouseEvent) => {
  mouseStartX.value = e.clientX
  isMouseDragging.value = true
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isMouseDragging.value) return
  mouseEndX.value = e.clientX
}

const handleMouseUp = () => {
  if (!isMouseDragging.value) return
  const diff = mouseStartX.value - mouseEndX.value
  if (Math.abs(diff) > 50) { // 滑动距离超过50px才触发
    if (diff > 0 && currentPage.value === 0) {
      nextPage()
    } else if (diff < 0 && currentPage.value === 1) {
      prevPage()
    }
  }
  isMouseDragging.value = false
}

const handleMouseLeave = () => {
  isMouseDragging.value = false
}
</script>

<template>
  <teleport to="body">
    <!-- 主弹窗 -->
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @click="close">
        <div class="dialog-box" @click.stop>
          <!-- 头部 -->
          <div class="dialog-header">
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-status" :class="device.status">
                {{ device.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- 电源按钮 -->
          <div class="power-section">
            <button 
              class="power-btn" 
              :class="{ active: device.status === 'online' }"
              @click="togglePower"
            >
              <span class="power-icon">⏻</span>
              <span class="power-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </button>
          </div>

          <!-- 烹饪模式选择区域 -->
          <div class="modes-section">
            <div class="section-title">烹饪模式</div>
            
            <!-- 页面指示器 -->
            <div class="page-indicators">
              <div 
                class="indicator" 
                :class="{ active: currentPage === 0 }"
              ></div>
              <div 
                class="indicator" 
                :class="{ active: currentPage === 1 }"
              ></div>
            </div>

            <!-- 模式网格（支持触摸滑动和鼠标拖动） -->
            <div 
              class="modes-container"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseLeave"
            >
              <transition name="slide-fade" mode="out-in">
                <div :key="currentPage" class="modes-grid">
                  <div
                    v-for="mode in currentModes"
                    :key="mode.id"
                    class="mode-item"
                    :class="{ 
                      selected: currentPage === 0 ? selectedModePage1 === mode.id : selectedModePage2 === mode.id,
                      disabled: device.status === 'offline'
                    }"
                    @click="selectMode(mode.id)"
                  >
                    <div class="mode-icon" :style="{ background: mode.color }">
                      <span class="icon-emoji">{{ mode.icon }}</span>
                    </div>
                    <div class="mode-name">{{ mode.name }}</div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 烹饪设置弹窗（独立弹窗） -->
    <transition name="dialog">
        <div v-if="showModeSettings" class="dialog-overlay settings-overlay" @click="closeModeSettings">
          <div class="dialog-box settings-dialog" @click.stop>
            <div class="settings-content">
              <div class="settings-title">大约需要 {{ cookingTime }} 分钟</div>

              <!-- 自动保温 -->
              <div class="setting-item">
                <div class="setting-label">
                  <div class="label-title">自动保温</div>
                  <div class="label-desc">烹饪完成后将开启自动保温</div>
                </div>
                <div 
                  class="toggle-switch" 
                  :class="{ active: autoKeepWarm }"
                  @click="autoKeepWarm = !autoKeepWarm; props.device && devicesStore.setDeviceExtra(props.device.id, { airFryerAutoKeepWarm: autoKeepWarm })"
                >
                  <div class="toggle-thumb"></div>
                </div>
              </div>

              <!-- 烹饪温度 -->
              <div class="setting-item clickable" @click="openTempPicker">
                <div class="setting-label">
                  <div class="label-title">烹饪温度</div>
                </div>
                <div class="setting-value">
                  <span>{{ cookingTemp }}℃</span>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <!-- 烹饪时间 -->
              <div class="setting-item clickable" @click="openTimePicker">
                <div class="setting-label">
                  <div class="label-title">烹饪时间</div>
                </div>
                <div class="setting-value">
                  <span>{{ cookingTime }}分钟</span>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <!-- 底部按钮 -->
              <div class="settings-actions">
                <button class="action-btn secondary">预约</button>
                <button 
                  v-if="!isCooking"
                  class="action-btn primary" 
                  @click="startCooking"
                >
                  开始
                </button>
                <button 
                  v-else
                  class="action-btn stop" 
                  @click="stopCooking"
                >
                  停止
                </button>
              </div>
            </div>
          </div>
        </div>
    </transition>

    <!-- 温度选择器弹窗 -->
    <transition name="dialog">
      <div v-if="showTempPicker" class="dialog-overlay settings-overlay" @click="showTempPicker = false">
        <div class="dialog-box picker-dialog" @click.stop>
          <div class="picker-header">
            <span class="picker-title">烹饪温度</span>
            <button class="close-btn" @click="showTempPicker = false">✕</button>
          </div>
          <div class="picker-content">
            <button class="adjust-btn" @click="adjustTemp(-10)">-</button>
            <div class="picker-value">
              <span class="value-number">{{ cookingTemp }}</span>
              <span class="value-unit">℃</span>
            </div>
            <button class="adjust-btn" @click="adjustTemp(10)">+</button>
          </div>
          <div class="picker-range">100℃ - 230℃</div>
        </div>
      </div>
    </transition>

    <!-- 时间选择器弹窗 -->
    <transition name="dialog">
      <div v-if="showTimePicker" class="dialog-overlay settings-overlay" @click="showTimePicker = false">
        <div class="dialog-box picker-dialog" @click.stop>
          <div class="picker-header">
            <span class="picker-title">烹饪时间</span>
            <button class="close-btn" @click="showTimePicker = false">✕</button>
          </div>
          <div class="picker-content">
            <button class="adjust-btn" @click="adjustTime(-5)">-</button>
            <div class="picker-value">
              <span class="value-number">{{ cookingTime }}</span>
              <span class="value-unit">分钟</span>
            </div>
            <button class="adjust-btn" @click="adjustTime(5)">+</button>
          </div>
          <div class="picker-range">1 - 60 分钟</div>
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

.settings-overlay {
  background: rgba(0, 0, 0, 0.4);
  z-index: 2001;
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
  padding: 24px;
  width: 340px;
  max-width: 90vw;
  min-height: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.power-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.power-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.power-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.power-icon {
  font-size: 20px;
}

.modes-section {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
  text-align: center;
}

.page-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.indicator.active {
  width: 24px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
}

.modes-container {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
}

.modes-container:active {
  cursor: grabbing;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.mode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-item:hover {
  transform: translateY(-4px);
}

.mode-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.mode-item.selected .mode-icon {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.mode-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.icon-emoji {
  font-size: 28px;
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.settings-dialog {
  width: 340px;
  max-width: 90vw;
  min-height: 480px;
}

/* 设置内容区域 */
.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
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

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.settings-title {
  font-size: 26px;
  font-weight: 600;
  color: white;
  text-align: center;
  margin: 40px 0 48px 0;
  letter-spacing: 0.5px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin: 0 -16px;
}

.setting-item:first-of-type {
  margin-top: 0;
}

.setting-item.clickable {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 12px;
}

.setting-item.clickable:hover {
  background: rgba(255, 255, 255, 0.05);
}

.setting-item.clickable:active {
  background: rgba(255, 255, 255, 0.08);
}

.setting-label {
  flex: 1;
}

.label-title {
  font-size: 17px;
  font-weight: 600;
  color: white;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.label-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.toggle-switch {
  width: 52px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.toggle-switch.active {
  background: rgb(34, 197, 94);
}

.toggle-thumb {
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.toggle-switch.active .toggle-thumb {
  left: 24px;
}

.settings-actions {
  display: flex;
  gap: 16px;
  margin-top: auto;
  padding: 32px 8px 8px 8px;
}

.action-btn {
  flex: 1;
  padding: 18px;
  border-radius: 18px;
  border: none;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.25);
}

.action-btn.secondary:active {
  transform: scale(0.98);
}

.action-btn.primary {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, rgb(22, 163, 74) 0%, rgb(21, 128, 61) 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.action-btn.primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.action-btn.stop {
  background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.action-btn.stop:hover {
  background: linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(185, 28, 28) 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.action-btn.stop:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 选择器弹窗 */
.picker-dialog {
  width: 360px;
  max-width: 90vw;
  min-height: auto;
  padding: 20px 24px 16px 24px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.picker-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.picker-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.adjust-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adjust-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.adjust-btn:active {
  transform: scale(0.95);
}

.picker-value {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.value-number {
  font-size: 56px;
  font-weight: 200;
  color: white;
  line-height: 1;
}

.value-unit {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.picker-range {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}
</style>
