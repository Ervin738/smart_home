/**
 * 滑动控制相关的组合式函数
 * 
 * 功能：提供通用的滑动交互逻辑
 * 
 * 使用场景：
 * - 任何需要垂直滑动控制的组件
 * - 设备对话框中的滑动调节（亮度、温度、音量等）
 * - 可复用的 UI 交互逻辑
 * 
 * 特点：
 * - 支持鼠标拖拽和触摸滑动
 * - 支持鼠标滚轮控制
 * - 可配置的触发阈值
 * - 防抖处理，避免频繁触发
 * 
 * @example
 * ```typescript
 * const { isDragging, onDragStart, onDragMove, onDragEnd, onWheel } = useVerticalSlider(
 *   (delta) => {
 *     // delta: 1 表示向上，-1 表示向下
 *     brightness.value = Math.max(0, Math.min(100, brightness.value + delta * 5))
 *   }
 * )
 * 
 * // 在模板中使用
 * <div
 *   @mousedown="onDragStart"
 *   @mousemove="onDragMove"
 *   @mouseup="onDragEnd"
 *   @wheel="onWheel"
 * >
 * ```
 */
import { ref } from 'vue'
import { SLIDER_CONFIG } from '@/constants/uiConfig'

/**
 * 垂直滑动控制
 */
export function useVerticalSlider(onAdjust: (delta: number) => void) {
  const startY = ref(0)
  const isDragging = ref(false)

  const onDragStart = (e: MouseEvent | TouchEvent) => {
    isDragging.value = true
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
    startY.value = clientY || 0
  }

  const onDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
    const diff = startY.value - (clientY || 0)

    if (Math.abs(diff) > SLIDER_CONFIG.DRAG_THRESHOLD) {
      onAdjust(diff > 0 ? 1 : -1)
      startY.value = clientY || 0
    }
  }

  const onDragEnd = () => {
    isDragging.value = false
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (Math.abs(e.deltaY) > SLIDER_CONFIG.WHEEL_THRESHOLD) {
      onAdjust(e.deltaY < 0 ? 1 : -1)
    }
  }

  return {
    startY,
    isDragging,
    onDragStart,
    onDragMove,
    onDragEnd,
    onWheel
  }
}
