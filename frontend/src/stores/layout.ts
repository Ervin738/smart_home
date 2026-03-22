import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'layout-preference'

export const useLayoutStore = defineStore('layout', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const useSidebar = ref(saved !== null ? saved === 'true' : false)

  function toggle() {
    useSidebar.value = !useSidebar.value
    localStorage.setItem(STORAGE_KEY, String(useSidebar.value))
  }

  return { useSidebar, toggle }
})
