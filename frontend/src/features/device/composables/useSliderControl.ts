/**
 * 滑动控制相关的组合式函数
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
