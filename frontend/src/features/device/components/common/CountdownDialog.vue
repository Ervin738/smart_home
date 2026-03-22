<!--
  倒计时设置对话框
  功能：设置设备的倒计时开启或关闭
  触发：在插座对话框中点击"倒计时"按钮
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: { hours: number; minutes: number; action: 'on' | 'off' }): void
  (e: 'cancel'): void
}>()

const countdownHours = ref(0)
const countdownMinutes = ref(0)
const countdownAction = ref<'on' | 'off'>('off')

watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    countdownAction.value = props.device.status === 'online' ? 'off' : 'on'
    countdownHours.value = 0
    countdownMinutes.value = 0
  }
}, { flush: 'post' })

const confirmCountdown = () => {
  emit('confirm', {
    hours: countdownHours.value,
    minutes: countdownMinutes.value,
    action: countdownAction.value
  })
  emit('update:visible', false)
}

const cancelCountdown = () => {
  emit('cancel')
  emit('update:visible', false)
}

const onCountdownHoursWheel = (e: WheelEvent) => {
  countdownHours.value = e.deltaY < 0
    ? Math.min(23, countdownHours.value + 1)
    : Math.max(0, countdownHours.value - 1)
}

const onCountdownMinutesWheel = (e: WheelEvent) => {
  countdownMinutes.value = e.deltaY < 0
    ? Math.min(59, countdownMinutes.value + 1)
    : Math.max(0, countdownMinutes.value - 1)
}

const countdownDragType = ref<'hours' | 'minutes' | null>(null)
const countdownDragStartY = ref(0)

const startCountdownDrag = (e: MouseEvent, type: 'hours' | 'minutes') => {
  countdownDragStartY.value = e.clientY
  countdownDragType.value = type
  document.addEventListener('mousemove', onCountdownDrag)
  document.addEventListener('mouseup', stopCountdownDrag)
}

const onCountdownDrag = (e: MouseEvent) => {
  const diff = countdownDragStartY.value - e.clientY
  if (Math.abs(diff) > 10) {
    const delta = diff > 0 ? 1 : -1
    if (countdownDragType.value === 'hours') {
      countdownHours.value = delta > 0
        ? Math.min(23, countdownHours.value + 1)
        : Math.max(0, countdownHours.value - 1)
    } else if (countdownDragType.value === 'minutes') {
      countdownMinutes.value = delta > 0
        ? Math.min(59, countdownMinutes.value + 1)
        : Math.max(0, countdownMinutes.value - 1)
    }
    countdownDragStartY.value = e.clientY
  }
}

const stopCountdownDrag = () => {
  countdownDragType.value = null
  document.removeEventListener('mousemove', onCountdownDrag)
  document.removeEventListener('mouseup', stopCountdownDrag)
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content countdown-dialog" @click.stop>
        <div class="dialog-header">倒计时{{ countdownAction === 'off' ? '关闭' : '开启' }}</div>
        
        <div class="countdown-picker">
          <div class="countdown-preview">
            {{ String(countdownHours).padStart(2, '0') }}:{{ String(countdownMinutes).padStart(2, '0') }}
          </div>
          <div class="countdown-input-group">
            <div class="countdown-wheel" @wheel.prevent="onCountdownHoursWheel" @mousedown="startCountdownDrag($event, 'hours')">
              <div class="wheel-item-small faded">{{ String(Math.max(0, countdownHours - 1)).padStart(2, '0') }}</div>
              <div class="wheel-item-small active">{{ String(countdownHours).padStart(2, '0') }}<span class="wheel-unit-small">时</span></div>
              <div class="wheel-item-small faded">{{ String(Math.min(23, countdownHours + 1)).padStart(2, '0') }}</div>
            </div>
            <div class="countdown-wheel" @wheel.prevent="onCountdownMinutesWheel" @mousedown="startCountdownDrag($event, 'minutes')">
              <div class="wheel-item-small faded">{{ String(Math.max(0, countdownMinutes - 1)).padStart(2, '0') }}</div>
              <div class="wheel-item-small active">{{ String(countdownMinutes).padStart(2, '0') }}<span class="wheel-unit-small">分</span></div>
              <div class="wheel-item-small faded">{{ String(Math.min(59, countdownMinutes + 1)).padStart(2, '0') }}</div>
            </div>
          </div>
        </div>
        
        <div class="timer-actions">
          <div class="timer-confirm" @click="confirmCountdown">开始倒计时</div>
          <div v-if="device?.countdownEnabled" class="timer-cancel" @click="cancelCountdown">取消倒计时</div>
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
  z-index: 3000;
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

.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-align: center;
}

.countdown-dialog { width: 340px; }

.countdown-picker { margin-bottom: 20px; }

.countdown-preview {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.4) 0%, rgba(20, 40, 70, 0.3) 100%);
  border-radius: 12px;
  border: 1px solid rgba(100, 180, 255, 0.15);
}

.countdown-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.countdown-wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: ns-resize;
  user-select: none;
}

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

.dialog-enter-active, .dialog-leave-active { transition: all 0.3s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-content, .dialog-leave-to .dialog-content { transform: scale(0.9); opacity: 0; }
</style>
