import { ref } from 'vue'

/**
 * 扫地机器人控制组合式函数
 * 提供吸力和水量的三档调节功能
 */
export function useRobotControl() {
  const suctionLevel = ref(1) // 吸力档位：0-低，1-中，2-高
  const waterLevel = ref(1)   // 水量档位：0-低，1-中，2-高

  const suctionLevels = ['低', '中', '高']
  const waterLevels = ['低', '中', '高']

  const adjustSuction = (delta: number) => {
    const newLevel = suctionLevel.value + delta
    if (newLevel >= 0 && newLevel <= 2) {
      suctionLevel.value = newLevel
    }
  }

  const adjustWater = (delta: number) => {
    const newLevel = waterLevel.value + delta
    if (newLevel >= 0 && newLevel <= 2) {
      waterLevel.value = newLevel
    }
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
