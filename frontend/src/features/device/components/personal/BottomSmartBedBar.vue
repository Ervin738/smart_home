<!--
  智能床底部控制栏
  功能：快速控制智能床开关
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

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleTogglePower = () => {
  emit('toggle-power')
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-smart-bed-bar" @click.stop>
      <div class="smart-bed-bar-content">
        <!-- 电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="handleTogglePower"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name-wrapper">
          <span class="device-name">{{ device.name }} · 智能床</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-smart-bed-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.smart-bed-bar-content {
  display: flex;
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
}

.control-section {
  display: flex;
  gap: 8px;
  width: 100%;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.control-btn.active {
  background: var(--bottom-bar-active-bg);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  width: 22px;
  height: 22px;
}

.btn-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.device-name-wrapper {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
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
