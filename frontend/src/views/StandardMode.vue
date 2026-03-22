<!--
  标准模式页面
  功能：主页面，显示当前房间的所有设备卡片，支持设备控制
  操作：单击卡片显示底部控制栏，长按卡片打开详情对话框，右键删除设备
-->
<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import GlassCard from '@/shared/components/GlassCard.vue'
import TimerNotification from '@/shared/components/TimerNotification.vue'
import { useRoute } from 'vue-router'
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
  AirPurifierDialog,
  BottomAirPurifierBar,
  DehumidifierDialog,
  BottomDehumidifierBar,
  AromaDiffuserDialog,
  BottomAromaDiffuserBar,
  // 浴室设备
  ToiletDialog,
  WaterHeaterDialog,
  YubaDialog,
  BottomToiletBar,
  BottomWaterHeaterBar,
  BottomYubaBar,
  // 娱乐设备
  TvDialog,
  SpeakerDialog,
  ProjectorDialog,
  ClockDialog,
  BottomTvBar,
  BottomSpeakerBar,
  BottomProjectorBar,
  BottomClockBar,
  // 厨房设备
  RiceCookerDialog,
  InductionCookerDialog,
  RangeHoodDialog,
  ElectricKettleDialog,
  AirFryerDialog,
  WaterDispenserDialog,
  BottomRiceCookerBar,
  BottomInductionCookerBar,
  BottomRangeHoodBar,
  BottomElectricKettleBar,
  BottomAirFryerBar,
  WaterDispenserBottomSheet,
  // 个人设备
  SmartBedDialog,
  SmartPillowDialog,
  ElectricBlanketDialog,
  WindowOpenerDialog,
  BottomSmartBedBar,
  BottomSmartPillowBar,
  BottomElectricBlanketBar,
  BottomWindowOpenerBar,
  // 安防设备
  CameraDialog,
  DoorLockDialog,
  SmartDoorDialog,
  BottomCameraBar,
  BottomDoorLockBar,
  BottomSmartDoorBar,
  // 通用对话框
  TimerDialog,
  CountdownDialog,
  PowerDetailDialog
} from '@/features/device/components'
import { useDevicesStore, type Device } from '@/features/device/store/devices.store'
import { useTabsStore } from '@/features/layout/tabs'
import { useThemeStore } from '@/stores/theme'
import { useNameOverflow } from '@/shared/composables'
import { useBottomBar } from '@/features/device/composables'
import { getDeviceDisplayType, INTERACTION_TIMING } from '@/constants'
import { formatRemaining } from '@/shared/utils'

const devicesStore = useDevicesStore()
const tabsStore = useTabsStore()
const themeStore = useThemeStore()
const route = useRoute()
const { checkNameOverflow, isNameOverflow } = useNameOverflow()
const { bottomBars, closeAll: closeAllBottomBars, toggle: toggleBottomBar, getBar } = useBottomBar()

// 定时剩余时间
const timerOffRemainingMap = ref<Record<string, number>>({})
const timerOnRemainingMap = ref<Record<string, number>>({})
const countdownRemainingMap = ref<Record<string, number>>({})
const alarmRemainingMap = ref<Record<string, number>>({})
const currentTime = ref(Date.now())
let timerUpdateInterval: number | null = null

