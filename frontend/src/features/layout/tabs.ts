/**
 * 房间标签页状态管理 Store
 * 功能：管理房间标签的增删改查和当前激活的房间
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<string[]>([])
  const activeIndex = ref(0)

  const addTab = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName && !tabs.value.includes(trimmedName)) {
      tabs.value.push(trimmedName)
      return true
    }
    return false
  }

  const removeTab = (index: number) => {
    tabs.value.splice(index, 1)
    if (activeIndex.value >= tabs.value.length) {
      activeIndex.value = Math.max(0, tabs.value.length - 1)
    } else if (activeIndex.value > index) {
      activeIndex.value--
    }
  }

  const setActiveIndex = (index: number) => {
    activeIndex.value = index
  }

  return {
    tabs,
    activeIndex,
    addTab,
    removeTab,
    setActiveIndex
  }
})
