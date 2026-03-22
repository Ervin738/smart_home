/**
 * 底部控制栏管理 Composable
 * 
 * 功能：统一管理所有设备的底部控制栏显示状态
 * 
 * 使用场景：
 * - StandardMode.vue 等页面级组件
 * - 需要管理多个设备底部栏的场景
 * 
 * 特点：
 * - 统一管理 37 种设备类型的底部栏状态
 * - 自动识别设备类型并切换显示
 * - 提供关闭所有底部栏的便捷方法
 * 
 * @example
 * ```typescript
 * const { bottomBars, closeAll, toggle, getBar } = useBottomBar()
 * 
 * // 切换设备底部栏
 * toggle(device)
 * 
 * // 获取特定设备的底部栏状态
 * const lampBar = computed(() => getBar('lamp'))
 * 
 * // 关闭所有底部栏
 * closeAll()
 * ```
 */
import { ref } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

// 设备类型映射键
type BottomBarKey = 
  // 灯光设备
  | 'lamp'
  | 'ceilingLamp'
  // 开关设备
  | 'socket'
  | 'switch'
  // 网络设备
  | 'router'
  | 'gateway'
  | 'wifiExtender'
  // 清洁设备
  | 'washingMachine'
  | 'dryer'
  | 'robotVacuum'
  | 'rack'
  // 环境设备
  | 'humidifier'
  | 'heater'
  | 'airConditioner'
  | 'fan'
  | 'airPurifier'
  | 'dehumidifier'
  | 'aromaDiffuser'
  // 浴室设备
  | 'toilet'
  | 'waterHeater'
  | 'yuba'
  // 娱乐设备
  | 'tv'
  | 'speaker'
  | 'projector'
  | 'clock'
  // 厨房设备
  | 'riceCooker'
  | 'inductionCooker'
  | 'rangeHood'
  | 'electricKettle'
  | 'airFryer'
  | 'waterDispenser'
  // 个人设备
  | 'smartBed'
  | 'smartPillow'
  | 'electricBlanket'
  | 'windowOpener'
  // 安防设备
  | 'camera'
  | 'doorLock'
  | 'smartDoor'

