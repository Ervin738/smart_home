/**
 * 设备控制相关的组合式函数
 * 功能：提供设备控制的通用逻辑，如模式选择、控制按钮状态等
 */
import { ref, computed, type Ref } from 'vue'
import type { Device } from '../stores/devices'

/**
 * 设备模式和控制状态管理
 */
export function useDeviceState(device: Ref<Device | null>) {
  // 模式索引映射（每个设备独立）
  const activeModeIndexMap = ref<Record<string, number>>({})
  // 控制按钮索引映射
  const activeControlIndexMap = ref<Record<string, number>>({})
  // 洗衣机清洗状态映射
  const washingActiveMap = ref<Record<string, boolean>>({})

  // 当前设备的激活模式索引
  const activeModeIndex = computed(() => {
    if (!device.value) return -1
    return activeModeIndexMap.value[device.value.id] ?? -1
  })

  // 当前设备的激活控制索引
  const activeControlIndex = computed(() => {
    if (!device.value) return -1
    return activeControlIndexMap.value[device.value.id] ?? -1
  })

  // 当前设备是否正在清洗
  const isWashingActive = computed(() => {
    if (!device.value) return false
    return washingActiveMap.value[device.value.id] ?? false
  })

  // 是否可以开始清洗（需要电源开启且已选择模式）
  const canStartWash = computed(() => {
    if (!device.value) return false
    const hasModeSelected = (activeModeIndexMap.value[device.value.id] ?? -1) !== -1
    const isPowerOn = device.value.status === 'online'
    return hasModeSelected && isPowerOn
  })

  // 设置模式索引
  const setModeIndex = (deviceId: string, index: number) => {
    activeModeIndexMap.value[deviceId] = index
  }

  // 设置控制索引
  const setControlIndex = (deviceId: string, index: number) => {
    activeControlIndexMap.value[deviceId] = index
  }

  // 切换清洗状态
  const toggleWashing = (deviceId: string) => {
    washingActiveMap.value[deviceId] = !washingActiveMap.value[deviceId]
  }

  return {
    activeModeIndexMap,
    activeControlIndexMap,
    washingActiveMap,
    activeModeIndex,
    activeControlIndex,
    isWashingActive,
    canStartWash,
    setModeIndex,
    setControlIndex,
    toggleWashing
  }
}

/**
 * 扫地机器人吸力和水量控制
 */
export function useRobotControl() {
  const suctionLevel = ref(0) // 0-2: 一档、二档、三档
  const waterLevel = ref(0) // 0-2: 少、中、多

  const suctionLevels = ['一档', '二档', '三档']
  const waterLevels = ['少', '中', '多']

  // 调整吸力档位
  const adjustSuction = (delta: number) => {
    suctionLevel.value = Math.max(0, Math.min(2, suctionLevel.value + delta))
  }

  // 调整水量档位
  const adjustWater = (delta: number) => {
    waterLevel.value = Math.max(0, Math.min(2, waterLevel.value + delta))
  }

  return {
    suctionLevel,
    waterLevel,
    suctionLevels,
    waterLevels,
    adjustSuction,
    adjustWater
  }
}

/**
 * 晾衣架控制
 */
export function useClothesRackControl() {
  const lighting = ref(false)
  const drying = ref(false)
  const airDry = ref(false)
  const sterilize = ref(false)
  const moving = ref<'up' | 'down' | 'stop' | null>(null)

  // 重置所有状态
  const reset = () => {
    lighting.value = false
    drying.value = false
    airDry.value = false
    sterilize.value = false
    moving.value = null
  }

  return {
    lighting,
    drying,
    airDry,
    sterilize,
    moving,
    reset
  }
}
