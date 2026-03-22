<!--
  投影仪底部控制栏
  功能：快速控制投影仪开关
-->
<script setup lang="ts">
import type { Device } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'toggle-power'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleTogglePower = () => {
  emit('toggle-power')
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-projector-bar" @click.stop>
      <div class="projector-bar-content">
        <!-- 电源开关 -->
        <div 
          class="power-btn"
          :class="{ active: device.status === 'online' }"
          @click="handleTogglePower"
        >
          <svg class="power-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="power-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 投影仪</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-projector-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.bottom-projector-bar * {
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.projector-bar-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
  overflow: visible;
  outline: none;
  user-select: none;
}

/* 电源开关 */
.power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.power-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.power-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.power-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.power-btn.active .power-icon {
  color: white;
}

.power-text {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}

.power-btn.active .power-text {
  color: white;
}

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
