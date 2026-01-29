<!--
  开关底部控制栏
  功能：单击开关设备卡片后显示，提供电源开关按钮
  触发：单击开关设备卡片
-->
<script setup lang="ts">
import type { Device } from '@/features/device/store/devices.store'

defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
}>()
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-switch-bar" @click.stop>
      <div class="switch-bar-content">
        <div 
          class="control-btn"
          :class="{ active: device.status === 'online' }"
          @click="emit('toggle-power')"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
        </div>
        
        <div class="device-name">{{ device.name }} · 开关</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-switch-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.switch-bar-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(30, 40, 60, 0.95) 0%,
    rgba(40, 55, 80, 0.95) 50%,
    rgba(50, 70, 100, 0.95) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.control-btn.active {
  background: rgb(59, 130, 246);
  border: none;
  border-radius: 16px;
  color: white;
  box-shadow: none !important;
  outline: none !important;
  filter: none !important;
  -webkit-filter: none !important;
  isolation: isolate;
  position: relative;
  z-index: 1;
}

.control-btn.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: rgb(59, 130, 246);
  border-radius: 16px;
  z-index: -1;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.device-name {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
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
