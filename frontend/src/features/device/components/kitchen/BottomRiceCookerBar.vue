<!--
  电饭煲底部控制栏
  功能：单击电饭煲设备卡片后显示，提供快速模式选择
  触发：单击电饭煲设备卡片
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
  (e: 'toggle-power'): void
  (e: 'select-mode', mode: number): void
  (e: 'open-mode-selector', mainModeId: number): void
  (e: 'open-keep-warm-settings'): void
}>()

const store = useDevicesStore()

const modes = [
  { id: 0, name: '标准饭', color: 'orange' },
  { id: 1, name: '快煮饭', color: 'blue' },
  { id: 2, name: '煮粥', color: 'green' },
  { id: 3, name: '保温', color: 'orange' }
]

const selectedMode = computed({
  get: () => {
    const currentMode = (props.device as any)?.riceCookerCurrentMode ?? 0
    // 从详细模式ID推导主模式ID
    if (currentMode >= 0 && currentMode <= 4) return 0
    if (currentMode >= 10 && currentMode <= 12) return 1
    if (currentMode >= 20 && currentMode <= 24) return 2
    if (currentMode >= 30 && currentMode <= 34) return 3
    return 0
  },
  set: (modeId: number) => { if (props.device) store.setDeviceExtra(props.device.id, { riceCookerCurrentMode: modeId }) }
})

const handleModeSelect = (modeId: number) => {
  if (props.device?.status === 'offline') return
  // 写入主模式id作为临时值，长按弹窗选完详细模式后会覆盖
  store.setDeviceExtra(props.device!.id, { riceCookerCurrentMode: modeId })
  if (modeId === 3) {
    emit('open-keep-warm-settings')
    return
  }
  emit('open-mode-selector', modeId)
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-rice-cooker-bar" @click.stop>
      <div class="rice-cooker-bar-content">
        <!-- 左侧电源按钮 -->
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
        
        <!-- 右侧模式选择 -->
        <div class="mode-section">
          <div 
            v-for="mode in modes" 
            :key="mode.id"
            class="mode-btn"
            :class="{ 
              active: selectedMode === mode.id,
              disabled: device.status === 'offline',
              [mode.color]: true
            }"
            @click="handleModeSelect(mode.id)"
          >
            <span class="mode-label">{{ mode.name }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 电饭煲</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-rice-cooker-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.rice-cooker-bar-content {
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
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.mode-section {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mode-section::-webkit-scrollbar {
  display: none;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.mode-btn.active {
  background: var(--bottom-bar-active-bg);
  border: none;
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-btn.orange.active {
  background: rgb(251, 146, 60);
}

.mode-btn.blue.active {
  background: var(--bottom-bar-active-bg);
}

.mode-btn.green.active {
  background: rgb(34, 197, 94);
}

.mode-label {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.mode-btn.active .mode-label {
  color: white;
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
