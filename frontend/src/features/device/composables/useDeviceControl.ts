/**
 * 设备控制相关的组合式函数
 * 
 * 功能：提供特定设备类型的控制逻辑和状态管理
 * 
 * 使用场景：
 * - 设备对话框组件（ClothesRackDialog 等）
 * - 需要特定设备控制逻辑的组件
 * 
 * 包含的控制器：
 * - useClothesRackControl: 晾衣架的照明、烘干、风干、消毒等控制
 * 
 * @example
 * ```typescript
 * // 晾衣架控制
 * const { lighting, drying, airDry, sterilize, moving, reset } = useClothesRackControl()
 * ```
 */
import { ref } from 'vue'

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
