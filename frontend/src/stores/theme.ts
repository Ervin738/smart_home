import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  gradientStops: string[]
}

export interface ThemeConfig {
  name: string
  displayName: string
  colors: ThemeColors
  isDark: boolean // 是否为暗色主题
}

export const useThemeStore = defineStore('theme', () => {
  // 定义2个主题
  const themes: Record<string, ThemeConfig> = {
    'deep-ocean-abyss': {
      name: 'deep-ocean-abyss',
      displayName: '深海秘境',
      isDark: true,
      colors: {
        primary: '#001219',
        secondary: '#005f73',
        accent: '#0a9396',
        gradientStops: ['#001219', '#005f73', '#0a9396', '#001219']
      }
    },
    'sky-breeze': {
      name: 'sky-breeze',
      displayName: '天空微风',
      isDark: false,
      colors: {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#2563eb',
        gradientStops: ['#3b82f6', '#60a5fa', '#7dd3fc', '#60a5fa', '#3b82f6']
      }
    }
  }

  const currentThemeName = ref<string>('deep-ocean-abyss')
  
  const currentTheme = computed(() => themes[currentThemeName.value])
  
  // 根据主题返回文字颜色
  const textColor = computed(() => currentTheme.value?.isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 64, 175, 0.95)')
  const textColorSecondary = computed(() => currentTheme.value?.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 64, 175, 0.7)')
  const textColorHover = computed(() => currentTheme.value?.isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 64, 175, 0.85)')
  const fontWeight = computed(() => currentTheme.value?.isDark ? '600' : '700')
  
  // 玻璃态效果的通用样式
  const glassEffect = computed(() => {
    if (currentTheme.value?.isDark) {
      return {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)',
        backdropFilter: 'blur(30px) saturate(120%)',
        border: '2px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.05)'
      }
    } else {
      return {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%)',
        backdropFilter: 'blur(30px) saturate(120%)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.05)'
      }
    }
  })

  function setTheme(themeName: string) {
    if (themes[themeName]) {
      currentThemeName.value = themeName
      applyThemeToBody()
    }
  }

  function applyThemeToBody() {
    const theme = currentTheme.value
    if (theme) {
      document.body.style.background = `linear-gradient(135deg, ${theme.colors.gradientStops.join(', ')})`
      
      // 根据主题设置弹窗背景颜色变量
      if (theme.isDark) {
        // 深海秘境主题 - 使用深绿色系
        if (theme.name === 'deep-ocean-abyss') {
          document.body.style.setProperty('--dialog-bg-1', 'rgba(0, 95, 115, 0.85)')
          document.body.style.setProperty('--dialog-bg-2', 'rgba(10, 147, 150, 0.8)')
          document.body.style.setProperty('--dialog-bg-3', 'rgba(20, 184, 166, 0.85)')
          
          // 底部控制栏背景色 - 使用更亮的青绿色
          document.body.style.setProperty('--bottom-bar-bg-1', 'rgba(0, 95, 115, 0.95)')
          document.body.style.setProperty('--bottom-bar-bg-2', 'rgba(10, 147, 150, 0.95)')
          document.body.style.setProperty('--bottom-bar-bg-3', 'rgba(20, 184, 166, 0.95)')
          
          // 底部控制栏按钮激活状态 - 使用主题的accent色
          document.body.style.setProperty('--bottom-bar-active-bg', 'rgba(6, 182, 212, 0.7)')
          
          // 底部控制栏按钮未激活状态 - 使用浅色
          document.body.style.setProperty('--bottom-bar-inactive-bg', 'rgba(10, 147, 150, 0.2)')
          
          // 对话框按钮激活状态 - 使用明显的青绿色系（与底部栏一致）
          document.body.style.setProperty('--dialog-btn-active-bg-1', 'rgba(6, 182, 212, 0.7)')
          document.body.style.setProperty('--dialog-btn-active-bg-2', 'rgba(20, 184, 166, 0.6)')
          document.body.style.setProperty('--dialog-btn-active-border', 'rgba(6, 182, 212, 0.5)')
          document.body.style.setProperty('--dialog-btn-active-shadow', 'rgba(6, 182, 212, 0.4)')
          
          // 对话框按钮未激活状态 - 使用浅色
          document.body.style.setProperty('--dialog-btn-inactive-bg', 'rgba(10, 147, 150, 0.15)')
          document.body.style.setProperty('--dialog-btn-inactive-border', 'rgba(10, 147, 150, 0.25)')
          
          document.body.style.setProperty('--dialog-btn-active-light-bg-1', 'rgba(6, 182, 212, 0.6)')
          document.body.style.setProperty('--dialog-btn-active-light-bg-2', 'rgba(20, 184, 166, 0.5)')
          document.body.style.setProperty('--dialog-btn-active-light-border', 'rgba(6, 182, 212, 0.4)')
          document.body.style.setProperty('--dialog-btn-active-light-shadow', 'rgba(6, 182, 212, 0.3)')
          
          // 滑块激活状态 - 使用明亮的青绿色渐变
          document.body.style.setProperty('--slider-active-color-1', 'rgba(6, 182, 212, 0.9)')
          document.body.style.setProperty('--slider-active-color-2', 'rgba(20, 184, 166, 0.95)')
          document.body.style.setProperty('--slider-active-color-3', 'rgba(45, 212, 191, 1)')
        } else {
          // 其他暗色主题 - 使用默认蓝色系
          document.body.style.setProperty('--dialog-bg-1', 'rgba(26, 42, 78, 0.85)')
          document.body.style.setProperty('--dialog-bg-2', 'rgba(42, 58, 90, 0.8)')
          document.body.style.setProperty('--dialog-bg-3', 'rgba(58, 90, 122, 0.85)')
          
          document.body.style.setProperty('--bottom-bar-bg-1', 'rgba(30, 40, 60, 0.95)')
          document.body.style.setProperty('--bottom-bar-bg-2', 'rgba(40, 55, 80, 0.95)')
          document.body.style.setProperty('--bottom-bar-bg-3', 'rgba(50, 70, 100, 0.95)')
          
          document.body.style.setProperty('--bottom-bar-active-bg', 'rgba(59, 130, 246, 0.7)')
          
          document.body.style.setProperty('--bottom-bar-inactive-bg', 'rgba(59, 130, 246, 0.2)')
          
          document.body.style.setProperty('--dialog-btn-active-bg-1', 'rgba(59, 130, 246, 0.7)')
          document.body.style.setProperty('--dialog-btn-active-bg-2', 'rgba(79, 172, 254, 0.6)')
          document.body.style.setProperty('--dialog-btn-active-border', 'rgba(59, 130, 246, 0.5)')
          document.body.style.setProperty('--dialog-btn-active-shadow', 'rgba(59, 130, 246, 0.4)')
          
          document.body.style.setProperty('--dialog-btn-inactive-bg', 'rgba(59, 130, 246, 0.15)')
          document.body.style.setProperty('--dialog-btn-inactive-border', 'rgba(59, 130, 246, 0.25)')
          
          document.body.style.setProperty('--dialog-btn-active-light-bg-1', 'rgba(59, 130, 246, 0.6)')
          document.body.style.setProperty('--dialog-btn-active-light-bg-2', 'rgba(79, 172, 254, 0.5)')
          document.body.style.setProperty('--dialog-btn-active-light-border', 'rgba(59, 130, 246, 0.4)')
          document.body.style.setProperty('--dialog-btn-active-light-shadow', 'rgba(59, 130, 246, 0.3)')
          
          document.body.style.setProperty('--slider-active-color-1', 'rgba(59, 130, 246, 0.9)')
          document.body.style.setProperty('--slider-active-color-2', 'rgba(79, 172, 254, 0.95)')
          document.body.style.setProperty('--slider-active-color-3', 'rgba(99, 192, 255, 1)')
        }
      } else {
        // 亮色主题 - 使用蓝色系
        document.body.style.setProperty('--dialog-bg-1', 'rgba(147, 197, 253, 0.85)')
        document.body.style.setProperty('--dialog-bg-2', 'rgba(125, 211, 252, 0.8)')
        document.body.style.setProperty('--dialog-bg-3', 'rgba(96, 165, 250, 0.85)')
        
        document.body.style.setProperty('--bottom-bar-bg-1', 'rgba(147, 197, 253, 0.95)')
        document.body.style.setProperty('--bottom-bar-bg-2', 'rgba(125, 211, 252, 0.95)')
        document.body.style.setProperty('--bottom-bar-bg-3', 'rgba(96, 165, 250, 0.95)')
        
        document.body.style.setProperty('--bottom-bar-active-bg', 'rgba(59, 130, 246, 0.7)')
        
        document.body.style.setProperty('--bottom-bar-inactive-bg', 'rgba(59, 130, 246, 0.2)')
        
        document.body.style.setProperty('--dialog-btn-active-bg-1', 'rgba(59, 130, 246, 0.7)')
        document.body.style.setProperty('--dialog-btn-active-bg-2', 'rgba(79, 172, 254, 0.6)')
        document.body.style.setProperty('--dialog-btn-active-border', 'rgba(59, 130, 246, 0.5)')
        document.body.style.setProperty('--dialog-btn-active-shadow', 'rgba(59, 130, 246, 0.4)')
        
        document.body.style.setProperty('--dialog-btn-inactive-bg', 'rgba(59, 130, 246, 0.15)')
        document.body.style.setProperty('--dialog-btn-inactive-border', 'rgba(59, 130, 246, 0.25)')
        
        document.body.style.setProperty('--dialog-btn-active-light-bg-1', 'rgba(59, 130, 246, 0.6)')
        document.body.style.setProperty('--dialog-btn-active-light-bg-2', 'rgba(79, 172, 254, 0.5)')
        document.body.style.setProperty('--dialog-btn-active-light-border', 'rgba(59, 130, 246, 0.4)')
        document.body.style.setProperty('--dialog-btn-active-light-shadow', 'rgba(59, 130, 246, 0.3)')
        
        document.body.style.setProperty('--slider-active-color-1', 'rgba(59, 130, 246, 0.9)')
        document.body.style.setProperty('--slider-active-color-2', 'rgba(79, 172, 254, 0.95)')
        document.body.style.setProperty('--slider-active-color-3', 'rgba(99, 192, 255, 1)')
      }
    }
  }

  // 初始化时应用主题
  applyThemeToBody()

  return {
    themes,
    currentThemeName,
    currentTheme,
    textColor,
    textColorSecondary,
    textColorHover,
    fontWeight,
    glassEffect,
    setTheme
  }
})
