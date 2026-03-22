<!--
  电饭煲长按弹窗
  功能：显示电饭煲控制界面，包括模式选择
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
  (e: 'start-cooking', durationMinutes: number, modeName: string, modeId: number): void
  (e: 'cancel-cooking'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

// 烹饪模式选择弹窗
const showModeSelector = ref(false)
const showCookingSettings = ref(false)
const showKeepWarmSettings = ref(false)

// 监听来自底部弹窗的事件
onMounted(() => {
  window.addEventListener('open-rice-cooker-mode-selector', handleOpenModeSelector as EventListener)
  window.addEventListener('open-rice-cooker-keep-warm-settings', handleOpenKeepWarmSettings as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('open-rice-cooker-mode-selector', handleOpenModeSelector as EventListener)
  window.removeEventListener('open-rice-cooker-keep-warm-settings', handleOpenKeepWarmSettings as EventListener)
})

const handleOpenModeSelector = (event: CustomEvent) => {
  const { mainModeId } = event.detail
  selectedMainMode.value = mainModeId
  selectedMode.value = mainModeId
  // 立即打开模式选择器
  showModeSelector.value = true
}

const handleOpenKeepWarmSettings = () => {
  // 立即打开保温设置
  showKeepWarmSettings.value = true
}

// 主要模式（显示在长按弹窗中）
const mainModes = [
  { id: 0, name: '标准饭', color: 'orange' },
  { id: 1, name: '快煮饭', color: 'blue' },
  { id: 2, name: '煮粥', color: 'green' },
  { id: 3, name: '保温', color: 'orange' }
]

// 详细烹饪模式列表（根据主要模式显示不同选项）
const riceModesMap: Record<number, Array<{ id: number; name: string; icon: string }>> = {
  0: [ // 标准饭
    { id: 0, name: '标准饭', icon: 'standard' },
    { id: 1, name: '香糯饭', icon: 'fragrant' },
    { id: 2, name: '杂粮饭', icon: 'grain' },
    { id: 3, name: '糙米饭', icon: 'brown' },
    { id: 4, name: '煮粥饭', icon: 'porridge' }
  ],
  1: [ // 快煮饭
    { id: 10, name: '快煮白米', icon: 'fast' },
    { id: 11, name: '快煮糙米', icon: 'fast-brown' },
    { id: 12, name: '快煮杂粮', icon: 'fast-grain' }
  ],
  2: [ // 煮粥
    { id: 20, name: '白粥', icon: 'white-porridge' },
    { id: 21, name: '小米粥', icon: 'millet-porridge' },
    { id: 22, name: '八宝粥', icon: 'eight-treasure' },
    { id: 23, name: '皮蛋瘦肉粥', icon: 'preserved-egg' },
    { id: 24, name: '南瓜粥', icon: 'pumpkin-porridge' }
  ],
  3: [ // 保温
    { id: 30, name: '2小时', icon: 'keep-warm' },
    { id: 31, name: '4小时', icon: 'keep-warm' },
    { id: 32, name: '6小时', icon: 'keep-warm' },
    { id: 33, name: '8小时', icon: 'keep-warm' },
    { id: 34, name: '12小时', icon: 'keep-warm' }
  ]
}

const cookingModes = computed(() => {
  return riceModesMap[selectedMainMode.value] || riceModesMap[0]
})

// 根据详细模式ID获取对应的主模式ID
const getMainModeIdByDetailMode = (detailModeId: number): number => {
  if (detailModeId >= 0 && detailModeId <= 4) return 0 // 标准饭
  if (detailModeId >= 10 && detailModeId <= 12) return 1 // 快煮饭
  if (detailModeId >= 20 && detailModeId <= 24) return 2 // 煮粥
  if (detailModeId >= 30 && detailModeId <= 34) return 3 // 保温
  return 0 // 默认标准饭
}

// 判断主模式是否被选中
const isMainModeActive = (mainModeId: number): boolean => {
  return getMainModeIdByDetailMode(selectedMode.value) === mainModeId
}

const selectedMainMode = ref(0) // 默认标准饭
const selectedMode = ref(0) // 默认标准饭
const selectedModeForSettings = ref<number | null>(null)

// 当设备变化时，从设备状态恢复选中的模式
const initializeSelectedMode = () => {
  console.log('initializeSelectedMode called, device:', props.device?.name, 'currentMode:', (props.device as any)?.riceCookerCurrentMode)
  if ((props.device as any)?.riceCookerCurrentMode !== undefined) {
    selectedMode.value = (props.device as any).riceCookerCurrentMode
    selectedMainMode.value = getMainModeIdByDetailMode((props.device as any).riceCookerCurrentMode)
    console.log('Restored mode:', selectedMode.value, 'mainMode:', selectedMainMode.value)
  }
  // 恢复其他持久化状态
  const d = props.device as any
  if (d?.riceCookerCookingHours !== undefined) cookingHours.value = d.riceCookerCookingHours
  if (d?.riceCookerCookingMinutes !== undefined) cookingMinutes.value = d.riceCookerCookingMinutes
  if (d?.riceCookerAutoKeepWarm !== undefined) autoKeepWarm.value = d.riceCookerAutoKeepWarm
  if (d?.riceCookerKeepWarmHours !== undefined) keepWarmHours.value = d.riceCookerKeepWarmHours
  if (d?.riceCookerKeepWarmMinutes !== undefined) keepWarmMinutes.value = d.riceCookerKeepWarmMinutes
}

// 监听设备变化
watch(() => props.device, () => {
  if (props.visible) {
    initializeSelectedMode()
  }
}, { immediate: true })

watch(() => props.visible, (newVal) => {
  if (newVal) {
    initializeSelectedMode()
    showModeSelector.value = false
    showCookingSettings.value = false
    showKeepWarmSettings.value = false
  }
})

// 监听设备状态变化，离线时重置本地选中状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    showModeSelector.value = false
    showCookingSettings.value = false
    showKeepWarmSettings.value = false
    selectedMode.value = 0
    selectedMainMode.value = 0
    selectedModeForSettings.value = null
  }
})
const cookingHours = ref(0) // 烹饪小时
const cookingMinutes = ref(30) // 烹饪分钟
const autoKeepWarm = ref(true) // 自动保温
const keepWarmHours = ref(2) // 保温小时
const keepWarmMinutes = ref(0) // 保温分钟

