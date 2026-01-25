/**
 * 名称溢出处理组合式函数
 * 功能：检测设备名称是否溢出，如果溢出则添加滚动动画效果
 */
import { ref } from 'vue'

export function useNameOverflow() {
  const overflowNames = ref<Set<string>>(new Set())

  const checkNameOverflow = (el: HTMLElement | null, id: string) => {
    if (!el) return
    requestAnimationFrame(() => {
      const nameEl = el.querySelector('.name-text') as HTMLElement
      if (!nameEl) return
      const isOverflow = nameEl.scrollWidth > el.clientWidth
      if (isOverflow) {
        overflowNames.value.add(id)
      } else {
        overflowNames.value.delete(id)
      }
    })
  }

  const isNameOverflow = (id: string) => overflowNames.value.has(id)

  return { overflowNames, checkNameOverflow, isNameOverflow }
}
