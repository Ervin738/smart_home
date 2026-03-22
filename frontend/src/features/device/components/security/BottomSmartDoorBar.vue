<!--
  智能门底部控制栏
  功能:单击智能门设备卡片后显示，提供快速控制
  触发：单击智能门设备卡片
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'toggle-door'): void
}>()

const store = useDevicesStore()

const isDoorOpen = computed({
  get: () => (props.device as any)?.smartDoorIsOpen ?? false,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { smartDoorIsOpen: v }) }
})

const handleToggleDoor = () => {
  if (props.device?.status === 'offline') return
  isDoorOpen.value = !isDoorOpen.value
  emit('toggle-door')
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-smart-door-bar" @click.stop>
      <div class="smart-door-bar-content">
        <!-- 电源按钮 -->
        <div class="control-section">
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
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 门控制 -->
        <div class="door-section">
          <div 
            class="door-btn"
            :class="{ 
              open: isDoorOpen,
              disabled: device.status === 'offline'
            }"
            @click="handleToggleDoor"
          >
            <svg v-if="!isDoorOpen" class="door-icon" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="16" cy="12" r="1" fill="currentColor"/>
            </svg>
            <svg v-else class="door-icon" viewBox="0 0 24 24" fill="none">
              <path d="M4 3h8v18H4a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 3l8 4v10l-8 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8" cy="12" r="1" fill="currentColor"/>
            </svg>
            <span class="door-text">{{ isDoorOpen ? '开门' : '关门' }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 智能门</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-smart-door-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.smart-door-bar-content {
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
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 24px;
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
  border: none;
  border-radius: 16px;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
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

.divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.door-section {
  display: flex;
  gap: 8px;
}

.door-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.25) 100%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.door-btn.open {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.25) 100%);
  border-color: rgba(34, 197, 94, 0.4);
}

.door-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.35) 100%);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: none;
}

.door-btn.open:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.35) 100%);
  border-color: rgba(34, 197, 94, 0.5);
}

.door-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.door-icon {
  width: 18px;
  height: 18px;
}

.door-text {
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