// 预约功能 & 保温设置 toggle（持久化）
const reservationEnabled = computed({
  get: () => (props.device as any)?.riceCookerReservationEnabled ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { riceCookerReservationEnabled: v }) }
})
const keepWarmEnabled = computed({
  get: () => (props.device as any)?.riceCookerKeepWarmEnabled ?? true,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { riceCookerKeepWarmEnabled: v }) }
})

const selectMainMode = (modeId: number) => {
  if (props.device?.status === 'offline') return
  selectedMainMode.value = modeId
  
  // 如果当前选中的详细模式不属于这个主模式，则重置为主模式的第一个选项
  const currentMainMode = getMainModeIdByDetailMode(selectedMode.value)
  if (currentMainMode !== modeId) {
    selectedMode.value = modeId
  }
  // 否则保持当前选中的详细模式
  
  // 如果是保温模式，打开保温时长设置弹窗
  if (modeId === 3) {
    showKeepWarmSettings.value = true
    return
  }
  
  // 其他模式打开详细模式选择
  showModeSelector.value = true
}

const selectMode = (modeId: number) => {
  selectedMode.value = modeId
  selectedModeForSettings.value = modeId
  showModeSelector.value = false
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { riceCookerCurrentMode: modeId })
  
  if (modeId >= 30 && modeId <= 34) {
    emit('update:visible', false)
    return
  }
  
  showCookingSettings.value = true
}

const getModeName = (modeId: number) => {
  for (const modes of Object.values(riceModesMap)) {
    const mode = modes.find(m => m.id === modeId)
    if (mode) return mode.name
  }
  return '标准饭'
}

const handleStartCooking = () => {
  const totalCookingMinutes = cookingHours.value * 60 + cookingMinutes.value
  const modeName = getModeName(selectedModeForSettings.value!)
  const modeId = selectedModeForSettings.value!
  console.log('开始烹饪:', modeName, 
    '烹饪时长:', cookingHours.value, '小时', cookingMinutes.value, '分钟', 
    '自动保温:', autoKeepWarm.value)
  if (props.device) devicesStore.setDeviceExtra(props.device.id, {
    riceCookerCookingHours: cookingHours.value,
    riceCookerCookingMinutes: cookingMinutes.value,
    riceCookerAutoKeepWarm: autoKeepWarm.value
  })
  emit('start-cooking', totalCookingMinutes, modeName, modeId)
  showCookingSettings.value = false
  emit('update:visible', false)
}
const isKeepWarmMode = computed(() => {
  return selectedModeForSettings.value !== null && 
         selectedModeForSettings.value >= 30 && 
         selectedModeForSettings.value <= 34
})