const updateTimerRemaining = () => {
  currentTime.value = Date.now()
  const now = currentTime.value
  // 只更新有定时器或倒计时或闹钟的设备，避免遍历所有设备
  const devicesWithTimers = devicesStore.devices.filter(
    device => device.timerOffEnabled || device.timerOnEnabled || device.countdownEnabled || (device.type === 'entertainment' && device.alarmEnabled)
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
    if (device.type === 'entertainment' && device.alarmEnabled && device.alarmTimestamp) {
      const remainingMs = Math.max(0, device.alarmTimestamp - Date.now())
      alarmRemainingMap.value[device.id] = Math.floor(remainingMs / 1000)
    } else {
      delete alarmRemainingMap.value[device.id]
    }
  })

  // 检查电饭煲烹饪是否结束
  devicesStore.devices.forEach(device => {
    const d = device as any
    if (d.riceCookerCooking && d.riceCookerCookingEndTime && d.riceCookerCookingEndTime <= now) {
      devicesStore.setDeviceExtra(device.id, {
        riceCookerCooking: false,
        riceCookerCookingEndTime: undefined,
      })
    }
    // 检查延时关机是否到期
    if (d.delayShutdownEnabled && d.delayShutdownEndTime && d.delayShutdownEndTime <= now && device.status === 'online') {
      devicesStore.toggleDevicePower(device.id)
      devicesStore.setDeviceExtra(device.id, {
        delayShutdownEnabled: false,
        delayShutdownEndTime: undefined,
        delayShutdownDuration: undefined,
      })
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
  const now = currentTime.value
  const remaining = Math.max(0, endTime - now)
  const totalMinutes = Math.floor(remaining / 60000)
  
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return mins > 0 ? `${hours}时${mins}分` : `${hours}时`
  } else if (totalMinutes > 0) {
    return `${totalMinutes}分`
  } else {
    return '即将'
  }
}

onMounted(() => {
  updateTimerRemaining()
  timerUpdateInterval = window.setInterval(updateTimerRemaining, 1000)
})

onBeforeUnmount(() => {
  // 在组件卸载前关闭所有弹窗
  closeAllDialogs()
})

onUnmounted(() => {
  if (timerUpdateInterval) clearInterval(timerUpdateInterval)
})

// 关闭所有弹窗的函数
const closeAllDialogs = () => {
  showTableLampDialog.value = false
  showCeilingLampDialog.value = false
  showSocketDialog.value = false
  showSwitchDialog.value = false
  showRouterDialog.value = false
  showGatewayDialog.value = false
  showWifiExtenderDialog.value = false
  showWashingMachineDialog.value = false
  showDryerDialog.value = false
  showRobotVacuumDialog.value = false
  showClothesRackDialog.value = false
  showHumidifierDialog.value = false
  showHeaterDialog.value = false
  showAirConditionerDialog.value = false
  showFanDialog.value = false
  showAirPurifierDialog.value = false
  showDehumidifierDialog.value = false
  showAromaDiffuserDialog.value = false
  showToiletDialog.value = false
  showWaterHeaterDialog.value = false
  showYubaDialog.value = false
  showTvDialog.value = false
  showSpeakerDialog.value = false
  showProjectorDialog.value = false
  showClockDialog.value = false
  showRiceCookerDialog.value = false
  showInductionCookerDialog.value = false
  showRangeHoodDialog.value = false
  showElectricKettleDialog.value = false
  showAirFryerDialog.value = false
  showWaterDispenserDialog.value = false
  showSmartBedDialog.value = false
  showSmartPillowDialog.value = false
  showElectricBlanketDialog.value = false
  showWindowOpenerDialog.value = false
  showCameraDialog.value = false
  showDoorLockDialog.value = false
  showSmartDoorDialog.value = false
  showTimerDialog.value = false
  showCountdownDialog.value = false
  showPowerDetailDialog.value = false
  selectedDevice.value = null
  closeAllBottomBars()
}

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
const showAirPurifierDialog = ref(false)
const showDehumidifierDialog = ref(false)
const showAromaDiffuserDialog = ref(false)
// 浴室设备
const showToiletDialog = ref(false)
const showWaterHeaterDialog = ref(false)
const showYubaDialog = ref(false)
const yubaWindMode = ref<'warm' | 'blow'>('warm')
// 娱乐设备
const showTvDialog = ref(false)
const showSpeakerDialog = ref(false)
const showProjectorDialog = ref(false)
const showClockDialog = ref(false)
// 厨房设备
const showRiceCookerDialog = ref(false)
const showInductionCookerDialog = ref(false)
const showRangeHoodDialog = ref(false)
const showElectricKettleDialog = ref(false)
const showAirFryerDialog = ref(false)
const showWaterDispenserDialog = ref(false)
// 个人设备
const showSmartBedDialog = ref(false)
const showSmartPillowDialog = ref(false)
const showElectricBlanketDialog = ref(false)
const showWindowOpenerDialog = ref(false)
// 安防设备
const showCameraDialog = ref(false)
const showDoorLockDialog = ref(false)
const showSmartDoorDialog = ref(false)
// 通用对话框
const showTimerDialog = ref(false)
const showCountdownDialog = ref(false)
const showPowerDetailDialog = ref(false)
const selectedDevice = ref<Device | null>(null)
const cardsContainer = ref<HTMLElement | null>(null)

// 使用 useBottomBar 管理底部栏状态
const lampBar = computed(() => getBar('lamp'))
const ceilingLampBar = computed(() => getBar('ceilingLamp'))
const socketBar = computed(() => getBar('socket'))
const switchBar = computed(() => getBar('switch'))
const routerBar = computed(() => getBar('router'))
const gatewayBar = computed(() => getBar('gateway'))
const wifiExtenderBar = computed(() => getBar('wifiExtender'))
const washingMachineBar = computed(() => getBar('washingMachine'))
const dryerBar = computed(() => getBar('dryer'))
const robotVacuumBar = computed(() => getBar('robotVacuum'))
const rackBar = computed(() => getBar('rack'))
const humidifierBar = computed(() => getBar('humidifier'))
const heaterBar = computed(() => getBar('heater'))
const airConditionerBar = computed(() => getBar('airConditioner'))
const fanBar = computed(() => getBar('fan'))
const airPurifierBar = computed(() => getBar('airPurifier'))
const dehumidifierBar = computed(() => getBar('dehumidifier'))
const aromaDiffuserBar = computed(() => getBar('aromaDiffuser'))
// 浴室设备
const toiletBar = computed(() => getBar('toilet'))
const waterHeaterBar = computed(() => getBar('waterHeater'))
const yubaBar = computed(() => getBar('yuba'))
// 娱乐设备
const tvBar = computed(() => getBar('tv'))
const speakerBar = computed(() => getBar('speaker'))
const projectorBar = computed(() => getBar('projector'))
const clockBar = computed(() => getBar('clock'))
// 厨房设备
const riceCookerBar = computed(() => getBar('riceCooker'))
const inductionCookerBar = computed(() => getBar('inductionCooker'))
const rangeHoodBar = computed(() => getBar('rangeHood'))
const electricKettleBar = computed(() => getBar('electricKettle'))
const airFryerBar = computed(() => getBar('airFryer'))
const waterDispenserBar = computed(() => getBar('waterDispenser'))
// 个人设备
const smartBedBar = computed(() => getBar('smartBed'))
const smartPillowBar = computed(() => getBar('smartPillow'))
const electricBlanketBar = computed(() => getBar('electricBlanket'))
const windowOpenerBar = computed(() => getBar('windowOpener'))
// 安防设备
const cameraBar = computed(() => getBar('camera'))
const doorLockBar = computed(() => getBar('doorLock'))
const smartDoorBar = computed(() => getBar('smartDoor'))

// 通知
const timerNotification = ref<{ show: boolean; message: string }>({ show: false, message: '' })

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

// 设备类型到对话框的映射
const deviceDialogMap: Record<string, { show: any }> = {
  'light-table-lamp': { show: showTableLampDialog },
  'light-ceiling-lamp': { show: showCeilingLampDialog },
  'switch-socket': { show: showSocketDialog },
  'switch-switch': { show: showSwitchDialog },
  'network-router': { show: showRouterDialog },
  'network-gateway': { show: showGatewayDialog },
  'network-wifi-extender': { show: showWifiExtenderDialog },
  'cleaner-washing-machine': { show: showWashingMachineDialog },
  'cleaner-dryer': { show: showDryerDialog },
  'cleaner-robot-vacuum': { show: showRobotVacuumDialog },
  'cleaner-clothes-rack': { show: showClothesRackDialog },
  'environment-humidifier': { show: showHumidifierDialog },
  'environment-heater': { show: showHeaterDialog },
  'environment-air-conditioner': { show: showAirConditionerDialog },
  'environment-fan': { show: showFanDialog },
  'environment-air-purifier': { show: showAirPurifierDialog },
  'environment-dehumidifier': { show: showDehumidifierDialog },
  'environment-aroma-diffuser': { show: showAromaDiffuserDialog },
  // 浴室设备
  'bathroom-toilet': { show: showToiletDialog },
  'bathroom-water-heater': { show: showWaterHeaterDialog },
  'bathroom-yuba': { show: showYubaDialog },
  // 娱乐设备
  'entertainment-tv': { show: showTvDialog },
  'entertainment-speaker': { show: showSpeakerDialog },
  'entertainment-projector': { show: showProjectorDialog },
  'entertainment-clock': { show: showClockDialog },
  // 厨房设备
  'kitchen-rice-cooker': { show: showRiceCookerDialog },
  'kitchen-induction-cooker': { show: showInductionCookerDialog },
  'kitchen-range-hood': { show: showRangeHoodDialog },
  'kitchen-electric-kettle': { show: showElectricKettleDialog },
  'kitchen-air-fryer': { show: showAirFryerDialog },
  'kitchen-water-dispenser': { show: showWaterDispenserDialog },
  // 个人设备
  'personal-smart-bed': { show: showSmartBedDialog },
  'personal-smart-pillow': { show: showSmartPillowDialog },
  'personal-electric-blanket': { show: showElectricBlanketDialog },
  'personal-window-opener': { show: showWindowOpenerDialog },
  // 安防设备
  'security-camera': { show: showCameraDialog },
  'security-door-lock': { show: showDoorLockDialog },
  'security-smart-door': { show: showSmartDoorDialog }
}

// 获取设备对话框的键
const getDeviceDialogKey = (device: Device): string | null => {
  if (device.type === 'light' && device.lightType) return `light-${device.lightType}`
  if (device.type === 'switch' && device.switchType) return `switch-${device.switchType}`
  if (device.type === 'network' && device.networkType) return `network-${device.networkType}`
  if (device.type === 'cleaner' && device.cleanerType) return `cleaner-${device.cleanerType}`
  if (device.type === 'environment' && device.environmentType) return `environment-${device.environmentType}`
  if (device.type === 'bathroom' && device.bathroomType) return `bathroom-${device.bathroomType}`
  if (device.type === 'entertainment' && device.entertainmentType) return `entertainment-${device.entertainmentType}`
  if (device.type === 'kitchen' && device.kitchenType) return `kitchen-${device.kitchenType}`
  if (device.type === 'personal' && device.personalType) return `personal-${device.personalType}`
  if (device.type === 'security' && device.securityType) return `security-${device.securityType}`
  return null
}

const onCardPressStart = (device: Device) => {
  longPressTimer.value = window.setTimeout(() => {
    selectedDevice.value = device
    closeAllBottomBars()
    
    // 根据设备类型打开对应的对话框
    const dialogKey = getDeviceDialogKey(device)
    if (dialogKey && deviceDialogMap[dialogKey]) {
      deviceDialogMap[dialogKey].show.value = true
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
  // 如果有任何对话框打开，不处理点击
  if (showTableLampDialog.value || showCeilingLampDialog.value || showSocketDialog.value || 
      showSwitchDialog.value || showRouterDialog.value || showGatewayDialog.value || 
      showWifiExtenderDialog.value || showWashingMachineDialog.value || showDryerDialog.value || 
      showRobotVacuumDialog.value || showClothesRackDialog.value || showHumidifierDialog.value || 
      showHeaterDialog.value || showAirConditionerDialog.value || showFanDialog.value ||
      showAirPurifierDialog.value || showDehumidifierDialog.value || showAromaDiffuserDialog.value ||
      showToiletDialog.value || showWaterHeaterDialog.value || showYubaDialog.value ||
      showTvDialog.value || showSpeakerDialog.value || showProjectorDialog.value || showClockDialog.value ||
      showRiceCookerDialog.value || showInductionCookerDialog.value || showRangeHoodDialog.value ||
      showElectricKettleDialog.value || showAirFryerDialog.value || showWaterDispenserDialog.value ||
      showSmartBedDialog.value || showSmartPillowDialog.value || showElectricBlanketDialog.value || showWindowOpenerDialog.value ||
      showCameraDialog.value || showDoorLockDialog.value || showSmartDoorDialog.value) return
  
  // 使用统一的 toggle 方法
  toggleBottomBar(device)
}

// 通用的底部栏设备操作辅助函数
const getBottomBarDevice = (barKey: 'lamp' | 'ceilingLamp' | 'socket' | 'switch' | 'router' | 'gateway' | 'wifiExtender' | 'washingMachine' | 'dryer' | 'rack' | 'robotVacuum' | 'humidifier' | 'heater' | 'airConditioner' | 'fan' | 'airPurifier' | 'dehumidifier' | 'aromaDiffuser' | 'toilet' | 'waterHeater' | 'yuba' | 'tv' | 'speaker' | 'projector' | 'clock' | 'riceCooker' | 'inductionCooker' | 'rangeHood' | 'electricKettle' | 'airFryer' | 'waterDispenser' | 'smartBed' | 'smartPillow' | 'electricBlanket' | 'windowOpener' | 'camera' | 'doorLock' | 'smartDoor') => {
  return getBar(barKey).device
}

// 通用的切换电源函数
const createTogglePowerHandler = (barKey: Parameters<typeof getBottomBarDevice>[0]) => () => {
  const device = getBottomBarDevice(barKey)
  if (device) devicesStore.toggleStatus(device.id)
}

// 通用的更新属性函数
const createUpdateHandler = <T>(barKey: Parameters<typeof getBottomBarDevice>[0], updateFn: (id: string, value: T) => void) => (value: T) => {
  const device = getBottomBarDevice(barKey)
  if (device) updateFn(device.id, value)
}

// 底部栏电源切换事件
const onLampTogglePower = createTogglePowerHandler('lamp')
const onCeilingLampTogglePower = createTogglePowerHandler('ceilingLamp')
const onSocketTogglePower = createTogglePowerHandler('socket')
const onSwitchTogglePower = createTogglePowerHandler('switch')
const onRouterTogglePower = createTogglePowerHandler('router')
const onGatewayTogglePower = createTogglePowerHandler('gateway')
const onWifiExtenderTogglePower = createTogglePowerHandler('wifiExtender')
const onWashingMachineTogglePower = createTogglePowerHandler('washingMachine')
const onDryerTogglePower = createTogglePowerHandler('dryer')
const onRobotVacuumTogglePower = createTogglePowerHandler('robotVacuum')
const onRackTogglePower = createTogglePowerHandler('rack')
const onHumidifierTogglePower = createTogglePowerHandler('humidifier')
const onHeaterTogglePower = createTogglePowerHandler('heater')
const onAirConditionerTogglePower = createTogglePowerHandler('airConditioner')
const onFanTogglePower = createTogglePowerHandler('fan')
const onAirPurifierTogglePower = createTogglePowerHandler('airPurifier')
const onDehumidifierTogglePower = createTogglePowerHandler('dehumidifier')
const onAromaDiffuserTogglePower = createTogglePowerHandler('aromaDiffuser')

const onAromaDiffuserQuickAroma = () => {
  const device = getBottomBarDevice('aromaDiffuser')
  if (device) console.log('快速出香:', device.id)
}
// 浴室设备
const onToiletTogglePower = createTogglePowerHandler('toilet')
const onWaterHeaterTogglePower = createTogglePowerHandler('waterHeater')
const onYubaTogglePower = createTogglePowerHandler('yuba')
// 娱乐设备
const onTvTogglePower = createTogglePowerHandler('tv')
const onSpeakerTogglePower = createTogglePowerHandler('speaker')
const onProjectorTogglePower = createTogglePowerHandler('projector')
const onClockTogglePower = createTogglePowerHandler('clock')
// 厨房设备
const onRiceCookerTogglePower = createTogglePowerHandler('riceCooker')

const onRiceCookerOpenModeSelector = (mainModeId: number) => {
  const device = getBottomBarDevice('riceCooker')
  if (device) selectedDevice.value = device
  showRiceCookerDialog.value = true
  nextTick(() => {
    window.dispatchEvent(new CustomEvent('open-rice-cooker-mode-selector', { detail: { mainModeId } }))
  })
}

const onRiceCookerOpenKeepWarmSettings = () => {
  const device = getBottomBarDevice('riceCooker')
  if (device) selectedDevice.value = device
  showRiceCookerDialog.value = true
  nextTick(() => {
    window.dispatchEvent(new CustomEvent('open-rice-cooker-keep-warm-settings'))
  })
}

const handleRiceCookerStartCooking = (durationMinutes: number, modeName: string, modeId: number) => {
  if (selectedDevice.value) {
    const endTime = Date.now() + durationMinutes * 60 * 1000
    devicesStore.setDeviceExtra(selectedDevice.value.id, {
      riceCookerCooking: true,
      riceCookerModeName: modeName,
      riceCookerCookingEndTime: endTime,
    })
  }
}

const handleRiceCookerCancelCooking = () => {
  if (selectedDevice.value) {
    devicesStore.setDeviceExtra(selectedDevice.value.id, {
      riceCookerCooking: false,
      riceCookerCookingEndTime: undefined,
    })
  }
}
const onInductionCookerTogglePower = createTogglePowerHandler('inductionCooker')
const onRangeHoodTogglePower = createTogglePowerHandler('rangeHood')
const onElectricKettleTogglePower = createTogglePowerHandler('electricKettle')
const onAirFryerTogglePower = createTogglePowerHandler('airFryer')
const onWaterDispenserTogglePower = createTogglePowerHandler('waterDispenser')
// 个人设备
const onSmartBedTogglePower = createTogglePowerHandler('smartBed')
const onSmartPillowTogglePower = createTogglePowerHandler('smartPillow')
const onElectricBlanketTogglePower = createTogglePowerHandler('electricBlanket')
const onWindowOpenerTogglePower = createTogglePowerHandler('windowOpener')
// 安防设备
const onCameraTogglePower = createTogglePowerHandler('camera')
const onDoorLockTogglePower = createTogglePowerHandler('doorLock')
const onSmartDoorTogglePower = createTogglePowerHandler('smartDoor')

// 底部栏属性更新事件
const onLampUpdateBrightness = createUpdateHandler('lamp', devicesStore.setBrightness)
const onCeilingLampUpdateBrightness = createUpdateHandler('ceilingLamp', devicesStore.setBrightness)
const onClockUpdateBrightness = (value: number) => {
  const device = getBottomBarDevice('clock')
  if (device) devicesStore.setDeviceExtra(device.id, { clockBrightness: value })
}
const onHeaterUpdateTargetTemp = createUpdateHandler('heater', devicesStore.setTargetTemp)
const onAirConditionerUpdateTargetTemp = createUpdateHandler('airConditioner', devicesStore.setTargetTemp)

// 加湿器特殊操作
const onHumidifierSelectLevel = (level: number) => {
  const device = getBottomBarDevice('humidifier')
  if (device) devicesStore.setHumidifierLevel(device.id, level)
}

// 对话框中的设备操作（使用 selectedDevice）
const createDialogUpdateHandler = <T>(updateFn: (id: string, value: T) => void) => (value: T) => {
  if (selectedDevice.value) updateFn(selectedDevice.value.id, value)
}
const onHumidifierDialogUpdateLevel = createDialogUpdateHandler(devicesStore.setHumidifierLevel)

// 弹窗事件处理
const handleTogglePower = () => {
  if (selectedDevice.value) devicesStore.toggleStatus(selectedDevice.value.id)
}

const handleOpenTimer = () => { showTimerDialog.value = true }
const handleOpenCountdown = () => { showCountdownDialog.value = true }
const handleOpenPowerDetail = () => { showPowerDetailDialog.value = true }

// 处理闹钟更新
const handleAlarmUpdate = (data: { enabled: boolean; hour: number; minute: number }) => {
  if (selectedDevice.value) {
    const device = devicesStore.devices.find(d => d.id === selectedDevice.value!.id)
    if (device) {
      if (device.type !== 'entertainment') return
      device.alarmEnabled = data.enabled
      device.alarmTime = `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`
      
      // 计算闹钟时间戳
      if (data.enabled) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        
        console.log('闹钟更新:', {
          设置时间: data.hour + ':' + data.minute,
          当前时间: currentHour + ':' + currentMinute,
          小时比较: data.hour > currentHour,
          分钟比较: data.minute > currentMinute
        })
        
        // 计算今天的闹钟时间
        const todayAlarm = new Date(now)
        todayAlarm.setHours(data.hour, data.minute, 0, 0)
        
        console.log('今天闹钟时间:', todayAlarm.toLocaleString())
        console.log('当前时间:', now.toLocaleString())
        
        // 如果今天的闹钟时间还没到，就用今天的；否则用明天的
        if (data.hour > currentHour || (data.hour === currentHour && data.minute > currentMinute)) {
          device.alarmTimestamp = todayAlarm.getTime()
          console.log('使用今天的时间')
        } else {
          const tomorrowAlarm = new Date(todayAlarm)
          tomorrowAlarm.setDate(tomorrowAlarm.getDate() + 1)
          device.alarmTimestamp = tomorrowAlarm.getTime()
          console.log('使用明天的时间:', tomorrowAlarm.toLocaleString())
        }
        
        const remainingMs = device.alarmTimestamp - now.getTime()
        const remainingMinutes = Math.floor(remainingMs / 1000 / 60)
        console.log('剩余分钟数:', remainingMinutes)
      } else {
        device.alarmTimestamp = undefined
      }
    }
  }
}

const handleBrightnessUpdate = createDialogUpdateHandler(devicesStore.setBrightness)
const handleColorTempUpdate = createDialogUpdateHandler(devicesStore.setColorTemp)
const handleTargetTempUpdate = createDialogUpdateHandler(devicesStore.setTargetTemp)

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
  if (selectedDevice.value) devicesStore.cancelCountdown(selectedDevice.value.id)
}

const onBackgroundClick = () => { closeAllBottomBars() }

// 卡片右键菜单
const cardCtxMenu = ref({ visible: false, x: 0, y: 0, deviceId: '' })

const openCardCtxMenu = (e: MouseEvent, device: Device) => {
  e.preventDefault()
  e.stopPropagation()
  cardCtxMenu.value = { visible: true, x: e.clientX, y: e.clientY, deviceId: device.id }
}

const closeCardCtxMenu = () => { cardCtxMenu.value.visible = false }

const moveCard = async (dir: -1 | 1) => {
  const id = cardCtxMenu.value.deviceId
  const list = filteredDevices.value
  const localIdx = list.findIndex(d => d.id === id)
  const newLocalIdx = localIdx + dir
  if (newLocalIdx < 0 || newLocalIdx >= list.length) { closeCardCtxMenu(); return }

  // 在全局 devices 数组中找到对应位置并交换
  const allDevices = [...devicesStore.devices]
  const globalIdx = allDevices.findIndex(d => d.id === id)
  const swapId = list[newLocalIdx].id
  const globalSwapIdx = allDevices.findIndex(d => d.id === swapId)
  ;[allDevices[globalIdx], allDevices[globalSwapIdx]] = [allDevices[globalSwapIdx], allDevices[globalIdx]]
  await devicesStore.reorderDevices(allDevices.map(d => d.id))
  closeCardCtxMenu()
}

const filteredDevices = computed(() => {
  const currentTab = tabsStore.tabs[tabsStore.activeIndex]
  return currentTab ? devicesStore.devices.filter(d => d.location === currentTab) : []
})

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
        class="device-card"
        @click.stop="onCardClick(device)"
        @mousedown="onCardPressStart(device)"
        @mouseup="onCardPressEnd"
        @mouseleave="onCardPressEnd"
        @touchstart="onCardPressStart(device)"
        @touchend="onCardPressEnd"
        @touchcancel="onCardPressEnd"
        @contextmenu.prevent="openCardCtxMenu($event, device)"
      >
        <div class="device-content">
          <!-- 长按提示 -->
          <div class="long-press-hint">
            <span class="hint-text">长按详情</span>
          </div>
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
          <!-- 闹钟提示 -->
          <div v-if="(device as any).alarmEnabled && alarmRemainingMap[device.id]" class="alarm-status">
            <span class="alarm-status-text">{{ formatRemaining(alarmRemainingMap[device.id] || 0) }}响铃</span>
          </div>
          <!-- 延时关闭提示 -->
          <div v-if="(device as any).delayShutdownEnabled && (device as any).delayShutdownEndTime && device.status === 'online'" class="delay-shutdown-status">
            <span class="delay-shutdown-text">{{ formatDelayShutdownRemaining((device as any).delayShutdownEndTime) }}后关闭</span>
          </div>
          <!-- 照明延时关闭提示 (浴霸) -->
          <div v-if="(device as any).lightDelayShutdownEnabled && (device as any).lightDelayShutdownEndTime && device.status === 'online'" class="delay-shutdown-status">
            <span class="delay-shutdown-text">照明{{ formatDelayShutdownRemaining((device as any).lightDelayShutdownEndTime) }}后关闭</span>
          </div>
          <!-- 电饭煲烹饪状态 -->
          <div v-if="(device as any).riceCookerCooking && (device as any).riceCookerCookingEndTime && device.status === 'online'" class="delay-shutdown-status">
            <span class="delay-shutdown-text">{{ (device as any).riceCookerModeName || '烹饪' }}中 {{ formatDelayShutdownRemaining((device as any).riceCookerCookingEndTime) }}后完成</span>
          </div>
        </div>
      </GlassCard>
      <div v-if="filteredDevices.length === 0 && tabsStore.tabs.length > 0" class="empty-hint">
        当前房间暂无设备
      </div>
    </div>

    <BottomLampBar
      :visible="lampBar.visible"
      :device="lampBar.device"
      @toggle-power="onLampTogglePower"
      @update:brightness="onLampUpdateBrightness"
    />

    <BottomCeilingLampBar
      :visible="ceilingLampBar.visible"
      :device="ceilingLampBar.device"
      @toggle-power="onCeilingLampTogglePower"
      @update:brightness="onCeilingLampUpdateBrightness"
    />

    <BottomSocketBar
      :visible="socketBar.visible"
      :device="socketBar.device"
      @toggle-power="onSocketTogglePower"
    />

    <BottomSwitchBar
      :visible="switchBar.visible"
      :device="switchBar.device"
      @toggle-power="onSwitchTogglePower"
    />

    <BottomRouterBar
      :visible="routerBar.visible"
      :device="routerBar.device"
      @toggle-power="onRouterTogglePower"
    />

    <BottomGatewayBar
      :visible="gatewayBar.visible"
      :device="gatewayBar.device"
      @toggle-power="onGatewayTogglePower"
    />

    <BottomWifiExtenderBar
      :visible="wifiExtenderBar.visible"
      :device="wifiExtenderBar.device"
      @toggle-power="onWifiExtenderTogglePower"
    />

    <BottomWashingMachineBar
      :visible="washingMachineBar.visible"
      :device="washingMachineBar.device"
      @toggle-power="onWashingMachineTogglePower"
    />

    <BottomDryerBar
      :visible="dryerBar.visible"
      :device="dryerBar.device"
      @toggle-power="onDryerTogglePower"
    />

    <BottomRobotBar
      :visible="robotVacuumBar.visible"
      :device="robotVacuumBar.device"
      @toggle-power="onRobotVacuumTogglePower"
    />

    <BottomRackBar
      :visible="rackBar.visible"
      :device="rackBar.device"
      @toggle-power="onRackTogglePower"
    />

    <BottomHumidifierBar
      :visible="humidifierBar.visible"
      :device="humidifierBar.device"
      @toggle-power="onHumidifierTogglePower"
      @select-level="onHumidifierSelectLevel"
    />

    <BottomHeaterBar
      :visible="heaterBar.visible"
      :device="heaterBar.device"
      @toggle-power="onHeaterTogglePower"
      @update:targetTemp="onHeaterUpdateTargetTemp"
    />

    <BottomAirConditionerBar
      :visible="airConditionerBar.visible"
      :device="airConditionerBar.device"
      @toggle-power="onAirConditionerTogglePower"
      @update:targetTemp="onAirConditionerUpdateTargetTemp"
    />

    <BottomFanBar
      :visible="fanBar.visible"
      :device="fanBar.device"
      @toggle-power="onFanTogglePower"
    />

    <BottomAirPurifierBar
      :visible="airPurifierBar.visible"
      :device="airPurifierBar.device"
      @toggle-power="onAirPurifierTogglePower"
    />

    <BottomDehumidifierBar
      :visible="dehumidifierBar.visible"
      :device="dehumidifierBar.device"
      @toggle-power="onDehumidifierTogglePower"
    />

    <BottomAromaDiffuserBar
      :visible="aromaDiffuserBar.visible"
      :device="aromaDiffuserBar.device"
      @toggle-power="onAromaDiffuserTogglePower"
      @quick-aroma="onAromaDiffuserQuickAroma"
    />

    <!-- 浴室设备底部栏 -->
    <BottomToiletBar
      :visible="toiletBar.visible"
      :device="toiletBar.device"
      @toggle-power="onToiletTogglePower"
    />

    <BottomWaterHeaterBar
      :visible="waterHeaterBar.visible"
      :device="waterHeaterBar.device"
      @toggle-power="onWaterHeaterTogglePower"
    />

    <BottomYubaBar
      :visible="yubaBar.visible"
      :device="yubaBar.device"
      @toggle-power="onYubaTogglePower"
    />

    <!-- 娱乐设备底部栏 -->
    <BottomTvBar
      :visible="tvBar.visible"
      :device="tvBar.device"
      @toggle-power="onTvTogglePower"
    />

    <BottomSpeakerBar
      :visible="speakerBar.visible"
      :device="speakerBar.device"
      @toggle-power="onSpeakerTogglePower"
    />

    <BottomProjectorBar
      :visible="projectorBar.visible"
      :device="projectorBar.device"
      @toggle-power="onProjectorTogglePower"
    />

    <BottomClockBar
      :visible="clockBar.visible"
      :device="clockBar.device"
      :brightness="(clockBar.device as any)?.clockBrightness ?? 80"
      @toggle-power="onClockTogglePower"
      @update:brightness="onClockUpdateBrightness"
    />

    <!-- 厨房设备底部栏 -->
    <BottomRiceCookerBar
      :visible="riceCookerBar.visible"
      :device="riceCookerBar.device"
      @toggle-power="onRiceCookerTogglePower"
      @open-mode-selector="onRiceCookerOpenModeSelector"
      @open-keep-warm-settings="onRiceCookerOpenKeepWarmSettings"
    />

    <BottomInductionCookerBar
      :visible="inductionCookerBar.visible"
      :device="inductionCookerBar.device"
      @toggle-power="onInductionCookerTogglePower"
    />

    <BottomRangeHoodBar
      :visible="rangeHoodBar.visible"
      :device="rangeHoodBar.device"
      @toggle-power="onRangeHoodTogglePower"
    />

    <BottomElectricKettleBar
      :visible="electricKettleBar.visible"
      :device="electricKettleBar.device"
      @toggle-power="onElectricKettleTogglePower"
    />

    <BottomAirFryerBar
      :visible="airFryerBar.visible"
      :device="airFryerBar.device"
      @toggle-power="onAirFryerTogglePower"
    />

    <WaterDispenserBottomSheet
      :visible="waterDispenserBar.visible"
      :device="waterDispenserBar.device"
      @toggle-power="onWaterDispenserTogglePower"
    />

    <!-- 个人设备底部栏 -->
    <BottomSmartBedBar
      :visible="smartBedBar.visible"
      :device="smartBedBar.device"
      @toggle-power="onSmartBedTogglePower"
    />

    <BottomSmartPillowBar
      :visible="smartPillowBar.visible"
      :device="smartPillowBar.device"
      @toggle-power="onSmartPillowTogglePower"
    />

    <BottomElectricBlanketBar
      :visible="electricBlanketBar.visible"
      :device="electricBlanketBar.device"
      @toggle-power="onElectricBlanketTogglePower"
    />

    <BottomWindowOpenerBar
      :visible="windowOpenerBar.visible"
      :device="windowOpenerBar.device"
      @toggle-power="onWindowOpenerTogglePower"
    />

    <!-- 安防设备底部栏 -->
    <BottomCameraBar
      :visible="cameraBar.visible"
      :device="cameraBar.device"
      @toggle-power="onCameraTogglePower"
    />

    <BottomDoorLockBar
      :visible="doorLockBar.visible"
      :device="doorLockBar.device"
      @toggle-power="onDoorLockTogglePower"
    />

    <BottomSmartDoorBar
      :visible="smartDoorBar.visible"
      :device="smartDoorBar.device"
      @toggle-power="onSmartDoorTogglePower"
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

      <AirPurifierDialog
        v-model:visible="showAirPurifierDialog"
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

      <AromaDiffuserDialog
        v-model:visible="showAromaDiffuserDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <!-- 浴室设备对话框 -->
      <ToiletDialog
        v-model:visible="showToiletDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <WaterHeaterDialog
        v-model:visible="showWaterHeaterDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <YubaDialog
        v-model:visible="showYubaDialog"
        v-model:windMode="yubaWindMode"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <!-- 娱乐设备对话框 -->
      <TvDialog
        v-model:visible="showTvDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <SpeakerDialog
        v-model:visible="showSpeakerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <ProjectorDialog
        v-model:visible="showProjectorDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <ClockDialog
        v-model:visible="showClockDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @update-alarm="handleAlarmUpdate"
      />

      <!-- 厨房设备对话框 -->
      <RiceCookerDialog
        :visible="showRiceCookerDialog"
        :device="selectedDevice"
        @update:visible="(v: boolean) => { showRiceCookerDialog = v }"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
        @start-cooking="handleRiceCookerStartCooking"
        @cancel-cooking="handleRiceCookerCancelCooking"
      />

      <InductionCookerDialog
        v-model:visible="showInductionCookerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <RangeHoodDialog
        v-model:visible="showRangeHoodDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <ElectricKettleDialog
        v-model:visible="showElectricKettleDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <AirFryerDialog
        v-model:visible="showAirFryerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <WaterDispenserDialog
        v-model:visible="showWaterDispenserDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <!-- 个人设备对话框 -->
      <SmartBedDialog
        v-model:visible="showSmartBedDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <SmartPillowDialog
        v-model:visible="showSmartPillowDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <ElectricBlanketDialog
        v-model:visible="showElectricBlanketDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <WindowOpenerDialog
        v-model:visible="showWindowOpenerDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
        @open-timer="handleOpenTimer"
      />

      <!-- 安防设备对话框 -->
      <CameraDialog
        v-model:visible="showCameraDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <DoorLockDialog
        v-model:visible="showDoorLockDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
      />

      <SmartDoorDialog
        v-model:visible="showSmartDoorDialog"
        :device="selectedDevice"
        @toggle-power="handleTogglePower"
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

    <!-- 卡片右键菜单 -->
    <teleport to="body">
      <div v-if="cardCtxMenu.visible" class="card-ctx-mask" @click="closeCardCtxMenu" @contextmenu.prevent="closeCardCtxMenu">
        <div class="card-ctx-menu" :style="{ left: cardCtxMenu.x + 'px', top: cardCtxMenu.y + 'px' }" @click.stop>
          <div class="card-ctx-item" :class="{ disabled: filteredDevices.findIndex(d => d.id === cardCtxMenu.deviceId) === 0 }" @click="moveCard(-1)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M10 6.5H3M6.5 3L3 6.5L6.5 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            左移
          </div>
          <div class="card-ctx-item" :class="{ disabled: filteredDevices.findIndex(d => d.id === cardCtxMenu.deviceId) === filteredDevices.length - 1 }" @click="moveCard(1)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 6.5H10M6.5 10L10 6.5L6.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            右移
          </div>
        </div>
      </div>
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
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)"');
}

