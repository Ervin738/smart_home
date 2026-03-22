<!--
  门锁底部控制栏
  功能：单击门锁设备卡片后显示，提供快速控制
  触发：单击门锁设备卡片
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
  (e: 'toggle-lock'): void
}>()

const store = useDevicesStore()

const isLocked = computed({
  get: () => (props.device as any)?.doorLockIsLocked ?? true,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { doorLockIsLocked: v }) }
})

const handleToggleLock = () => {
  if (props.device?.status === 'offline') return
  isLocked.value = !isLocked.value
  emit('toggle-lock')
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-door-lock-bar" @click.stop>
      <div class="door-lock-bar-content">
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
        
        <!-- 门锁控制 -->
        <div class="lock-section">
          <div 
            class="lock-btn"
            :class="{ 
              locked: isLocked,
              disabled: device.status === 'offline'
            }"
            @click="handleToggleLock"
          >
            <svg v-if="isLocked" class="lock-icon" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M12 15v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else class="lock-icon" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M12 15v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M8 11V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M16 10h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="lock-text">{{ isLocked ? '上锁' : '解锁' }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 门锁</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-door-lock-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.door-lock-bar-content {
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

.lock-section {
  display: flex;
  gap: 8px;
}

.lock-btn {
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

.lock-btn.locked {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.25) 100%);
  border-color: rgba(34, 197, 94, 0.4);
}

.lock-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.35) 100%);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: none;
}

.lock-btn.locked:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.35) 100%);
  border-color: rgba(34, 197, 94, 0.5);
}

.lock-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-icon {
  width: 18px;
  height: 18px;
}

.lock-text {
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
