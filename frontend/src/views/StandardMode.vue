<!--
  标准模式页面
  功能：主页面，显示当前房间的所有设备卡片，支持设备控制
  操作：单击卡片显示底部控制栏，长按卡片打开详情对话框，右键删除设备
-->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import GlassCard from '@/shared/components/GlassCard.vue'
import NavBar from '@/shared/components/NavBar.vue'
import BottomPowerBar from '@/features/device/bottom-bars/BottomPowerBar.vue'
import BottomWashBar from '@/features/device/bottom-bars/BottomWashBar.vue'
import BottomRobotBar from '@/features/device/bottom-bars/BottomRobotBar.vue'
import BottomRackBar from '@/features/device/bottom-bars/BottomRackBar.vue'
import TimerNotification from '@/features/device/dialogs/TimerNotification.vue'
import DeviceDialog from '@/features/device/dialogs/DeviceDialog.vue'
import SocketDialog from '@/features/device/dialogs/SocketDialog.vue'
import TimerDialog from '@/features/device/dialogs/TimerDialog.vue'
import CountdownDialog from '@/features/device/dialogs/CountdownDialog.vue'
import PowerDetailDialog from '@/features/device/dialogs/PowerDetailDialog.vue'
import { useDevicesStore, type Device } from '@/features/device/devices.store'
import { useTabsStore } from '@/features/layout/tabs'
import { useNameOverflow } from '@/shared/composables'
import { getDeviceDisplayType, INTERACTION_TIMING } from '@/constants'
import { formatRemaining } from '@/shared/utils'

const devicesStore = useDevicesStore()
const tabsStore = useTabsStore()
const { checkNameOverflow, isNameOverflow } = useNameOverflow()

// 定时剩余时间
const timerOffRemainingMap = ref<Record<string, number>>({})
const timerOnRemainingMap = ref<Record<string, number>>({})
const countdownRemainingMap = ref<Record<string, number>>({})
let timerUpdateInterval: number | null = null

const updateTimerRemaining = () => {
  devicesStore.devices.forEach(device => {
    if (device.timerOffEnabled) {
      timerOffRemainingMap.value[device.id] = devicesStore.getTimerRemaining(device.id, 'off')
    } else {
      delete timerOffRemainingMap.value[device.id]
    }
    if (device.timerOnEnabled) {
      timerOnRemainingMap.value[device.id] = devicesStore.getTimerRemaining(device.id, 'on')
    } else {
      delete timerOnRemainingMap.value[device.id]
    }
    if (device.countdownEnabled) {
      countdownRemainingMap.value[device.id] = devicesStore.getCountdownRemaining(device.id)
    } else {
      delete countdownRemainingMap.value[device.id]
    }
  })
}

const getNextTimer = (device: Device): { type: 'on' | 'off'; remaining: number } | null => {
  const isOnline = device.status === 'online'
  const offRemaining = (device.timerOffEnabled && isOnline) ? (timerOffRemainingMap.value[device.id] || 0) : 0
  const onRemaining = (device.timerOnEnabled && !isOnline) ? (timerOnRemainingMap.value[device.id] || 0) : 0
  
  let countdownRemaining = 0
  if (device.countdownEnabled && device.countdownAction) {
    const countdownMakesSense = (device.countdownAction === 'off' && isOnline) || (device.countdownAction === 'on' && !isOnline)
    if (countdownMakesSense) {
      countdownRemaining = countdownRemainingMap.value[device.id] || 0
    }
  }
  
  let nearest: { type: 'on' | 'off'; remaining: number } | null = null
  
  if (countdownRemaining > 0 && device.countdownAction) {
    nearest = { type: device.countdownAction, remaining: countdownRemaining }
  }
  if (offRemaining > 0 && (!nearest || offRemaining < nearest.remaining)) {
    nearest = { type: 'off', remaining: offRemaining }
  }
  if (onRemaining > 0 && (!nearest || onRemaining < nearest.remaining)) {
    nearest = { type: 'on', remaining: onRemaining }
  }
  
  return nearest
}

onMounted(() => {
  updateTimerRemaining()
  timerUpdateInterval = window.setInterval(updateTimerRemaining, 1000)
})

onUnmounted(() => {
  if (timerUpdateInterval) clearInterval(timerUpdateInterval)
})

// 弹窗状态
const showDeviceDialog = ref(false)
const showSocketDialog = ref(false)
const showTimerDialog = ref(false)
const showCountdownDialog = ref(false)
const showPowerDetailDialog = ref(false)
const selectedDevice = ref<Device | null>(null)
const cardsContainer = ref<HTMLElement | null>(null)