const handleSetTimer = () => {
  console.log('设置定时:', getModeName(selectedModeForSettings.value!))
  showCookingSettings.value = false
  emit('open-timer')
}

const adjustHours = (delta: number) => {
  const newHours = Math.max(0, Math.min(24, cookingHours.value + delta))
  cookingHours.value = newHours
  // 如果小时是24，分钟必须是0
  if (newHours === 24) {
    cookingMinutes.value = 0
  }
}

const adjustMinutes = (delta: number) => {
  // 如果小时是24，分钟不能调整
  if (cookingHours.value === 24) {
    cookingMinutes.value = 0
    return
  }
  
  let newMinutes = cookingMinutes.value + delta
  if (newMinutes >= 60) {
    newMinutes = 0
  } else if (newMinutes < 0) {
    newMinutes = 55
  }
  cookingMinutes.value = newMinutes
}

// 滚轮调整
const handleHoursWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  adjustHours(delta)
}

const handleMinutesWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -5 : 5
  adjustMinutes(delta)
}

// 滑动调整
const hoursDragStart = ref<{ y: number; value: number } | null>(null)
const minutesDragStart = ref<{ y: number; value: number } | null>(null)

const handleHoursDragStart = (event: MouseEvent | TouchEvent) => {
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  hoursDragStart.value = { y: clientY, value: cookingHours.value }
}

const handleHoursDrag = (event: MouseEvent | TouchEvent) => {
  if (!hoursDragStart.value) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = hoursDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 20)
  const newValue = Math.max(0, Math.min(24, hoursDragStart.value.value + steps))
  cookingHours.value = newValue
  if (newValue === 24) {
    cookingMinutes.value = 0
  }
}

const handleHoursDragEnd = () => {
  hoursDragStart.value = null
}

const handleMinutesDragStart = (event: MouseEvent | TouchEvent) => {
  if (cookingHours.value === 24) return
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  minutesDragStart.value = { y: clientY, value: cookingMinutes.value }
}

const handleMinutesDrag = (event: MouseEvent | TouchEvent) => {
  if (!minutesDragStart.value || cookingHours.value === 24) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = minutesDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 10)
  let newValue = minutesDragStart.value.value + steps * 5
  if (newValue >= 60) newValue = 55
  if (newValue < 0) newValue = 0
  cookingMinutes.value = newValue
}

const handleMinutesDragEnd = () => {
  minutesDragStart.value = null
}

// 保温时长调整
const handleKeepWarmHoursWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  keepWarmHours.value = Math.max(0, Math.min(24, keepWarmHours.value + delta))
  if (keepWarmHours.value === 24) {
    keepWarmMinutes.value = 0
  }
}

const handleKeepWarmMinutesWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (keepWarmHours.value === 24) return
  const delta = event.deltaY > 0 ? -5 : 5
  let newMinutes = keepWarmMinutes.value + delta
  if (newMinutes >= 60) newMinutes = 55
  if (newMinutes < 0) newMinutes = 0
  keepWarmMinutes.value = newMinutes
}

const keepWarmHoursDragStart = ref<{ y: number; value: number } | null>(null)
const keepWarmMinutesDragStart = ref<{ y: number; value: number } | null>(null)

const handleKeepWarmHoursDragStart = (event: MouseEvent | TouchEvent) => {
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  keepWarmHoursDragStart.value = { y: clientY, value: keepWarmHours.value }
}

const handleKeepWarmHoursDrag = (event: MouseEvent | TouchEvent) => {
  if (!keepWarmHoursDragStart.value) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = keepWarmHoursDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 20)
  const newValue = Math.max(0, Math.min(24, keepWarmHoursDragStart.value.value + steps))
  keepWarmHours.value = newValue
  if (newValue === 24) {
    keepWarmMinutes.value = 0
  }
}

const handleKeepWarmHoursDragEnd = () => {
  keepWarmHoursDragStart.value = null
}

const handleKeepWarmMinutesDragStart = (event: MouseEvent | TouchEvent) => {
  if (keepWarmHours.value === 24) return
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  keepWarmMinutesDragStart.value = { y: clientY, value: keepWarmMinutes.value }
}

