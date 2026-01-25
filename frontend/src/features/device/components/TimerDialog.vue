<!--
  定时器设置对话框
  功能：设置设备的定时开启和定时关闭时间
  触发：在设备对话框中点击"定时"按钮
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/stores/devices'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: {
    offEnabled: boolean
    onEnabled: boolean
    offTime: string
    onTime: string
    offRepeat: boolean
    onRepeat: boolean
  }): void
  (e: 'cancel-all'): void
}>()

const timerOffEnabled = ref(false)
const timerOnEnabled = ref(false)
const timerOffHours = ref(0)
const timerOffMinutes = ref(0)
const timerOnHours = ref(0)
const timerOnMinutes = ref(0)
const timerOffRepeat = ref(false)
const timerOnRepeat = ref(false)
const expandedTimer = ref<'off' | 'on' | null>(null)

// 初始化定时器值
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    timerOffHours.value = 0
    timerOffMinutes.value = 0
    timerOnHours.value = 0
    timerOnMinutes.value = 0
    timerOffEnabled.value = props.device.timerOffEnabled || false
    timerOnEnabled.value = props.device.timerOnEnabled || false
    timerOffRepeat.value = props.device.timerOffRepeat || false
    timerOnRepeat.value = props.device.timerOnRepeat || false
    expandedTimer.value = null
    
    if (props.device.timerOffEnabled && props.device.timerOffTime) {
      const parts = props.device.timerOffTime.split(':').map(Number)
      timerOffHours.value = parts[0] ?? 0
      timerOffMinutes.value = parts[1] ?? 0
    }
    if (props.device.timerOnEnabled && props.device.timerOnTime) {
      const parts = props.device.timerOnTime.split(':').map(Number)
      timerOnHours.value = parts[0] ?? 0
      timerOnMinutes.value = parts[1] ?? 0
    }
  }
})

const isNextDay = (hours: number, minutes: number): boolean => {
  const now = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  return target.getTime() <= now.getTime()
}

const toggleTimerExpand = (type: 'off' | 'on') => {
  if (expandedTimer.value === type) {
    expandedTimer.value = null
  } else {
    expandedTimer.value = type
    if (type === 'off') timerOffEnabled.value = true
    else timerOnEnabled.value = true
  }
}

const confirmTimer = () => {
  emit('confirm', {
    offEnabled: timerOffEnabled.value,
    onEnabled: timerOnEnabled.value,
    offTime: `${String(timerOffHours.value).padStart(2, '0')}:${String(timerOffMinutes.value).padStart(2, '0')}`,
    onTime: `${String(timerOnHours.value).padStart(2, '0')}:${String(timerOnMinutes.value).padStart(2, '0')}`,
    offRepeat: timerOffRepeat.value,
    onRepeat: timerOnRepeat.value
  })
  emit('update:visible', false)
}

const cancelAllTimers = () => {
  emit('cancel-all')
  emit('update:visible', false)
}

// 滚轮和拖拽处理
const onOffHoursWheel = (e: WheelEvent) => {
  timerOffHours.value = e.deltaY < 0 
    ? (timerOffHours.value >= 23 ? 0 : timerOffHours.value + 1)
    : (timerOffHours.value <= 0 ? 23 : timerOffHours.value - 1)
}

const onOffMinutesWheel = (e: WheelEvent) => {
  timerOffMinutes.value = e.deltaY < 0
    ? (timerOffMinutes.value >= 59 ? 0 : timerOffMinutes.value + 1)
    : (timerOffMinutes.value <= 0 ? 59 : timerOffMinutes.value - 1)
}

const onOnHoursWheel = (e: WheelEvent) => {
  timerOnHours.value = e.deltaY < 0
    ? (timerOnHours.value >= 23 ? 0 : timerOnHours.value + 1)
    : (timerOnHours.value <= 0 ? 23 : timerOnHours.value - 1)
}

const onOnMinutesWheel = (e: WheelEvent) => {
  timerOnMinutes.value = e.deltaY < 0
    ? (timerOnMinutes.value >= 59 ? 0 : timerOnMinutes.value + 1)
    : (timerOnMinutes.value <= 0 ? 59 : timerOnMinutes.value - 1)
}

const dragStartY = ref(0)
const dragType = ref<'offHours' | 'offMinutes' | 'onHours' | 'onMinutes' | null>(null)