.device-status.online {
  background: v-bind('themeStore.currentTheme?.isDark ? "linear-gradient(135deg, rgba(74, 222, 128, 0.4) 0%, rgba(34, 197, 94, 0.3) 100%)" : "linear-gradient(135deg, rgba(74, 222, 128, 0.8) 0%, rgba(34, 197, 94, 0.7) 100%)"');
  color: v-bind('themeStore.currentTheme?.isDark ? "#a7f3d0" : "#065f46"');
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

.device-status.offline {
  background: v-bind('themeStore.currentTheme?.isDark ? "linear-gradient(135deg, rgba(248, 113, 113, 0.4) 0%, rgba(239, 68, 68, 0.3) 100%)" : "linear-gradient(135deg, rgba(248, 113, 113, 0.8) 0%, rgba(239, 68, 68, 0.7) 100%)"');
  color: v-bind('themeStore.currentTheme?.isDark ? "#fecaca" : "#7f1d1d"');
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
}

.delay-shutdown-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(16px) saturate(150%);
  background: var(--card-badge-bg);
  border: 1px solid var(--card-badge-border);
  color: var(--card-badge-color);
  box-shadow: var(--card-badge-shadow);
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
  color: v-bind('themeStore.textColorSecondary');
  font-size: 15px;
  font-weight: 400;
  padding: 40px;
  text-align: center;
  letter-spacing: 1px;
}