const handleKeepWarmMinutesDrag = (event: MouseEvent | TouchEvent) => {
  if (!keepWarmMinutesDragStart.value || keepWarmHours.value === 24) return
  event.preventDefault()
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  const deltaY = keepWarmMinutesDragStart.value.y - clientY
  const steps = Math.floor(deltaY / 10)
  let newValue = keepWarmMinutesDragStart.value.value + steps * 5
  if (newValue >= 60) newValue = 55
  if (newValue < 0) newValue = 0
  keepWarmMinutes.value = newValue
}

const handleKeepWarmMinutesDragEnd = () => {
  keepWarmMinutesDragStart.value = null
}

const handleStartKeepWarm = () => {
  const totalKeepWarmMinutes = keepWarmHours.value * 60 + keepWarmMinutes.value
  const keepWarmDuration = `${keepWarmHours.value}小时${keepWarmMinutes.value > 0 ? keepWarmMinutes.value + '分钟' : ''}`
  const modeId = 30 + Math.floor(totalKeepWarmMinutes / 120)
  if (props.device) devicesStore.setDeviceExtra(props.device.id, {
    riceCookerCurrentMode: modeId,
    riceCookerKeepWarmHours: keepWarmHours.value,
    riceCookerKeepWarmMinutes: keepWarmMinutes.value,
  })
  emit('start-cooking', totalKeepWarmMinutes, `保温${keepWarmDuration}`, modeId)
  showKeepWarmSettings.value = false
  emit('update:visible', false)
}

