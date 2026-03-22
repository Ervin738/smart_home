/**
 * 应用入口文件
 * 初始化 Vue 应用、Pinia 状态管理、Element Plus UI 库、路由
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { watch } from 'vue'

// 按需导入 Element Plus 样式和组件
import { setupElementPlus } from '@/plugins/element-plus'

import App from './App.vue'
import router from './router'
import '@/style.css'
import { useThemeStore } from '@/stores/theme'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
setupElementPlus(app)

app.mount('#app')

// 监听主题变化，切换 body 的 class
const themeStore = useThemeStore()
watch(
  () => themeStore.currentTheme?.isDark,
  (isDark) => {
    if (isDark) {
      document.body.classList.remove('theme-light')
    } else {
      document.body.classList.add('theme-light')
    }
  },
  { immediate: true }
)