// 底部控制
const selectedLightDevice = ref<Device | null>(null)
const showBottomPowerBtn = ref(false)
const bottomPowerDevice = ref<Device | null>(null)
const showBottomWashBar = ref(false)
const bottomWashDevice = ref<Device | null>(null)
const showBottomRobotBar = ref(false)
const bottomRobotDevice = ref<Device | null>(null)
const showBottomRackBar = ref(false)
const bottomRackDevice = ref<Device | null>(null)

// 通知
const timerNotification = ref<{ show: boolean; message: string }>({ show: false, message: '' })

const emit = defineEmits<{
  (e: 'select-light', device: Device | null): void
}>()

// 拖拽滚动
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

// 长按
const longPressTimer = ref<number | null>(null)

const onMouseDown = (e: MouseEvent) => {
  if (!cardsContainer.value) return
  isDragging.value = true
  startX.value = e.pageX - cardsContainer.value.offsetLeft
  scrollLeft.value = cardsContainer.value.scrollLeft
  cardsContainer.value.style.cursor = 'grabbing'
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !cardsContainer.value) return
  e.preventDefault()
  const x = e.pageX - cardsContainer.value.offsetLeft
  cardsContainer.value.scrollLeft = scrollLeft.value - (x - startX.value) * 1.5
}

const onMouseUp = () => {
  isDragging.value = false
  if (cardsContainer.value) cardsContainer.value.style.cursor = 'grab'
}

const onCardPressStart = (device: Device) => {
  longPressTimer.value = window.setTimeout(() => {
    selectedDevice.value = device
    // 收起底部控制栏
    showBottomPowerBtn.value = false
    bottomPowerDevice.value = null
    showBottomWashBar.value = false
    bottomWashDevice.value = null
    showBottomRobotBar.value = false
    bottomRobotDevice.value = null
    showBottomRackBar.value = false
    bottomRackDevice.value = null
    
    if (device.type === 'switch' && device.switchType === 'socket') {
      showSocketDialog.value = true
    } else {
      showDeviceDialog.value = true
    }
  }, INTERACTION_TIMING.LONG_PRESS_DURATION)
}

const onCardPressEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const onCardClick = (device: Device) => {
  if (showDeviceDialog.value || showSocketDialog.value) return
  
  if (device.type === 'light') {
    if (selectedLightDevice.value?.id === device.id) {
      selectedLightDevice.value = null
      emit('select-light', null)
    } else {
      selectedLightDevice.value = device
      emit('select-light', device)
    }
    showBottomPowerBtn.value = false
    bottomPowerDevice.value = null
    showBottomWashBar.value = false
    bottomWashDevice.value = null
  } else if (device.type === 'switch' || device.type === 'network') {
    // 开关和路由器单击都显示底部电源按钮
    if (bottomPowerDevice.value?.id === device.id) {
      showBottomPowerBtn.value = false
      bottomPowerDevice.value = null
    } else {
      bottomPowerDevice.value = device
      showBottomPowerBtn.value = true
      selectedLightDevice.value = null
      emit('select-light', null)
      showBottomWashBar.value = false
      bottomWashDevice.value = null
    }
  } else if (device.type === 'cleaner' && (device.cleanerType === 'washing-machine' || device.cleanerType === 'dryer')) {
    // 洗衣机/烘干机单击显示底部洗衣控制栏
    if (bottomWashDevice.value?.id === device.id) {
      showBottomWashBar.value = false
      bottomWashDevice.value = null
    } else {
      bottomWashDevice.value = device
      showBottomWashBar.value = true
      selectedLightDevice.value = null
      emit('select-light', null)
      showBottomPowerBtn.value = false
      bottomPowerDevice.value = null
      showBottomRobotBar.value = false
      bottomRobotDevice.value = null
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') {
    // 扫地机器人单击显示底部控制栏
    if (bottomRobotDevice.value?.id === device.id) {
      showBottomRobotBar.value = false
      bottomRobotDevice.value = null
    } else {
      bottomRobotDevice.value = device
      showBottomRobotBar.value = true
      selectedLightDevice.value = null
      emit('select-light', null)
      showBottomPowerBtn.value = false
      bottomPowerDevice.value = null
      showBottomWashBar.value = false
      bottomWashDevice.value = null
      showBottomRackBar.value = false
      bottomRackDevice.value = null
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'clothes-rack') {
    // 晾衣架单击显示底部控制栏
    if (bottomRackDevice.value?.id === device.id) {
      showBottomRackBar.value = false
      bottomRackDevice.value = null
    } else {
      bottomRackDevice.value = device
      showBottomRackBar.value = true
      selectedLightDevice.value = null
      emit('select-light', null)
      showBottomPowerBtn.value = false
      bottomPowerDevice.value = null
      showBottomWashBar.value = false
      bottomWashDevice.value = null
      showBottomRobotBar.value = false
      bottomRobotDevice.value = null
    }
  } else {
    selectedDevice.value = device
    showDeviceDialog.value = true
  }
}

const onBottomPowerClick = () => {
  if (bottomPowerDevice.value) {
    devicesStore.toggleStatus(bottomPowerDevice.value.id)
  }
}

const onWashTogglePower = () => {
  if (bottomWashDevice.value) {
    devicesStore.toggleStatus(bottomWashDevice.value.id)
  }
}

const onRobotTogglePower = () => {
  if (bottomRobotDevice.value) {
    devicesStore.toggleStatus(bottomRobotDevice.value.id)
  }
}

const onRackTogglePower = () => {
  if (bottomRackDevice.value) {
    devicesStore.toggleStatus(bottomRackDevice.value.id)
  }
}

const onBackgroundClick = () => {
  if (showBottomPowerBtn.value) {
    showBottomPowerBtn.value = false
    bottomPowerDevice.value = null
  }
  if (showBottomWashBar.value) {
    showBottomWashBar.value = false
    bottomWashDevice.value = null
  }
  if (showBottomRobotBar.value) {
    showBottomRobotBar.value = false
    bottomRobotDevice.value = null
  }
  if (showBottomRackBar.value) {
    showBottomRackBar.value = false
    bottomRackDevice.value = null
  }
}

const filteredDevices = computed(() => {
  const currentTab = tabsStore.tabs[tabsStore.activeIndex]
  return currentTab ? devicesStore.devices.filter(d => d.location === currentTab) : []
})

// 弹窗事件处理
const handleTogglePower = () => {
  if (selectedDevice.value) {
    devicesStore.toggleStatus(selectedDevice.value.id)
  }
}

const handleOpenTimer = () => {
  showTimerDialog.value = true
}

const handleOpenCountdown = () => {
  showCountdownDialog.value = true
}

const handleOpenPowerDetail = () => {
  showPowerDetailDialog.value = true
}

const handleRestart = () => {
  if (selectedDevice.value) {
    // 模拟重启：先关闭再开启
    devicesStore.toggleStatus(selectedDevice.value.id) // 关闭
    setTimeout(() => {
      if (selectedDevice.value) {
        devicesStore.toggleStatus(selectedDevice.value.id) // 开启
      }
    }, INTERACTION_TIMING.RESTART_DELAY)
    
    // 显示重启提示
    timerNotification.value = { show: true, message: `${selectedDevice.value.name} 正在重启...` }
    setTimeout(() => { timerNotification.value.show = false }, INTERACTION_TIMING.NOTIFICATION_DURATION)
  }
}

const handleTimerConfirm = (data: any) => {
  if (selectedDevice.value) {
    if (data.offEnabled) {
      devicesStore.setTimer(selectedDevice.value.id, 'off', true, data.offTime, data.offRepeat)
    } else {
      devicesStore.cancelTimer(selectedDevice.value.id, 'off')
    }
    if (data.onEnabled) {
      devicesStore.setTimer(selectedDevice.value.id, 'on', true, data.onTime, data.onRepeat)
    } else {
      devicesStore.cancelTimer(selectedDevice.value.id, 'on')
    }
    updateTimerRemaining()
  }
}

const handleTimerCancelAll = () => {
  if (selectedDevice.value) {
    devicesStore.cancelTimer(selectedDevice.value.id, 'off')
    devicesStore.cancelTimer(selectedDevice.value.id, 'on')
    updateTimerRemaining()
  }
}

const handleCountdownConfirm = (data: { hours: number; minutes: number; action: 'on' | 'off' }) => {
  if (selectedDevice.value) {
    const totalSeconds = data.hours * 3600 + data.minutes * 60
    if (totalSeconds > 0) {
      if (data.action === 'off') {
        devicesStore.cancelTimer(selectedDevice.value.id, 'off')
      } else {
        devicesStore.cancelTimer(selectedDevice.value.id, 'on')
      }
      devicesStore.setCountdown(selectedDevice.value.id, data.action, totalSeconds)
      updateTimerRemaining()
    }
  }
}

const handleCountdownCancel = () => {
  if (selectedDevice.value) {
    devicesStore.cancelCountdown(selectedDevice.value.id)
  }
}

const handleBrightnessUpdate = (value: number) => {
  if (selectedDevice.value) {
    devicesStore.setBrightness(selectedDevice.value.id, value)
  }
}

const handleColorTempUpdate = (value: number) => {
  if (selectedDevice.value) {
    devicesStore.setColorTemp(selectedDevice.value.id, value)
  }
}

// 注册定时执行回调
devicesStore.onTimerExecute((device, action) => {
  const actionText = action === 'on' ? '已开启' : '已关闭'
  timerNotification.value = { show: true, message: `${device.name} ${actionText}` }
  setTimeout(() => { timerNotification.value.show = false }, INTERACTION_TIMING.NOTIFICATION_DURATION)
  
  if (selectedDevice.value?.id === device.id) {
    showCountdownDialog.value = false
  }
})
</script>

<template>
  <div class="mode-content" @click="onBackgroundClick">
    <NavBar />
    <div 
      ref="cardsContainer"
      class="cards-container"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <GlassCard 
        v-for="device in filteredDevices" 
        :key="device.id"
        @click.stop="onCardClick(device)"
        @mousedown="onCardPressStart(device)"
        @mouseup="onCardPressEnd"
        @mouseleave="onCardPressEnd"
        @touchstart="onCardPressStart(device)"
        @touchend="onCardPressEnd"
        @touchcancel="onCardPressEnd"
      >
        <div class="device-content">
          <div class="device-name" :ref="(el) => checkNameOverflow(el as HTMLElement, device.id)">
            <span class="name-text" :class="{ overflow: isNameOverflow(device.id) }">{{ device.name }}</span>
          </div>
          <div class="device-type">{{ getDeviceDisplayType(device) }}</div>
          <div class="device-status" :class="device.status">
            <span class="status-dot"></span>
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
          <div v-if="getNextTimer(device)" class="timer-status" :class="getNextTimer(device)?.type === 'off' ? 'timer-off-status' : 'timer-on-status'">
            <span class="timer-status-text">{{ formatRemaining(getNextTimer(device)?.remaining || 0) }}{{ getNextTimer(device)?.type === 'off' ? '关闭' : '开启' }}</span>
          </div>
        </div>
      </GlassCard>
      <div v-if="filteredDevices.length === 0 && tabsStore.tabs.length > 0" class="empty-hint">
        当前房间暂无设备
      </div>
    </div>

    <BottomPowerBar 
      :visible="showBottomPowerBtn" 
      :device="bottomPowerDevice" 
      @click="onBottomPowerClick" 
    />

    <BottomWashBar
      :visible="showBottomWashBar"
      :device="bottomWashDevice"
      @toggle-power="onWashTogglePower"
    />

    <BottomRobotBar
      :visible="showBottomRobotBar"
      :device="bottomRobotDevice"
      @toggle-power="onRobotTogglePower"
    />

    <BottomRackBar
      :visible="showBottomRackBar"
      :device="bottomRackDevice"
      @toggle-power="onRackTogglePower"
    />

    <teleport to="body">
      <DeviceDialog
        v-model:visible="showDeviceDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @restart="handleRestart"
        @update:brightness="handleBrightnessUpdate"
        @update:color-temp="handleColorTempUpdate"
      />

      <SocketDialog
        v-model:visible="showSocketDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @open-countdown="handleOpenCountdown"
        @open-power-detail="handleOpenPowerDetail"
      />

      <TimerDialog
        v-model:visible="showTimerDialog"
        :device="selectedDevice"
        @confirm="handleTimerConfirm"
        @cancel-all="handleTimerCancelAll"
      />

      <CountdownDialog
        v-model:visible="showCountdownDialog"
        :device="selectedDevice"
        @confirm="handleCountdownConfirm"
        @cancel="handleCountdownCancel"
      />

      <PowerDetailDialog v-model:visible="showPowerDetailDialog" />

      <TimerNotification 
        :visible="timerNotification.show" 
        :message="timerNotification.message" 
      />
    </teleport>
  </div>
</template>

<style scoped>
.mode-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cards-container {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 24px 32px;
  margin-top: 20px;
  scrollbar-width: none;
  cursor: grab;
  user-select: none;
}

.cards-container:active { cursor: grabbing; }
.cards-container::-webkit-scrollbar { display: none; }
.cards-container > :deep(.glass-card) { flex-shrink: 0; }

.device-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  color: rgba(255, 255, 255, 0.95);
  gap: 12px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.device-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  letter-spacing: 0.02em;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.device-type {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  font-weight: 400;
  letter-spacing: 0.02em;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.device-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 11px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.device-status.online {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.4) 0%, rgba(34, 197, 94, 0.3) 100%);
  color: #a7f3d0;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

.device-status.offline {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.4) 0%, rgba(239, 68, 68, 0.3) 100%);
  color: #fecaca;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
}

.empty-hint {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px; /* Slightly larger for better visibility */
  font-weight: 400;
  padding: 40px;
  text-align: center;
  letter-spacing: 1px;
}

.timer-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
}

.timer-off-status { background: rgba(147, 112, 219, 0.25); color: #c4b5fd; }
.timer-on-status { background: rgba(251, 191, 36, 0.25); color: #fcd34d; }
.timer-status-text { font-weight: 500; }
</style>
