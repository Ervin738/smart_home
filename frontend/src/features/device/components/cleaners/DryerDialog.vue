<!--
  烘干机设备对话框
  功能：长按烘干机设备卡片后显示，提供电源控制、烘干模式选择、开始/暂停烘干
  触发：长按烘干机设备卡片
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
  (e: 'toggle-drying'): void
  (e: 'update:mode', index: number): void
}>()

const devicesStore = useDevicesStore()
const modeOptions = ['智能烘', '快速烘', '节能烘', '大件烘', '小件烘', '除菌烘', '除异味', '除静电']

const activeModeIndex = computed({
  get: () => {
    const name = (props.device as any)?.dryerModeName
    return name ? modeOptions.indexOf(name) : -1
  },
  set: (index: number) => {
    if (props.device) devicesStore.setDeviceExtra(props.device.id, { dryerModeName: index >= 0 ? modeOptions[index] : '' })
  }
})

const isDrying = computed({
  get: () => (props.device as any)?.dryerIsWorking ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { dryerIsWorking: v }) }
})

const handleModeSelect = (index: number) => {
  if (!props.device || props.device.status === 'offline') return
  activeModeIndex.value = index
  emit('update:mode', index)
}

const handleDryToggle = () => {
  if (!props.device || props.device.status === 'offline') return
  if (activeModeIndex.value === -1) return
  isDrying.value = !isDrying.value
  emit('toggle-drying')
}

watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    devicesStore.setDeviceExtra(props.device.id, { dryerModeName: '', dryerIsWorking: false })
  }
})
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content dryer-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">烘干机</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
          <div 
            class="control-btn"
            :class="{ 
              active: isDrying, 
              disabled: device.status === 'offline' || activeModeIndex === -1 
            }"
            @click="handleDryToggle"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 3l14 9-14 9V3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            </svg>
            <span class="btn-label">{{ isDrying ? '暂停烘干' : '开始烘干' }}</span>
          </div>
        </div>
        
        <!-- 烘干模式 -->
        <div class="mode-section">
          <div class="mode-title">烘干模式</div>
          <div class="mode-grid vertical" :class="{ disabled: device.status === 'offline' }">
            <div 
              v-for="(mode, index) in modeOptions" 
              :key="index"
              class="mode-btn"
              :class="{ active: activeModeIndex === index, disabled: device.status === 'offline' }"
              @click="handleModeSelect(index)"
            >
              {{ mode }}
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

.dryer-dialog {
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

/* 控制按钮样式 */
.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-label {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

/* 模式选择样式 */
.mode-section {
  margin-top: 8px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 14px;
  text-align: center;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mode-grid.vertical {
  grid-template-columns: repeat(2, 1fr);
}

.mode-grid.disabled {
  pointer-events: none;
}

.mode-btn {
  padding: 22px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-grid.vertical .mode-btn {
  padding: 18px 10px;
}

.mode-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.mode-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.mode-btn.disabled {
  opacity: 0.35;
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