const startDrag = (e: MouseEvent, type: 'offHours' | 'offMinutes' | 'onHours' | 'onMinutes') => {
  dragStartY.value = e.clientY
  dragType.value = type
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  const diff = dragStartY.value - e.clientY
  if (Math.abs(diff) > 10) {
    const delta = diff > 0 ? 1 : -1
    switch (dragType.value) {
      case 'offHours':
        timerOffHours.value = delta > 0
          ? (timerOffHours.value >= 23 ? 0 : timerOffHours.value + 1)
          : (timerOffHours.value <= 0 ? 23 : timerOffHours.value - 1)
        break
      case 'offMinutes':
        timerOffMinutes.value = delta > 0
          ? (timerOffMinutes.value >= 59 ? 0 : timerOffMinutes.value + 1)
          : (timerOffMinutes.value <= 0 ? 59 : timerOffMinutes.value - 1)
        break
      case 'onHours':
        timerOnHours.value = delta > 0
          ? (timerOnHours.value >= 23 ? 0 : timerOnHours.value + 1)
          : (timerOnHours.value <= 0 ? 23 : timerOnHours.value - 1)
        break
      case 'onMinutes':
        timerOnMinutes.value = delta > 0
          ? (timerOnMinutes.value >= 59 ? 0 : timerOnMinutes.value + 1)
          : (timerOnMinutes.value <= 0 ? 59 : timerOnMinutes.value - 1)
        break
    }
    dragStartY.value = e.clientY
  }
}

const stopDrag = () => {
  dragType.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content timer-dialog" @click.stop>
        <div class="dialog-header">定时设置</div>
        
        <!-- 定时开启行 -->
        <div class="timer-row" @click="toggleTimerExpand('on')">
          <span class="timer-row-label">开启时间</span>
          <div class="timer-row-right">
            <span class="timer-row-value" :class="{ active: timerOnEnabled }">
              {{ String(timerOnHours).padStart(2, '0') }}:{{ String(timerOnMinutes).padStart(2, '0') }}
              <span v-if="timerOnEnabled && isNextDay(timerOnHours, timerOnMinutes)" class="next-day">(次日)</span>
            </span>
            <span class="timer-row-arrow" :class="{ expanded: expandedTimer === 'on' }">›</span>
          </div>
        </div>
        
        <!-- 定时开启选择器 -->
        <transition name="expand">
          <div v-if="expandedTimer === 'on'" class="timer-picker-expand">
            <div class="timer-input-group-compact">
              <div class="timer-wheel-compact" @wheel.prevent="onOnHoursWheel" @mousedown="startDrag($event, 'onHours')">
                <div class="wheel-item-small faded">{{ String(timerOnHours <= 0 ? 23 : timerOnHours - 1).padStart(2, '0') }}</div>
                <div class="wheel-item-small active">{{ String(timerOnHours).padStart(2, '0') }}<span class="wheel-unit-small">时</span></div>
                <div class="wheel-item-small faded">{{ String(timerOnHours >= 23 ? 0 : timerOnHours + 1).padStart(2, '0') }}</div>
              </div>
              <div class="timer-wheel-compact" @wheel.prevent="onOnMinutesWheel" @mousedown="startDrag($event, 'onMinutes')">
                <div class="wheel-item-small faded">{{ String(timerOnMinutes <= 0 ? 59 : timerOnMinutes - 1).padStart(2, '0') }}</div>
                <div class="wheel-item-small active">{{ String(timerOnMinutes).padStart(2, '0') }}<span class="wheel-unit-small">分</span></div>
                <div class="wheel-item-small faded">{{ String(timerOnMinutes >= 59 ? 0 : timerOnMinutes + 1).padStart(2, '0') }}</div>
              </div>
            </div>
            <div class="timer-picker-hint" v-if="isNextDay(timerOnHours, timerOnMinutes)">将于次日执行</div>
          </div>
        </transition>
        
        <!-- 定时关闭行 -->
        <div class="timer-row" @click="toggleTimerExpand('off')">
          <span class="timer-row-label">关闭时间</span>
          <div class="timer-row-right">
            <span class="timer-row-value" :class="{ active: timerOffEnabled }">
              {{ String(timerOffHours).padStart(2, '0') }}:{{ String(timerOffMinutes).padStart(2, '0') }}
              <span v-if="timerOffEnabled && isNextDay(timerOffHours, timerOffMinutes)" class="next-day">(次日)</span>
            </span>
            <span class="timer-row-arrow" :class="{ expanded: expandedTimer === 'off' }">›</span>
          </div>
        </div>
        
        <!-- 定时关闭选择器 -->
        <transition name="expand">
          <div v-if="expandedTimer === 'off'" class="timer-picker-expand">
            <div class="timer-input-group-compact">
              <div class="timer-wheel-compact" @wheel.prevent="onOffHoursWheel" @mousedown="startDrag($event, 'offHours')">
                <div class="wheel-item-small faded">{{ String(timerOffHours <= 0 ? 23 : timerOffHours - 1).padStart(2, '0') }}</div>
                <div class="wheel-item-small active">{{ String(timerOffHours).padStart(2, '0') }}<span class="wheel-unit-small">时</span></div>
                <div class="wheel-item-small faded">{{ String(timerOffHours >= 23 ? 0 : timerOffHours + 1).padStart(2, '0') }}</div>
              </div>
              <div class="timer-wheel-compact" @wheel.prevent="onOffMinutesWheel" @mousedown="startDrag($event, 'offMinutes')">
                <div class="wheel-item-small faded">{{ String(timerOffMinutes <= 0 ? 59 : timerOffMinutes - 1).padStart(2, '0') }}</div>
                <div class="wheel-item-small active">{{ String(timerOffMinutes).padStart(2, '0') }}<span class="wheel-unit-small">分</span></div>
                <div class="wheel-item-small faded">{{ String(timerOffMinutes >= 59 ? 0 : timerOffMinutes + 1).padStart(2, '0') }}</div>
              </div>
            </div>
            <div class="timer-picker-hint" v-if="isNextDay(timerOffHours, timerOffMinutes)">将于次日执行</div>
          </div>
        </transition>
        
        <!-- 每日重复选项 -->
        <div class="timer-repeat-section" v-if="timerOnEnabled || timerOffEnabled">
          <div class="timer-repeat-row" v-if="timerOnEnabled" @click="timerOnRepeat = !timerOnRepeat">
            <span class="timer-repeat-label">开启时间每日重复</span>
            <div class="timer-checkbox" :class="{ checked: timerOnRepeat }">
              <span v-if="timerOnRepeat">✓</span>
            </div>
          </div>
          <div class="timer-repeat-row" v-if="timerOffEnabled" @click="timerOffRepeat = !timerOffRepeat">
            <span class="timer-repeat-label">关闭时间每日重复</span>
            <div class="timer-checkbox" :class="{ checked: timerOffRepeat }">
              <span v-if="timerOffRepeat">✓</span>
            </div>
          </div>
        </div>
        
        <div class="timer-actions">
          <div class="timer-confirm" @click="confirmTimer">确认设置</div>
          <div v-if="device?.timerOffEnabled || device?.timerOnEnabled" class="timer-cancel" @click="cancelAllTimers">取消全部定时</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    rgba(13, 13, 26, 0.95) 0%,
    rgba(26, 26, 46, 0.95) 25%,
    rgba(42, 58, 90, 0.95) 50%,
    rgba(58, 90, 122, 0.95) 75%,
    rgba(58, 106, 154, 0.95) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.timer-dialog { width: 340px; }

.timer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timer-row:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-color: rgba(255, 255, 255, 0.2);
}
.timer-row-label { color: rgba(255, 255, 255, 0.9); font-size: 15px; font-weight: 500; }
.timer-row-right { display: flex; align-items: center; gap: 8px; }
.timer-row-value { color: rgba(255, 255, 255, 0.5); font-size: 15px; }
.timer-row-value.active { color: rgba(255, 255, 255, 0.9); }
.next-day { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-left: 4px; }
.timer-row-arrow { color: rgba(255, 255, 255, 0.4); font-size: 18px; transition: transform 0.2s; }
.timer-row-arrow.expanded { transform: rotate(90deg); }

