<!--
  加湿器设备对话框
  功能：长按加湿器设备卡片后显示，提供电源控制、档位选择（1档、2档、恒湿）
  触发：长按加湿器设备卡片
-->
<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'update:level', level: number): void
}>()

const store = useDevicesStore()

const humidifierLevel = computed({
  get: () => (props.device as any)?.humidifierLevel ?? 1,
  set: (level: number) => { if (props.device) store.setDeviceExtra(props.device.id, { humidifierLevel: level }) }
})

const handleLevelChange = (level: number) => {
  if (!props.device || props.device.status === 'offline') return
  humidifierLevel.value = level
  emit('update:level', level)
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content humidifier-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">加湿器</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <div class="humidifier-layout">
          <!-- 电源开关 -->
          <div class="humidifier-power-section">
            <div 
              class="humidifier-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="humidifier-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="humidifier-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
          </div>
          
          <!-- 档位控制 -->
          <div class="humidifier-level-section">
            <div 
              class="humidifier-level-btn"
              :class="{ active: humidifierLevel === 1, disabled: device.status === 'offline' }"
              @click="handleLevelChange(1)"
            >
              <div class="humidifier-level-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2.5"/>
                </svg>
              </div>
              <span class="humidifier-level-label">1档</span>
            </div>
            
            <div 
              class="humidifier-level-btn"
              :class="{ active: humidifierLevel === 2, disabled: device.status === 'offline' }"
              @click="handleLevelChange(2)"
            >
              <div class="humidifier-level-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2.5"/>
                  <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2.5"/>
                </svg>
              </div>
              <span class="humidifier-level-label">2档</span>
            </div>
            
            <div 
              class="humidifier-level-btn"
              :class="{ active: humidifierLevel === 3, disabled: device.status === 'offline' }"
              @click="handleLevelChange(3)"
            >
              <div class="humidifier-level-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3.5l5 5a7 7 0 11-10 0l5-5z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="humidifier-level-label">恒湿</span>
            </div>
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

.humidifier-dialog {
  width: 380px;
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

/* 加湿器专用布局样式 */
.humidifier-layout {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.humidifier-power-section {
  display: flex;
  justify-content: center;
}

.humidifier-power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.humidifier-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.humidifier-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.humidifier-power-icon {
  width: 18px;
  height: 18px;
}

.humidifier-power-label {
  font-size: 16px;
  font-weight: 700;
}

.humidifier-level-section {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.humidifier-level-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.humidifier-level-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.humidifier-level-btn:active {
  transform: translateY(0);
}

.humidifier-level-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.humidifier-level-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.humidifier-level-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.humidifier-level-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.humidifier-level-label {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
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
