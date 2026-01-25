<!--
  模式切换组件
  功能：在标准模式和添加设备模式之间切换
  位置：页面右上角
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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
  { label: '音乐模式', to: '/music' }
]

const options = props.modes?.length ? props.modes : defaultModes
const route = useRoute()
const router = useRouter()

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
  activeOption.value = option
  showPanel.value = false
  emit('select', option)
  if (option.to) {
    router.push(option.to)
  }
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-switcher { position: fixed; top: 24px; right: 24px; z-index: 100; }

.mode-container {
  background: linear-gradient(
    135deg,
    rgba(26, 42, 78, 0.45) 0%,
    rgba(42, 58, 90, 0.4) 30%,
    rgba(58, 90, 122, 0.45) 70%,
    rgba(42, 58, 90, 0.4) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(10, 14, 26, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
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
    rgba(58, 106, 154, 0.04) 100%
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
}

.mode-button:hover { 
  background: rgba(255, 255, 255, 0.05);
}

.button-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.mode-options {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
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
  color: white;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.option-item:hover .option-text { color: white; }
.option-item.active .option-text { color: white; transform: scale(1.02); }

.active-bg {
  position: absolute;
  top: 4px;
  left: 8px;
  right: 8px;
  bottom: 4px;
  background: linear-gradient(
    135deg,
    rgba(58, 106, 154, 0.25) 0%,
    rgba(42, 58, 90, 0.18) 50%,
    rgba(58, 106, 154, 0.22) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  z-index: 0;
  animation: liquidDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.2),
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
</style>