.timer-picker-expand {
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.4) 0%, rgba(20, 40, 70, 0.3) 100%);
  border: 1px solid rgba(100, 180, 255, 0.15);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 8px;
  overflow: hidden;
}

.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding: 0 16px; margin-bottom: 0; }

.timer-picker-hint { text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 12px; }
.timer-input-group-compact { display: flex; align-items: center; justify-content: center; gap: 24px; }
.timer-wheel-compact { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: ns-resize; user-select: none; }
.wheel-item-small { font-size: 18px; color: rgba(255, 255, 255, 0.3); transition: all 0.2s; }
.wheel-item-small.active { font-size: 36px; font-weight: 600; color: white; }
.wheel-unit-small { font-size: 16px; font-weight: 400; margin-left: 2px; }
.wheel-item-small.faded { font-size: 20px; color: rgba(255, 255, 255, 0.25); }

.timer-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }

.timer-confirm {
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-radius: 14px;
  color: #1a1a2e;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.timer-confirm:hover {
  background: linear-gradient(135deg, #fff 0%, #f0f5ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
}

.timer-confirm:active {
  transform: translateY(0);
}

.timer-cancel {
  padding: 14px;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.25) 0%, rgba(239, 68, 68, 0.2) 100%);
  border: 1px solid rgba(248, 113, 113, 0.4);
  border-radius: 14px;
  color: #fca5a5;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timer-cancel:hover {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.35) 0%, rgba(239, 68, 68, 0.3) 100%);
  border-color: rgba(248, 113, 113, 0.6);
  transform: translateY(-1px);
}

.timer-cancel:active {
  transform: translateY(0);
}

.timer-repeat-section { margin-bottom: 12px; }

.timer-repeat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timer-repeat-row:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
}
.timer-repeat-label { color: rgba(255, 255, 255, 0.85); font-size: 14px; }

.timer-checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 12px;
  color: white;
}

.timer-checkbox.checked {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-color: #4ade80;
  box-shadow: 0 2px 10px rgba(74, 222, 128, 0.4);
}

.dialog-enter-active, .dialog-leave-active { transition: all 0.3s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-content, .dialog-leave-to .dialog-content { transform: scale(0.9); opacity: 0; }
</style>