const handleCancelCooking = () => {
  emit('cancel-cooking')
}

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <!-- 只在没有子弹窗打开时显示主弹窗内容 -->
      <div v-if="!showModeSelector && !showCookingSettings && !showKeepWarmSettings" class="dialog-content rice-cooker-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">电饭煲</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <div class="rice-cooker-layout">
          <!-- 顶部按钮组 -->
          <div class="top-buttons">
            <!-- 电源按钮 -->
            <div 
              class="rice-cooker-power-btn"
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

          <!-- 模式选择 -->
          <div class="main-modes-grid">
            <div 
              v-for="mode in mainModes" 
              :key="mode.id"
              class="main-mode-btn"
              :class="{ 
                active: isMainModeActive(mode.id),
                disabled: device.status === 'offline',
                [mode.color]: true
              }"
              @click="selectMainMode(mode.id)"
            >
              <div class="main-mode-icon-wrapper" :class="mode.color">
                <span class="main-mode-text-inside">{{ mode.name }}</span>
              </div>
            </div>
          </div>

          <!-- 控制选项 -->
          <div class="control-options">
            <div 
              class="option-item"
              :class="{ disabled: device.status === 'offline' }"
            >
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">预约功能</span>
              <label class="option-toggle">
                <input 
                  type="checkbox"
                  v-model="reservationEnabled"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div 
              class="option-item"
              :class="{ disabled: device.status === 'offline' }"
            >
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">保温设置</span>
              <label class="option-toggle">
                <input 
                  type="checkbox"
                  v-model="keepWarmEnabled"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 取消烹饪按钮（只在烹饪中显示） -->
          <div v-if="(device as any).riceCookerCooking" class="cancel-cooking-section">
            <button class="cancel-cooking-button" @click="handleCancelCooking">
              <svg class="cancel-icon" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="cancel-label">{{ (device as any).riceCookerCurrentMode !== undefined && (device as any).riceCookerCurrentMode >= 30 && (device as any).riceCookerCurrentMode <= 34 ? '取消保温' : '取消烹饪' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 模式选择弹窗 -->
      <transition name="mode-selector">
        <div v-if="showModeSelector" class="mode-selector-overlay" @click="showModeSelector = false">
          <div class="mode-selector-content" @click.stop>
            <div class="mode-selector-header">
              <span class="mode-selector-title">选择烹饪模式</span>
              <button class="close-btn" @click="showModeSelector = false">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="mode-list">
              <div 
                v-for="mode in cookingModes" 
                :key="mode.id"
                class="mode-item"
                :class="{ selected: selectedMode === mode.id }"
                @click="selectMode(mode.id)"
              >
                <span class="mode-name">{{ mode.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
      <!-- 烹饪设置弹窗 -->
      <transition name="mode-selector">
        <div v-if="showCookingSettings && selectedModeForSettings !== null" class="mode-selector-overlay" @click="showCookingSettings = false">
          <div class="cooking-settings-content" @click.stop>
            <div class="mode-selector-header">
              <span class="mode-selector-title">{{ getModeName(selectedModeForSettings!) }}</span>
              <button class="close-btn" @click="showCookingSettings = false">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- 烹饪时长 -->
            <div class="duration-setting">
              <span class="setting-label">烹饪时长</span>
              <div class="duration-controls">
                <!-- 小时控制 -->
                <div 
                  class="time-control"
                  @wheel="handleHoursWheel"
                  @mousedown="handleHoursDragStart"
                  @mousemove="handleHoursDrag"
                  @mouseup="handleHoursDragEnd"
                  @mouseleave="handleHoursDragEnd"
                  @touchstart="handleHoursDragStart"
                  @touchmove="handleHoursDrag"
                  @touchend="handleHoursDragEnd"
                >
                  <div class="time-display">
                    <span class="time-value">{{ cookingHours }}</span>
                    <span class="time-unit">小时</span>
                  </div>
                </div>

                <!-- 分钟控制 -->
                <div 
                  class="time-control"
                  :class="{ disabled: cookingHours === 24 }"
                  @wheel="handleMinutesWheel"
                  @mousedown="handleMinutesDragStart"
                  @mousemove="handleMinutesDrag"
                  @mouseup="handleMinutesDragEnd"
                  @mouseleave="handleMinutesDragEnd"
                  @touchstart="handleMinutesDragStart"
                  @touchmove="handleMinutesDrag"
                  @touchend="handleMinutesDragEnd"
                >
                  <div class="time-display">
                    <span class="time-value">{{ cookingMinutes }}</span>
                    <span class="time-unit">分钟</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 自动保温（保温模式下隐藏） -->
            <div v-if="!isKeepWarmMode" class="keep-warm-setting">
              <span class="setting-label">自动保温</span>
              <label class="keep-warm-toggle">
                <input type="checkbox" v-model="autoKeepWarm" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="action-btn start-btn-full" @click="handleStartCooking">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                </svg>
                <span class="action-text">开始</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- 保温时长设置弹窗 -->
      <transition name="mode-selector">
        <div v-if="showKeepWarmSettings" class="mode-selector-overlay" @click="showKeepWarmSettings = false">
          <div class="cooking-settings-content" @click.stop>
            <div class="mode-selector-header">
              <span class="mode-selector-title">保温时长</span>
              <button class="close-btn" @click="showKeepWarmSettings = false">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- 保温时长 -->
            <div class="duration-setting">
              <div class="duration-controls">
                <!-- 小时控制 -->
                <div 
                  class="time-control"
                  @wheel="handleKeepWarmHoursWheel"
                  @mousedown="handleKeepWarmHoursDragStart"
                  @mousemove="handleKeepWarmHoursDrag"
                  @mouseup="handleKeepWarmHoursDragEnd"
                  @mouseleave="handleKeepWarmHoursDragEnd"
                  @touchstart="handleKeepWarmHoursDragStart"
                  @touchmove="handleKeepWarmHoursDrag"
                  @touchend="handleKeepWarmHoursDragEnd"
                >
                  <div class="time-display">
                    <span class="time-value">{{ keepWarmHours }}</span>
                    <span class="time-unit">小时</span>
                  </div>
                </div>

                <!-- 分钟控制 -->
                <div 
                  class="time-control"
                  :class="{ disabled: keepWarmHours === 24 }"
                  @wheel="handleKeepWarmMinutesWheel"
                  @mousedown="handleKeepWarmMinutesDragStart"
                  @mousemove="handleKeepWarmMinutesDrag"
                  @mouseup="handleKeepWarmMinutesDragEnd"
                  @mouseleave="handleKeepWarmMinutesDragEnd"
                  @touchstart="handleKeepWarmMinutesDragStart"
                  @touchmove="handleKeepWarmMinutesDrag"
                  @touchend="handleKeepWarmMinutesDragEnd"
                >
                  <div class="time-display">
                    <span class="time-value">{{ keepWarmMinutes }}</span>
                    <span class="time-unit">分钟</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="action-btn start-btn-full" @click="handleStartKeepWarm">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                </svg>
                <span class="action-text">开始</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
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

.rice-cooker-dialog {
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

/* 电饭煲布局 */
.rice-cooker-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部按钮组 */
.top-buttons {
  display: flex;
  gap: 12px;
}

/* 电源按钮 */
.rice-cooker-power-btn {
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

.rice-cooker-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.rice-cooker-power-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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

/* 定时按钮 */
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

/* 主要模式网格 */
.main-modes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.main-mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.main-mode-btn:hover:not(.disabled) {
  transform: scale(1.05);
}

.main-mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.main-mode-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.main-mode-icon-wrapper.orange {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(249, 115, 22, 0.25) 100%);
  border: 2px solid rgba(251, 146, 60, 0.4);
}

.main-mode-icon-wrapper.blue {
  background: var(--dialog-btn-active-light-bg-1);
  border: 2px solid var(--dialog-btn-active-light-border);
}

.main-mode-icon-wrapper.green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.25) 100%);
  border: 2px solid rgba(34, 197, 94, 0.4);
}

.main-mode-btn.active .main-mode-icon-wrapper.orange {
  background: linear-gradient(135deg, rgb(251, 146, 60) 0%, rgb(249, 115, 22) 100%);
  border-color: rgb(251, 146, 60);
}

.main-mode-btn.active .main-mode-icon-wrapper.blue {
  background: var(--dialog-btn-active-bg-1);
  border: none;
}

.main-mode-btn.active .main-mode-icon-wrapper.green {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%);
  border-color: rgb(34, 197, 94);
}

.main-mode-text-inside {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 模式选择器 */
.mode-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-selector:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.mode-selector.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.mode-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.mode-value {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
}

/* 控制选项 */
.control-options {
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

.option-item:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.option-item.disabled {
  opacity: 0.5;
  pointer-events: none;
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

/* 取消烹饪按钮 */
.cancel-cooking-section {
  margin-top: 8px;
}

.cancel-cooking-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.25) 100%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.cancel-cooking-button:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.35) 100%);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.cancel-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.cancel-label {
  font-size: 15px;
  font-weight: 600;
}

/* 模式选择弹窗 */
.mode-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.mode-selector-content {
  width: 100%;
  max-width: 360px;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.cooking-settings-content {
  width: 100%;
  max-width: 340px;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.mode-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mode-selector-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 14px;
  height: 14px;
  color: white;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 0;
}

.mode-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.mode-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--dialog-btn-active-light-bg-1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-item:hover::before {
  opacity: 1;
}

.mode-item:hover {
  border-color: var(--dialog-btn-active-light-border);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.mode-item.selected {
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
  box-shadow: 
    0 0 0 1px var(--dialog-btn-active-border),
    0 4px 20px var(--dialog-btn-active-shadow);
}

.mode-item.selected::before {
  opacity: 0;
}

.mode-name {
  font-size: 17px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.mode-item:hover .mode-name {
  color: rgba(255, 255, 255, 0.95);
}

.mode-item.selected .mode-name {
  color: var(--dialog-text);
  text-shadow: 0 0 8px var(--dialog-btn-active-shadow);
}

/* 烹饪设置 */
.duration-setting {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 14px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
}

.setting-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5px;
  text-align: center;
}

.duration-controls {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.time-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 10px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: ns-resize;
  user-select: none;
  transition: all 0.3s ease;
}

.time-control:hover {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
  box-shadow: 0 0 16px var(--dialog-btn-active-light-shadow);
}

.time-control.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.time-control.disabled:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.time-value {
  font-size: 36px;
  font-weight: 300;
  color: white;
  line-height: 1;
  min-width: 60px;
  text-align: center;
  text-shadow: 0 2px 12px var(--dialog-btn-active-shadow);
  letter-spacing: -1px;
}

.time-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.keep-warm-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;
}

.keep-warm-toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.keep-warm-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.keep-warm-toggle .toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  transition: all 0.3s ease;
  border-radius: 28px;
}

.keep-warm-toggle .toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
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
  transform: translateX(22px);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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

.action-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.action-btn.timer-btn:hover {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
}

.action-btn.start-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.2) 0%,
    rgba(22, 163, 74, 0.15) 100%
  );
  border-color: rgba(34, 197, 94, 0.4);
}

.action-btn-full {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.2) 0%,
    rgba(22, 163, 74, 0.15) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn-full:hover {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.3) 0%,
    rgba(22, 163, 74, 0.25) 100%
  );
  border-color: rgba(34, 197, 94, 0.5);
  transform: translateY(-2px);
}

.action-btn-full .action-icon {
  width: 16px;
  height: 16px;
}

.action-btn-full .action-text {
  font-size: 13px;
  font-weight: 600;
}

.action-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  color: white;
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

.mode-selector-enter-active,
.mode-selector-leave-active {
  transition: all 0.3s ease;
}

.mode-selector-enter-from,
.mode-selector-leave-to {
  opacity: 0;
}

.mode-selector-enter-from .mode-selector-content,
.mode-selector-leave-to .mode-selector-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