.timer-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(16px) saturate(150%);
  background: var(--card-badge-bg);
  border: 1px solid var(--card-badge-border);
  color: var(--card-badge-color);
  box-shadow: var(--card-badge-shadow);
}

.timer-off-status { background: var(--card-badge-bg); }
.timer-on-status { background: var(--card-badge-bg); }
.timer-status-text { font-weight: 600; }

.alarm-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(16px) saturate(150%);
  background: var(--card-badge-bg);
  border: 1px solid var(--card-badge-border);
  color: var(--card-badge-color);
  box-shadow: var(--card-badge-shadow);
}
.alarm-status-text { font-weight: 600; }

/* 设备卡片 */
.device-card {
  position: relative;
}

.device-card:hover .long-press-hint {
  opacity: 0.8;
}

/* 长按提示 */
.long-press-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  background: transparent;
  backdrop-filter: none;
  border-radius: 0;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 10px;
  font-weight: 500;
  transition: opacity 0.3s ease;
  cursor: pointer;
  z-index: 1;
  user-select: none;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.hint-text {
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.card-ctx-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.card-ctx-menu {
  position: fixed;
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(10,30,40,0.92)" : "rgba(255,255,255,0.92)"');
  backdrop-filter: blur(16px);
  border: 1px solid v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.12)" : "rgba(59,130,246,0.2)"');
  border-radius: 10px;
  padding: 4px;
  min-width: 100px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 2001;
}

.card-ctx-item {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 7px;
  cursor: pointer;
  color: v-bind('themeStore.textColor');
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-ctx-item:hover {
  background: v-bind('themeStore.currentTheme?.isDark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.1)"');
}

.card-ctx-item.disabled {
  opacity: 0.35;
  pointer-events: none;
}
</style>