// 设备类型到底部栏键的映射
const deviceTypeToBarKey = (device: Device): BottomBarKey | null => {
  // 灯光设备
  if (device.type === 'light' && device.lightType === 'table-lamp') return 'lamp'
  if (device.type === 'light' && device.lightType === 'ceiling-lamp') return 'ceilingLamp'
  
  // 开关设备
  if (device.type === 'switch' && device.switchType === 'socket') return 'socket'
  if (device.type === 'switch' && device.switchType === 'switch') return 'switch'
  
  // 网络设备
  if (device.type === 'network' && device.networkType === 'router') return 'router'
  if (device.type === 'network' && device.networkType === 'gateway') return 'gateway'
  if (device.type === 'network' && device.networkType === 'wifi-extender') return 'wifiExtender'
  
  // 清洁设备
  if (device.type === 'cleaner' && device.cleanerType === 'washing-machine') return 'washingMachine'
  if (device.type === 'cleaner' && device.cleanerType === 'dryer') return 'dryer'
  if (device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') return 'robotVacuum'
  if (device.type === 'cleaner' && device.cleanerType === 'clothes-rack') return 'rack'
  
  // 环境设备
  if (device.type === 'environment' && device.environmentType === 'humidifier') return 'humidifier'
  if (device.type === 'environment' && device.environmentType === 'heater') return 'heater'
  if (device.type === 'environment' && device.environmentType === 'air-conditioner') return 'airConditioner'
  if (device.type === 'environment' && device.environmentType === 'fan') return 'fan'
  if (device.type === 'environment' && device.environmentType === 'air-purifier') return 'airPurifier'
  if (device.type === 'environment' && device.environmentType === 'dehumidifier') return 'dehumidifier'
  if (device.type === 'environment' && device.environmentType === 'aroma-diffuser') return 'aromaDiffuser'
  
  // 浴室设备
  if (device.type === 'bathroom' && device.bathroomType === 'toilet') return 'toilet'
  if (device.type === 'bathroom' && device.bathroomType === 'water-heater') return 'waterHeater'
  if (device.type === 'bathroom' && device.bathroomType === 'yuba') return 'yuba'
  
  // 娱乐设备
  if (device.type === 'entertainment' && device.entertainmentType === 'tv') return 'tv'
  if (device.type === 'entertainment' && device.entertainmentType === 'speaker') return 'speaker'
  if (device.type === 'entertainment' && device.entertainmentType === 'projector') return 'projector'
  if (device.type === 'entertainment' && device.entertainmentType === 'clock') return 'clock'
  
  // 厨房设备
  if (device.type === 'kitchen' && device.kitchenType === 'rice-cooker') return 'riceCooker'
  if (device.type === 'kitchen' && device.kitchenType === 'induction-cooker') return 'inductionCooker'
  if (device.type === 'kitchen' && device.kitchenType === 'range-hood') return 'rangeHood'
  if (device.type === 'kitchen' && device.kitchenType === 'electric-kettle') return 'electricKettle'
  if (device.type === 'kitchen' && device.kitchenType === 'air-fryer') return 'airFryer'
  if (device.type === 'kitchen' && device.kitchenType === 'water-dispenser') return 'waterDispenser'
  
  // 个人设备
  if (device.type === 'personal' && device.personalType === 'smart-bed') return 'smartBed'
  if (device.type === 'personal' && device.personalType === 'smart-pillow') return 'smartPillow'
  if (device.type === 'personal' && device.personalType === 'electric-blanket') return 'electricBlanket'
  if (device.type === 'personal' && device.personalType === 'window-opener') return 'windowOpener'
  
  // 安防设备
  if (device.type === 'security' && device.securityType === 'camera') return 'camera'
  if (device.type === 'security' && device.securityType === 'door-lock') return 'doorLock'
  if (device.type === 'security' && device.securityType === 'smart-door') return 'smartDoor'
  
  return null
}

export function useBottomBar() {
  // 统一管理所有底部栏的显示状态和设备
  const bottomBars = ref<Record<BottomBarKey, { visible: boolean; device: Device | null }>>({
    // 灯光设备
    lamp: { visible: false, device: null },
    ceilingLamp: { visible: false, device: null },
    // 开关设备
    socket: { visible: false, device: null },
    switch: { visible: false, device: null },
    // 网络设备
    router: { visible: false, device: null },
    gateway: { visible: false, device: null },
    wifiExtender: { visible: false, device: null },
    // 清洁设备
    washingMachine: { visible: false, device: null },
    dryer: { visible: false, device: null },
    robotVacuum: { visible: false, device: null },
    rack: { visible: false, device: null },
    // 环境设备
    humidifier: { visible: false, device: null },
    heater: { visible: false, device: null },
    airConditioner: { visible: false, device: null },
    fan: { visible: false, device: null },
    airPurifier: { visible: false, device: null },
    dehumidifier: { visible: false, device: null },
    aromaDiffuser: { visible: false, device: null },
    // 浴室设备
    toilet: { visible: false, device: null },
    waterHeater: { visible: false, device: null },
    yuba: { visible: false, device: null },
    // 娱乐设备
    tv: { visible: false, device: null },
    speaker: { visible: false, device: null },
    projector: { visible: false, device: null },
    clock: { visible: false, device: null },
    // 厨房设备
    riceCooker: { visible: false, device: null },
    inductionCooker: { visible: false, device: null },
    rangeHood: { visible: false, device: null },
    electricKettle: { visible: false, device: null },
    airFryer: { visible: false, device: null },
    waterDispenser: { visible: false, device: null },
    // 个人设备
    smartBed: { visible: false, device: null },
    smartPillow: { visible: false, device: null },
    electricBlanket: { visible: false, device: null },
    windowOpener: { visible: false, device: null },
    // 安防设备
    camera: { visible: false, device: null },
    doorLock: { visible: false, device: null },
    smartDoor: { visible: false, device: null }
  })

  // 关闭所有底部栏
  const closeAll = () => {
    Object.keys(bottomBars.value).forEach(key => {
      const barKey = key as BottomBarKey
      bottomBars.value[barKey].visible = false
      bottomBars.value[barKey].device = null
    })
  }

  // 切换指定设备的底部栏
  const toggle = (device: Device) => {
    const barKey = deviceTypeToBarKey(device)
    if (!barKey) {
      console.log('Device type not handled:', device.type)
      return
    }

    // 如果当前设备的底部栏已显示，则关闭
    if (bottomBars.value[barKey].device?.id === device.id) {
      bottomBars.value[barKey].visible = false
      bottomBars.value[barKey].device = null
    } else {
      // 否则关闭所有底部栏，然后显示当前设备的底部栏
      closeAll()
      bottomBars.value[barKey].device = device
      bottomBars.value[barKey].visible = true
    }
  }

  // 获取指定类型的底部栏状态
  const getBar = (key: BottomBarKey) => {
    return bottomBars.value[key]
  }

  return {
    bottomBars,
    closeAll,
    toggle,
    getBar
  }
}
