<!--
  香薰机长按弹窗
  功能：显示香薰机详细控制界面，包括开关、出香间隔、出香时长、快速出香等功能
-->
<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

// 出香间隔选项（分钟）
const intervalOptions = [
  { label: 'I', value: 20 },
  { label: 'II', value: 30 },
  { label: 'III', value: 40 }
]

// 出香时长选项（秒）
const durationOptions = [2, 3, 4, 5, 6]

const selectedInterval = computed<number>({
  get: () => (props.device as any)?.aromaInterval ?? 0,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { aromaInterval: v }) }
})
const selectedDuration = computed<number>({
  get: () => (props.device as any)?.aromaDuration ?? 0,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { aromaDuration: v }) }
})

// 液态背景相关
const intervalItemsRef = ref<HTMLElement[]>([])
const durationItemsRef = ref<HTMLElement[]>([])
const intervalBgStyle = ref({ left: '0px', width: '0px' })
const durationBgStyle = ref({ left: '0px', width: '0px' })

const setIntervalItemRef = (el: any, index: number) => {
  if (el) {
    intervalItemsRef.value[index] = el as HTMLElement
  }
}

const setDurationItemRef = (el: any, index: number) => {
  if (el) {
    durationItemsRef.value[index] = el as HTMLElement
  }
}

const updateIntervalBg = () => {
  nextTick(() => {
    const activeEl = intervalItemsRef.value[selectedInterval.value]
    if (activeEl) {
      const parent = activeEl.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        intervalBgStyle.value = {
          left: `${activeRect.left - parentRect.left}px`,
          width: `${activeRect.width}px`
        }
      }
    }
  })
}

const updateDurationBg = () => {
  nextTick(() => {
    const activeEl = durationItemsRef.value[selectedDuration.value]
    if (activeEl) {
      const parent = activeEl.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        durationBgStyle.value = {
          left: `${activeRect.left - parentRect.left}px`,
          width: `${activeRect.width}px`
        }
      }
    }
  })
}

watch(selectedInterval, updateIntervalBg)
watch(selectedDuration, updateDurationBg)

// 监听弹窗显示状态，显示时更新液态背景
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      updateIntervalBg()
      updateDurationBg()
    })
  }
})

// 离线时重置选中模式
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    selectedInterval.value = 0
    selectedDuration.value = 0
  }
})

onMounted(() => {
  updateIntervalBg()
  updateDurationBg()
})

// 计算滑动条进度百分比
const intervalProgress = computed(() => {
  const max = intervalOptions.length - 1
  return max > 0 ? (selectedInterval.value / max) * 100 : 0
})

const durationProgress = computed(() => {
  const max = durationOptions.length - 1
  return max > 0 ? (selectedDuration.value / max) * 100 : 0
})

// 快速出香功能
const quickAroma = () => {
  if (props.device?.status === 'offline') return
  // 触发快速出香
  console.log('快速出香')
}

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content aroma-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">香薰机</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>

        <div class="aroma-layout">
          <!-- 电源按钮和定时按钮 -->
          <div class="power-timer-section">
            <div 
              class="aroma-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>

            <div class="timer-btn clickable" @click="emit('open-timer')">
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="timer-label">定时</span>
            </div>
          </div>

          <!-- 出香间隔 -->
          <div class="control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="section-header">
              <span class="section-title">出香间隔</span>
              <span class="section-value">{{ intervalOptions[selectedInterval]?.value || 20 }}分钟</span>
            </div>
            <div class="option-selector">
              <div 
                class="liquid-bg"
                :style="{
                  left: intervalBgStyle.left,
                  width: intervalBgStyle.width
                }"
              ></div>
              <div
                v-for="(option, index) in intervalOptions"
                :key="index"
                :ref="(el) => setIntervalItemRef(el, index)"
                class="option-item"
                :class="{ active: selectedInterval === index }"
                @click="selectedInterval = index"
              >
                {{ option.label }}
              </div>
            </div>
          </div>

          <!-- 出香时长 -->
          <div class="control-section" :class="{ disabled: device.status === 'offline' }">
            <div class="section-header">
              <span class="section-title">出香时长</span>
              <span class="section-value">{{ durationOptions[selectedDuration] || 2 }}秒</span>
            </div>
            <div class="option-selector">
              <div 
                class="liquid-bg"
                :style="{
                  left: durationBgStyle.left,
                  width: durationBgStyle.width
                }"
              ></div>
              <div
                v-for="(duration, index) in durationOptions"
                :key="index"
                :ref="(el) => setDurationItemRef(el, index)"
                class="option-item"
                :class="{ active: selectedDuration === index }"
                @click="selectedDuration = index"
              >
                {{ duration }}
              </div>
            </div>
          </div>

          <!-- 快速出香 -->
          <div 
            class="quick-aroma-section"
            :class="{ disabled: device.status === 'offline' }"
          >
            <div class="quick-aroma-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 8M12 8C10 8 8 9 8 12C8 15 10 16 12 16M12 8C14 8 16 9 16 12C16 15 14 16 12 16M12 16L12 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <span class="quick-aroma-label">快速出香</span>
            <button 
              class="quick-aroma-btn" 
              :disabled="device.status === 'offline'"
              @click.stop="quickAroma"
            >
              出香
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.aroma-dialog {
  width: 320px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.device-info {
  flex: 1;
}

.device-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
}

.device-type-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.device-status-tag {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.device-status-tag.online {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.2) 100%);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.device-status-tag.offline {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(100, 116, 139, 0.15) 100%);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

/* 香薰机布局 */
.aroma-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 电源和定时按钮区域 */
.power-timer-section {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

/* 电源按钮 */
.aroma-power-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.aroma-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.aroma-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.power-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.power-label {
  font-size: 15px;
  font-weight: 600;
}

/* 定时按钮 */
.timer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timer-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.timer-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.timer-label {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

/* 控制区域 */
.control-section {
  padding: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
}

.control-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.section-value {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* 选项选择器 */
.option-selector {
  display: flex;
  align-items: stretch;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  padding: 4px;
  gap: 4px;
}

/* 液态背景 */
.liquid-bg {
  position: absolute;
  top: 4px;
  bottom: 4px;
  background: linear-gradient(
    135deg,
    rgba(38, 208, 206, 0.6) 0%,
    rgba(31, 161, 159, 0.5) 100%
  );
  border-radius: 20px;
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
  box-shadow: 
    0 4px 16px rgba(38, 208, 206, 0.3),
    0 2px 8px rgba(38, 208, 206, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(38, 208, 206, 0.3);
}

.liquid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 35%,
    transparent 65%,
    rgba(38, 208, 206, 0.1) 100%
  );
  border-radius: 20px;
  pointer-events: none;
}

.liquid-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 60%
  );
  border-radius: 20px;
  pointer-events: none;
}

/* 选项项 */
.option-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  user-select: none;
  position: relative;
  z-index: 1;
  border-radius: 20px;
}

.option-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.option-item.active {
  color: white;
  font-weight: 600;
}

/* 快速出香 */
.quick-aroma-section {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
}

.quick-aroma-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.quick-aroma-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-aroma-icon svg {
  width: 28px;
  height: 28px;
  color: rgba(255, 255, 255, 0.9);
}

.quick-aroma-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.quick-aroma-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.25) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.quick-aroma-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.35) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

.quick-aroma-btn:disabled {
  cursor: not-allowed;
}

/* 弹窗动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
