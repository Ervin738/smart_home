<!--
  模式切换组件
  功能：在标准模式和添加设备模式之间切换，以及主题切换
  位置：页面右上角
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

type ModeOption = {
  label: string
  to?: string
}

const props = defineProps<{
  text?: string
  modes?: ModeOption[]
}>()

const emit = defineEmits<{
  (e: 'select', option: ModeOption): void
}>()

const defaultModes: ModeOption[] = [
  { label: '添加设备', to: '/equipment' },
  { label: '标准模式', to: '/' },
  { label: '平面图模式', to: '/floor-plan' }
]

const options = props.modes?.length ? props.modes : defaultModes
const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const getCurrentMode = (): ModeOption => {
  const current = options.find(o => o.to === route.path)
  return current || options[1] || options[0] || { label: '标准模式', to: '/' }
}

const activeOption = ref<ModeOption>(getCurrentMode())
const showPanel = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)

watch(() => route.path, () => {
  activeOption.value = getCurrentMode()
})

function togglePanel() {
  showPanel.value = !showPanel.value
}

function handleSelect(option: ModeOption) {
  // 如果点击的是当前已激活的选项，直接关闭面板
  if (activeOption.value.label === option.label && activeOption.value.to === option.to) {
    showPanel.value = false
    return
  }
  
  activeOption.value = option
  showPanel.value = false
  emit('select', option)
  
  // 只有当目标路径与当前路径不同时才进行路由跳转
  if (option.to && route.path !== option.to) {
    router.push(option.to)
  }
}

function selectTheme(themeName: string) {
  themeStore.setTheme(themeName)
}

function handleClickOutside(event: MouseEvent) {
  if (!wrapperRef.value) return
  if (wrapperRef.value.contains(event.target as Node)) return
  showPanel.value = false
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="mode-switcher">
    <div class="mode-container" :class="{ expanded: showPanel }">
      <div class="mode-button" @click.stop="togglePanel">
        <span class="button-text">{{ activeOption.label }}</span>
      </div>

      <div v-if="showPanel" class="mode-options">
        <div
          v-for="option in options"
          :key="option.label"
          class="option-item"
          :class="{ active: activeOption.label === option.label }"
          @click="handleSelect(option)"
        >
          <span class="option-text">{{ option.label }}</span>
          <div v-if="activeOption.label === option.label" class="active-bg"></div>
        </div>
        
        <!-- 主题选择分隔线 -->
        <div class="theme-divider"></div>
        
        <!-- 主题选择 -->
        <div class="theme-section">
          <div class="theme-label">主题</div>
          <div class="theme-buttons">
            <button
              v-for="(theme, key) in themeStore.themes"
              :key="key"
              class="theme-button"
              :class="{ active: themeStore.currentThemeName === key }"
              @click="selectTheme(key)"
              :title="theme.displayName"
            >
              <div 
                class="theme-color-preview" 
                :style="{ background: `linear-gradient(135deg, ${theme.colors.gradientStops.join(', ')})` }"
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-switcher { position: fixed; top: 24px; right: 24px; z-index: 100; }

.mode-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  border-radius: 26px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.mode-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 35%,
    transparent 65%,
    rgba(255, 255, 255, 0.04) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.mode-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

.mode-container.expanded {
  border-radius: 26px;
}

.mode-button {
  padding: 12px 26px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  border-radius: 26px;
  background: transparent;
}

.mode-button:hover { 
  background: rgba(255, 255, 255, 0.05);
}

.button-text {
  color: v-bind('themeStore.textColor');
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
  text-shadow: none;
}

.mode-options {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: optionsSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

@keyframes optionsSlide {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.option-item {
  position: relative;
  padding: 12px 26px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-item:first-child {
  border-radius: 0;
}

.option-item:last-child {
  border-radius: 0 0 24px 24px;
}

.option-item:hover { background: rgba(255, 255, 255, 0.05); }

.option-text {
  position: relative;
  z-index: 2;
  color: v-bind('themeStore.textColor');
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-shadow: none;
}

.option-item:hover .option-text { color: v-bind('themeStore.textColor'); }
.option-item.active .option-text { color: v-bind('themeStore.textColor'); transform: scale(1.02); }

.active-bg {
  position: absolute;
  top: 4px;
  left: 8px;
  right: 8px;
  bottom: 4px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.18) 100%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  z-index: 0;
  animation: liquidDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes liquidDrop {
  0% { transform: scale(0.85); opacity: 0; }
  50% { transform: scale(1.02); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}

.option-item:active .active-bg { animation: liquidPress 0.2s ease; }

@keyframes liquidPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(0.98); }
}

@media (max-width: 600px) {
  .mode-switcher { top: 16px; right: 16px; }
}

.theme-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.theme-section {
  padding: 12px 16px;
}

.theme-label {
  color: v-bind('themeStore.textColorSecondary');
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  text-align: center;
}

.theme-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.theme-button {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-button:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.theme-button.active {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.theme-color-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}
</style>
