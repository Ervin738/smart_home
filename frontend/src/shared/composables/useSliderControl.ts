/**
 * 滑动控制相关的组合式函数
 * 功能：提供滑动和滚轮控制的通用逻辑
 */
import { ref } from 'vue'
import { SLIDER_CONFIG } from '@/constants/uiConfig'

/**
 * 垂直滑动控制
 * @param onAdjust 调整回调函数，参数为调整量（1 或 -1）
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

/**
 * 水平滑动控制
 * @param onAdjust 调整回调函数，参数为调整量（1 或 -1）
 */
export function useHorizontalSlider(onAdjust: (delta: number) => void) {
  const startX = ref(0)
  const isDragging = ref(false)

  const onDragStart = (e: MouseEvent | TouchEvent) => {
    isDragging.value = true
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    startX.value = clientX || 0
  }

  const onDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const diff = (clientX || 0) - startX.value

    if (Math.abs(diff) > SLIDER_CONFIG.DRAG_THRESHOLD) {
      onAdjust(diff > 0 ? 1 : -1)
      startX.value = clientX || 0
    }
  }

  const onDragEnd = () => {
    isDragging.value = false
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (Math.abs(e.deltaX) > SLIDER_CONFIG.WHEEL_THRESHOLD) {
      onAdjust(e.deltaX > 0 ? 1 : -1)
    }
  }

  return {
    startX,
    isDragging,
    onDragStart,
    onDragMove,
    onDragEnd,
    onWheel
  }
}
