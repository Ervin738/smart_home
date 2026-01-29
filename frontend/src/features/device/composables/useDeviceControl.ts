/**
 * 设备控制相关的组合式函数
 */
import { ref } from 'vue'

/**
 * 扫地机器人吸力和水量控制
 */
export function useRobotControl() {
  const suctionLevel = ref(0) // 0-2: 一档、二档、三档
  const waterLevel = ref(0) // 0-2: 少、中、多

  const suctionLevels = ['一档', '二档', '三档']
  const waterLevels = ['少', '中', '多']

  const adjustSuction = (delta: number) => {
    suctionLevel.value = Math.max(0, Math.min(2, suctionLevel.value + delta))
  }

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
