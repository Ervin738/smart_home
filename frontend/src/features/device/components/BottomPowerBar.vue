<!--
  通用设备底部电源控制栏
  功能：单击设备卡片后显示，提供电源开关按钮
  触发：单击不需要特殊控制的设备卡片
-->
<script setup lang="ts">
import type { Device } from '@/features/device/stores/devices'

defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-power-bar">
      <div class="bottom-power-btn" @click="emit('click')">
        <span class="power-icon">⏻</span>
        <span class="power-text">{{ device.status === 'online' ? '关闭电源' : '开启电源' }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-power-bar {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.bottom-power-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.bottom-power-btn:hover { background: white; transform: scale(1.02); }
.bottom-power-btn:active { transform: scale(0.98); }
.power-icon { font-size: 18px; color: #1e3a5f; }
.power-text { font-size: 15px; font-weight: 500; color: #1e3a5f; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
