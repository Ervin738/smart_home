<!--
  扫地机器人底部控制栏
  功能：单击设备卡片后显示，提供开始清扫/暂停、清扫模式选择
  触发：单击扫地机器人设备卡片
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'toggle-cleaning'): void
  (e: 'go-charge'): void
  (e: 'select-mode', mode: string): void
}>()

const store = useDevicesStore()
const isCharging = ref(false)
const modes = ['扫地', '拖地', '边扫边拖', '先扫后拖']

const selectedModeIndex = computed({
  get: () => (props.device as any)?.robotModeIndex ?? -1,
  set: (index: number) => { if (props.device) store.setDeviceExtra(props.device.id, { robotModeIndex: index }) }
})

const isCleaning = computed({
  get: () => (props.device as any)?.robotIsCleaning ?? false,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { robotIsCleaning: v }) }
})

const canOperate = computed(() => props.device?.status === 'online')

const handleModeSelect = (index: number) => {
  if (!canOperate.value) return
  selectedModeIndex.value = index
  const mode = modes[index]
  if (mode) emit('select-mode', mode)
}

const handleGoCharge = () => {
  isCharging.value = true
  isCleaning.value = false
  selectedModeIndex.value = -1
  emit('go-charge')
  setTimeout(() => { isCharging.value = false }, 2000)
}

const handleToggleCleaning = () => {
  if (!canOperate.value || selectedModeIndex.value === -1) return
  isCleaning.value = !isCleaning.value
  emit('toggle-cleaning')
}

watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    store.setDeviceExtra(props.device.id, { robotModeIndex: -1, robotIsCleaning: false })
  }
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-robot-bar" @click.stop>
      <div class="robot-bar-content">
        <!-- 左侧控制按钮 -->
        <div class="control-section">
          <div 
            class="control-btn power-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
          <div 
            class="control-btn"
            :class="{ active: isCleaning, disabled: !canOperate || selectedModeIndex === -1 }"
            @click="handleToggleCleaning"
          >
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ isCleaning ? '暂停清扫' : '开始清洁' }}</span>
          </div>
          <div 
            class="control-btn"
            :class="{ active: isCharging }"
            @click="handleGoCharge"
          >
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">返回基站</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧模式选择 -->
        <div class="mode-section">
          <div 
            v-for="(mode, index) in modes" 
            :key="index"
            class="mode-btn"
            :class="{ 
              active: selectedModeIndex === index,
              disabled: !canOperate
            }"
            @click="handleModeSelect(index)"
          >
            {{ mode }}
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 扫地机器人</div>
      </div>
    </div>
  </transition>
</template>


<style scoped>
.bottom-robot-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.robot-bar-content {
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
  gap: 6px;
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

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon-svg {
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
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 600;
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
  color: white;
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
