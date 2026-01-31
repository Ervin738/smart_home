<!--
  标准模式页面
  功能：主页面，显示当前房间的所有设备卡片，支持设备控制
  操作：单击卡片显示底部控制栏，长按卡片打开详情对话框，右键删除设备
-->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import GlassCard from '@/shared/components/GlassCard.vue'
import NavBar from '@/shared/components/NavBar.vue'
import TimerNotification from '@/shared/components/TimerNotification.vue'
import {
  // 灯光设备
  TableLampDialog,
  CeilingLampDialog,
  BottomLampBar,
  BottomCeilingLampBar,
  // 开关设备
  SocketDialog,
  SwitchDialog,
  BottomSocketBar,
  BottomSwitchBar,
  // 网络设备
  RouterDialog,
  GatewayDialog,
  WifiExtenderDialog,
  BottomRouterBar,
  BottomGatewayBar,
  BottomWifiExtenderBar,
  // 清洁设备
  WashingMachineDialog,
  DryerDialog,
  RobotVacuumDialog,
  ClothesRackDialog,
  BottomWashingMachineBar,
  BottomDryerBar,
  BottomRobotBar,
  BottomRackBar,
  // 环境设备
  HumidifierDialog,
  BottomHumidifierBar,
  HeaterDialog,
  BottomHeaterBar,
  AirConditionerDialog,
  BottomAirConditionerBar,
  FanDialog,
  BottomFanBar,
  DehumidifierDialog,
  BottomDehumidifierBar,
  // 通用对话框
  TimerDialog,
  CountdownDialog,
  PowerDetailDialog
} from '@/features/device/components'
import { useDevicesStore, type Device } from '@/features/device/store/devices.store'
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
  // 只更新有定时器或倒计时的设备，避免遍历所有设备
  const devicesWithTimers = devicesStore.devices.filter(
    device => device.timerOffEnabled || device.timerOnEnabled || device.countdownEnabled
  )
  
  devicesWithTimers.forEach(device => {
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

// 格式化延时关闭剩余时间
const formatDelayShutdownRemaining = (endTime: number) => {
  const now = Date.now()
  const remaining = Math.max(0, endTime - now)
  const minutes = Math.floor(remaining / 60000)
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  } else if (minutes > 0) {
    return `${minutes}分钟`
  } else {
    return '即将'
  }
}

onMounted(() => {
  updateTimerRemaining()
  timerUpdateInterval = window.setInterval(updateTimerRemaining, 1000)
})

onUnmounted(() => {
  if (timerUpdateInterval) clearInterval(timerUpdateInterval)
})

// 弹窗状态
const showTableLampDialog = ref(false)
const showCeilingLampDialog = ref(false)
const showSocketDialog = ref(false)
const showSwitchDialog = ref(false)
const showRouterDialog = ref(false)
const showGatewayDialog = ref(false)
const showWifiExtenderDialog = ref(false)
const showWashingMachineDialog = ref(false)
const showDryerDialog = ref(false)
const showRobotVacuumDialog = ref(false)
const showClothesRackDialog = ref(false)
const showHumidifierDialog = ref(false)
const showHeaterDialog = ref(false)
const showAirConditionerDialog = ref(false)
const showFanDialog = ref(false)
const showDehumidifierDialog = ref(false)
const showTimerDialog = ref(false)
const showCountdownDialog = ref(false)
const showPowerDetailDialog = ref(false)
const selectedDevice = ref<Device | null>(null)
const cardsContainer = ref<HTMLElement | null>(null)

// 底部控制
const showBottomLampBar = ref(false)
const bottomLampDevice = ref<Device | null>(null)
const showBottomCeilingLampBar = ref(false)
const bottomCeilingLampDevice = ref<Device | null>(null)
const showBottomSocketBar = ref(false)
const bottomSocketDevice = ref<Device | null>(null)
const showBottomSwitchBar = ref(false)
const bottomSwitchDevice = ref<Device | null>(null)
const showBottomRouterBar = ref(false)
const bottomRouterDevice = ref<Device | null>(null)
const showBottomGatewayBar = ref(false)
const bottomGatewayDevice = ref<Device | null>(null)
const showBottomWifiExtenderBar = ref(false)
const bottomWifiExtenderDevice = ref<Device | null>(null)
const showBottomWashingMachineBar = ref(false)
const bottomWashingMachineDevice = ref<Device | null>(null)
const showBottomDryerBar = ref(false)
const bottomDryerDevice = ref<Device | null>(null)
const showBottomRobotBar = ref(false)
const bottomRobotDevice = ref<Device | null>(null)
const showBottomRackBar = ref(false)
const bottomRackDevice = ref<Device | null>(null)
const showBottomHumidifierBar = ref(false)
const bottomHumidifierDevice = ref<Device | null>(null)
const showBottomHeaterBar = ref(false)
const bottomHeaterDevice = ref<Device | null>(null)
const showBottomAirConditionerBar = ref(false)
const bottomAirConditionerDevice = ref<Device | null>(null)
const showBottomFanBar = ref(false)
const bottomFanDevice = ref<Device | null>(null)
const showBottomDehumidifierBar = ref(false)
const bottomDehumidifierDevice = ref<Device | null>(null)

// 通知
const timerNotification = ref<{ show: boolean; message: string }>({ show: false, message: '' })

// 关闭所有底部弹窗的辅助函数
const closeAllBottomBars = () => {
  showBottomLampBar.value = false
  bottomLampDevice.value = null
  showBottomCeilingLampBar.value = false
  bottomCeilingLampDevice.value = null
  showBottomSocketBar.value = false
  bottomSocketDevice.value = null
  showBottomSwitchBar.value = false
  bottomSwitchDevice.value = null
  showBottomRouterBar.value = false
  bottomRouterDevice.value = null
  showBottomGatewayBar.value = false
  bottomGatewayDevice.value = null
  showBottomWifiExtenderBar.value = false
  bottomWifiExtenderDevice.value = null
  showBottomWashingMachineBar.value = false
  bottomWashingMachineDevice.value = null
  showBottomDryerBar.value = false
  bottomDryerDevice.value = null
  showBottomRobotBar.value = false
  bottomRobotDevice.value = null
  showBottomRackBar.value = false
  bottomRackDevice.value = null
  showBottomHumidifierBar.value = false
  bottomHumidifierDevice.value = null
  showBottomHeaterBar.value = false
  bottomHeaterDevice.value = null
  showBottomAirConditionerBar.value = false
  bottomAirConditionerDevice.value = null
  showBottomFanBar.value = false
  bottomFanDevice.value = null
  showBottomDehumidifierBar.value = false
  bottomDehumidifierDevice.value = null
}

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
    // 收起所有底部控制栏
    closeAllBottomBars()
    
    // 根据设备类型打开对应的对话框
    if (device.type === 'light' && device.lightType === 'table-lamp') {
      showTableLampDialog.value = true
    } else if (device.type === 'light' && device.lightType === 'ceiling-lamp') {
      showCeilingLampDialog.value = true
    } else if (device.type === 'switch' && device.switchType === 'socket') {
      showSocketDialog.value = true
    } else if (device.type === 'switch' && device.switchType === 'switch') {
      showSwitchDialog.value = true
    } else if (device.type === 'network' && device.networkType === 'router') {
      showRouterDialog.value = true
    } else if (device.type === 'network' && device.networkType === 'gateway') {
      showGatewayDialog.value = true
    } else if (device.type === 'network' && device.networkType === 'wifi-extender') {
      showWifiExtenderDialog.value = true
    } else if (device.type === 'cleaner' && device.cleanerType === 'washing-machine') {
      showWashingMachineDialog.value = true
    } else if (device.type === 'cleaner' && device.cleanerType === 'dryer') {
      showDryerDialog.value = true
    } else if (device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') {
      showRobotVacuumDialog.value = true
    } else if (device.type === 'cleaner' && device.cleanerType === 'clothes-rack') {
      showClothesRackDialog.value = true
    } else if (device.type === 'environment' && device.environmentType === 'humidifier') {
      showHumidifierDialog.value = true
    } else if (device.type === 'environment' && device.environmentType === 'heater') {
      showHeaterDialog.value = true
    } else if (device.type === 'environment' && device.environmentType === 'air-conditioner') {
      showAirConditionerDialog.value = true
    } else if (device.type === 'environment' && device.environmentType === 'fan') {
      showFanDialog.value = true
    } else if (device.type === 'environment' && device.environmentType === 'dehumidifier') {
      showDehumidifierDialog.value = true
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
  if (showTableLampDialog.value || showCeilingLampDialog.value || showSocketDialog.value || 
      showSwitchDialog.value || showRouterDialog.value || showGatewayDialog.value || 
      showWifiExtenderDialog.value || showWashingMachineDialog.value || showDryerDialog.value || 
      showRobotVacuumDialog.value || showClothesRackDialog.value || showHumidifierDialog.value || 
      showHeaterDialog.value || showAirConditionerDialog.value || showFanDialog.value || showDehumidifierDialog.value) return
  
  if (device.type === 'light' && device.lightType === 'table-lamp') {
    // 台灯单击显示底部控制栏
    if (bottomLampDevice.value?.id === device.id) {
      showBottomLampBar.value = false
      bottomLampDevice.value = null
    } else {
      closeAllBottomBars()
      bottomLampDevice.value = device
      showBottomLampBar.value = true
    }
  } else if (device.type === 'light' && device.lightType === 'ceiling-lamp') {
    // 吸顶灯单击显示底部控制栏
    if (bottomCeilingLampDevice.value?.id === device.id) {
      showBottomCeilingLampBar.value = false
      bottomCeilingLampDevice.value = null
    } else {
      closeAllBottomBars()
      bottomCeilingLampDevice.value = device
      showBottomCeilingLampBar.value = true
    }
  } else if (device.type === 'switch' && device.switchType === 'socket') {
    // 插座单击显示底部控制栏
    if (bottomSocketDevice.value?.id === device.id) {
      showBottomSocketBar.value = false
      bottomSocketDevice.value = null
    } else {
      closeAllBottomBars()
      bottomSocketDevice.value = device
      showBottomSocketBar.value = true
    }
  } else if (device.type === 'switch' && device.switchType === 'switch') {
    // 开关单击显示底部控制栏
    if (bottomSwitchDevice.value?.id === device.id) {
      showBottomSwitchBar.value = false
      bottomSwitchDevice.value = null
    } else {
      closeAllBottomBars()
      bottomSwitchDevice.value = device
      showBottomSwitchBar.value = true
    }
  } else if (device.type === 'network' && device.networkType === 'router') {
    // 路由器单击显示底部控制栏
    if (bottomRouterDevice.value?.id === device.id) {
      showBottomRouterBar.value = false
      bottomRouterDevice.value = null
    } else {
      closeAllBottomBars()
      bottomRouterDevice.value = device
      showBottomRouterBar.value = true
    }
  } else if (device.type === 'network' && device.networkType === 'gateway') {
    // 网关单击显示底部控制栏
    if (bottomGatewayDevice.value?.id === device.id) {
      showBottomGatewayBar.value = false
      bottomGatewayDevice.value = null
    } else {
      closeAllBottomBars()
      bottomGatewayDevice.value = device
      showBottomGatewayBar.value = true
    }
  } else if (device.type === 'network' && device.networkType === 'wifi-extender') {
    // WiFi放大器单击显示底部控制栏
    if (bottomWifiExtenderDevice.value?.id === device.id) {
      showBottomWifiExtenderBar.value = false
      bottomWifiExtenderDevice.value = null
    } else {
      closeAllBottomBars()
      bottomWifiExtenderDevice.value = device
      showBottomWifiExtenderBar.value = true
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'washing-machine') {
    // 洗衣机单击显示底部洗衣控制栏
    if (bottomWashingMachineDevice.value?.id === device.id) {
      showBottomWashingMachineBar.value = false
      bottomWashingMachineDevice.value = null
    } else {
      closeAllBottomBars()
      bottomWashingMachineDevice.value = device
      showBottomWashingMachineBar.value = true
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'dryer') {
    // 烘干机单击显示底部烘干控制栏
    if (bottomDryerDevice.value?.id === device.id) {
      showBottomDryerBar.value = false
      bottomDryerDevice.value = null
    } else {
      closeAllBottomBars()
      bottomDryerDevice.value = device
      showBottomDryerBar.value = true
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') {
    // 扫地机器人单击显示底部控制栏
    if (bottomRobotDevice.value?.id === device.id) {
      showBottomRobotBar.value = false
      bottomRobotDevice.value = null
    } else {
      closeAllBottomBars()
      bottomRobotDevice.value = device
      showBottomRobotBar.value = true
    }
  } else if (device.type === 'cleaner' && device.cleanerType === 'clothes-rack') {
    // 晾衣架单击显示底部控制栏
    if (bottomRackDevice.value?.id === device.id) {
      showBottomRackBar.value = false
      bottomRackDevice.value = null
    } else {
      closeAllBottomBars()
      bottomRackDevice.value = device
      showBottomRackBar.value = true
    }
  } else if (device.type === 'environment' && device.environmentType === 'humidifier') {
    // 加湿器单击显示底部控制栏
    if (bottomHumidifierDevice.value?.id === device.id) {
      showBottomHumidifierBar.value = false
      bottomHumidifierDevice.value = null
    } else {
      closeAllBottomBars()
      bottomHumidifierDevice.value = device
      showBottomHumidifierBar.value = true
    }
  } else if (device.type === 'environment' && device.environmentType === 'heater') {
    // 电暖器单击显示底部控制栏
    if (bottomHeaterDevice.value?.id === device.id) {
      showBottomHeaterBar.value = false
      bottomHeaterDevice.value = null
    } else {
      closeAllBottomBars()
      bottomHeaterDevice.value = device
      showBottomHeaterBar.value = true
    }
  } else if (device.type === 'environment' && device.environmentType === 'air-conditioner') {
    // 空调单击显示底部控制栏
    if (bottomAirConditionerDevice.value?.id === device.id) {
      showBottomAirConditionerBar.value = false
      bottomAirConditionerDevice.value = null
    } else {
      closeAllBottomBars()
      bottomAirConditionerDevice.value = device
      showBottomAirConditionerBar.value = true
    }
  } else if (device.type === 'environment' && device.environmentType === 'fan') {
    // 风扇单击显示底部控制栏
    if (bottomFanDevice.value?.id === device.id) {
      showBottomFanBar.value = false
      bottomFanDevice.value = null
    } else {
      closeAllBottomBars()
      bottomFanDevice.value = device
      showBottomFanBar.value = true
    }
  } else if (device.type === 'environment' && device.environmentType === 'dehumidifier') {
    // 除湿机单击显示底部控制栏
    if (bottomDehumidifierDevice.value?.id === device.id) {
      showBottomDehumidifierBar.value = false
      bottomDehumidifierDevice.value = null
    } else {
      closeAllBottomBars()
      bottomDehumidifierDevice.value = device
      showBottomDehumidifierBar.value = true
    }
  } else {
    // 其他设备类型暂不处理
    console.log('Device type not handled:', device.type)
  }
}

const onLampTogglePower = () => {
  if (bottomLampDevice.value) {
    devicesStore.toggleStatus(bottomLampDevice.value.id)
  }
}

const onLampUpdateBrightness = (value: number) => {
  if (bottomLampDevice.value) {
    devicesStore.setBrightness(bottomLampDevice.value.id, value)
  }
}

const onCeilingLampTogglePower = () => {
  if (bottomCeilingLampDevice.value) {
    devicesStore.toggleStatus(bottomCeilingLampDevice.value.id)
  }
}

const onCeilingLampUpdateBrightness = (value: number) => {
  if (bottomCeilingLampDevice.value) {
    devicesStore.setBrightness(bottomCeilingLampDevice.value.id, value)
  }
}

const onSocketTogglePower = () => {
  if (bottomSocketDevice.value) {
    devicesStore.toggleStatus(bottomSocketDevice.value.id)
  }
}

const onSwitchTogglePower = () => {
  if (bottomSwitchDevice.value) {
    devicesStore.toggleStatus(bottomSwitchDevice.value.id)
  }
}

const onRouterTogglePower = () => {
  if (bottomRouterDevice.value) {
    devicesStore.toggleStatus(bottomRouterDevice.value.id)
  }
}

const onGatewayTogglePower = () => {
  if (bottomGatewayDevice.value) {
    devicesStore.toggleStatus(bottomGatewayDevice.value.id)
  }
}

const onWifiExtenderTogglePower = () => {
  if (bottomWifiExtenderDevice.value) {
    devicesStore.toggleStatus(bottomWifiExtenderDevice.value.id)
  }
}

const onWashingMachineTogglePower = () => {
  if (bottomWashingMachineDevice.value) {
    devicesStore.toggleStatus(bottomWashingMachineDevice.value.id)
  }
}

const onDryerTogglePower = () => {
  if (bottomDryerDevice.value) {
    devicesStore.toggleStatus(bottomDryerDevice.value.id)
  }
}

const onRobotTogglePower = () => {
  if (bottomRobotDevice.value) {
    devicesStore.toggleStatus(bottomRobotDevice.value.id)
  }
}

const onRobotSelectMode = (mode: string) => {
  if (bottomRobotDevice.value) {
    const modeIndex = ['扫地', '拖地', '边扫边拖', '先扫后拖'].indexOf(mode)
    if (modeIndex !== -1) {
      devicesStore.setRobotMode(bottomRobotDevice.value.id, modeIndex)
    }
  }
}

const onRobotDialogUpdateMode = (index: number) => {
  if (selectedDevice.value) {
    devicesStore.setRobotMode(selectedDevice.value.id, index)
  }
}

const onRobotDialogUpdateCleaning = (isCleaning: boolean) => {
  if (selectedDevice.value) {
    devicesStore.setRobotCleaning(selectedDevice.value.id, isCleaning)
  }
}

const onRobotToggleCleaning = () => {
  if (bottomRobotDevice.value) {
    const newState = !bottomRobotDevice.value.robotIsCleaning
    devicesStore.setRobotCleaning(bottomRobotDevice.value.id, newState)
  }
}

const onRackTogglePower = () => {
  if (bottomRackDevice.value) {
    devicesStore.toggleStatus(bottomRackDevice.value.id)
  }
}

const onHumidifierTogglePower = () => {
  if (bottomHumidifierDevice.value) {
    devicesStore.toggleStatus(bottomHumidifierDevice.value.id)
  }
}

const onHumidifierSelectLevel = (level: number) => {
  if (bottomHumidifierDevice.value) {
    devicesStore.setHumidifierLevel(bottomHumidifierDevice.value.id, level)
  }
}

const onHumidifierDialogUpdateLevel = (level: number) => {
  if (selectedDevice.value) {
    devicesStore.setHumidifierLevel(selectedDevice.value.id, level)
  }
}

const onHeaterTogglePower = () => {
  if (bottomHeaterDevice.value) {
    devicesStore.toggleStatus(bottomHeaterDevice.value.id)
  }
}

const onHeaterUpdateTargetTemp = (value: number) => {
  if (bottomHeaterDevice.value) {
    devicesStore.setTargetTemp(bottomHeaterDevice.value.id, value)
  }
}

const onAirConditionerTogglePower = () => {
  if (bottomAirConditionerDevice.value) {
    devicesStore.toggleStatus(bottomAirConditionerDevice.value.id)
  }
}

const onAirConditionerUpdateTargetTemp = (value: number) => {
  if (bottomAirConditionerDevice.value) {
    devicesStore.setTargetTemp(bottomAirConditionerDevice.value.id, value)
  }
}

const onFanTogglePower = () => {
  if (bottomFanDevice.value) {
    devicesStore.toggleStatus(bottomFanDevice.value.id)
  }
}

const onDehumidifierTogglePower = () => {
  if (bottomDehumidifierDevice.value) {
    devicesStore.toggleStatus(bottomDehumidifierDevice.value.id)
  }
}

const onBackgroundClick = () => {
  closeAllBottomBars()
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
    const deviceType = getDeviceDisplayType(selectedDevice.value)
    timerNotification.value = { show: true, message: `${selectedDevice.value.name} 正在重启${deviceType}······` }
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

const handleTargetTempUpdate = (value: number) => {
  if (selectedDevice.value) {
    devicesStore.setTargetTemp(selectedDevice.value.id, value)
  }
}

// 注册定时执行回调
devicesStore.onTimerExecute((device, action) => {
  const actionText = action === 'on' ? '已开启' : '已关闭'
  const deviceType = getDeviceDisplayType(device)
  timerNotification.value = { show: true, message: `${device.name} ${actionText}${deviceType}` }
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
          <div class="device-name" :ref="(el) => el && checkNameOverflow(el as HTMLElement, device.id)">
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
          <!-- 延时关闭提示 -->
          <div v-if="device.delayShutdownEnabled && device.delayShutdownEndTime && device.status === 'online'" class="delay-shutdown-status">
            <span class="delay-shutdown-text">{{ formatDelayShutdownRemaining(device.delayShutdownEndTime) }}后关闭</span>
          </div>
        </div>
      </GlassCard>
      <div v-if="filteredDevices.length === 0 && tabsStore.tabs.length > 0" class="empty-hint">
        当前房间暂无设备
      </div>
    </div>

    <BottomLampBar
      :visible="showBottomLampBar"
      :device="bottomLampDevice"
      @toggle-power="onLampTogglePower"
      @update:brightness="onLampUpdateBrightness"
    />

    <BottomCeilingLampBar
      :visible="showBottomCeilingLampBar"
      :device="bottomCeilingLampDevice"
      @toggle-power="onCeilingLampTogglePower"
      @update:brightness="onCeilingLampUpdateBrightness"
    />

    <BottomSocketBar
      :visible="showBottomSocketBar"
      :device="bottomSocketDevice"
      @toggle-power="onSocketTogglePower"
    />

    <BottomSwitchBar
      :visible="showBottomSwitchBar"
      :device="bottomSwitchDevice"
      @toggle-power="onSwitchTogglePower"
    />

    <BottomRouterBar
      :visible="showBottomRouterBar"
      :device="bottomRouterDevice"
      @toggle-power="onRouterTogglePower"
    />

    <BottomGatewayBar
      :visible="showBottomGatewayBar"
      :device="bottomGatewayDevice"
      @toggle-power="onGatewayTogglePower"
    />

    <BottomWifiExtenderBar
      :visible="showBottomWifiExtenderBar"
      :device="bottomWifiExtenderDevice"
      @toggle-power="onWifiExtenderTogglePower"
    />

    <BottomWashingMachineBar
      :visible="showBottomWashingMachineBar"
      :device="bottomWashingMachineDevice"
      @toggle-power="onWashingMachineTogglePower"
    />

    <BottomDryerBar
      :visible="showBottomDryerBar"
      :device="bottomDryerDevice"
      @toggle-power="onDryerTogglePower"
    />

    <BottomRobotBar
      :visible="showBottomRobotBar"
      :device="bottomRobotDevice"
      @toggle-power="onRobotTogglePower"
      @select-mode="onRobotSelectMode"
      @toggle-cleaning="onRobotToggleCleaning"
    />

    <BottomRackBar
      :visible="showBottomRackBar"
      :device="bottomRackDevice"
      @toggle-power="onRackTogglePower"
    />

    <BottomHumidifierBar
      :visible="showBottomHumidifierBar"
      :device="bottomHumidifierDevice"
      @toggle-power="onHumidifierTogglePower"
      @select-level="onHumidifierSelectLevel"
    />

    <BottomHeaterBar
      :visible="showBottomHeaterBar"
      :device="bottomHeaterDevice"
      @toggle-power="onHeaterTogglePower"
      @update:targetTemp="onHeaterUpdateTargetTemp"
    />

    <BottomAirConditionerBar
      :visible="showBottomAirConditionerBar"
      :device="bottomAirConditionerDevice"
      @toggle-power="onAirConditionerTogglePower"
      @update:targetTemp="onAirConditionerUpdateTargetTemp"
    />

    <BottomFanBar
      :visible="showBottomFanBar"
      :device="bottomFanDevice"
      @toggle-power="onFanTogglePower"
    />

    <BottomDehumidifierBar
      :visible="showBottomDehumidifierBar"
      :device="bottomDehumidifierDevice"
      @toggle-power="onDehumidifierTogglePower"
    />

    <teleport to="body">
      <TableLampDialog
        v-model:visible="showTableLampDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @update:brightness="handleBrightnessUpdate"
        @update:colorTemp="handleColorTempUpdate"
      />

      <CeilingLampDialog
        v-model:visible="showCeilingLampDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @update:brightness="handleBrightnessUpdate"
        @update:colorTemp="handleColorTempUpdate"
      />

      <SocketDialog
        v-model:visible="showSocketDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @open-countdown="handleOpenCountdown"
        @open-power-detail="handleOpenPowerDetail"
      />

      <SwitchDialog
        v-model:visible="showSwitchDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <RouterDialog
        v-model:visible="showRouterDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @restart="handleRestart"
      />

      <GatewayDialog
        v-model:visible="showGatewayDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @restart="handleRestart"
      />

      <WifiExtenderDialog
        v-model:visible="showWifiExtenderDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @restart="handleRestart"
      />

      <WashingMachineDialog
        v-model:visible="showWashingMachineDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <DryerDialog
        v-model:visible="showDryerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <RobotVacuumDialog
        v-model:visible="showRobotVacuumDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @update:mode="onRobotDialogUpdateMode"
        @update:cleaning="onRobotDialogUpdateCleaning"
      />

      <ClothesRackDialog
        v-model:visible="showClothesRackDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <HumidifierDialog
        v-model:visible="showHumidifierDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @update:level="onHumidifierDialogUpdateLevel"
      />

      <HeaterDialog
        v-model:visible="showHeaterDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @update:targetTemp="handleTargetTempUpdate"
      />

      <AirConditionerDialog
        v-model:visible="showAirConditionerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <FanDialog
        v-model:visible="showFanDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <DehumidifierDialog
        v-model:visible="showDehumidifierDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
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

.delay-shutdown-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 11px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 154, 60, 0.3);
  background: linear-gradient(135deg, rgba(255, 154, 60, 0.4) 0%, rgba(255, 122, 31, 0.3) 100%);
  color: #ffb366;
  box-shadow: 0 4px 12px rgba(255, 154, 60, 0.2);
}

.delay-shutdown-text {
  white-space: nowrap;
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
