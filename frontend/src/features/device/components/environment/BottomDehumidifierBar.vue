<!--
  除湿机底部控制栏
  功能：单击除湿机设备卡片后显示，提供电源开关和模式切换
  触发：单击除湿机设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
}>()

const devicesStore = useDevicesStore()

const modes = [
  { label: '智能', value: 0 },
  { label: '睡眠', value: 1 },
  { label: '干衣', value: 2 }
]

const selectedMode = ref(0)

const handleModeSelect = (mode: number) => {
  if (props.device?.status === 'offline') return
  selectedMode.value = mode
  if (props.device) {
    devicesStore.setDehumidifierMode(props.device.id, mode)
  }
}

// 当设备改变时，恢复该设备的模式状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    const device = props.device as any
    selectedMode.value = device.dehumidifierModeIndex || 0
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const device = props.device as any
    selectedMode.value = device.dehumidifierModeIndex || 0
  }
})

// 关闭电源时重置模式为智能
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    selectedMode.value = 0
    if (props.device) {
      const device = props.device as any
      device.dehumidifierModeIndex = 0
    }
  }
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-dehumidifier-bar" @click.stop>
      <div class="dehumidifier-bar-content">
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
            :key="mode.value"
            class="mode-btn"
            :class="{ 
              active: selectedMode === mode.value,
              disabled: device.status === 'offline'
            }"
            @click="handleModeSelect(mode.value)"
          >
            <span class="mode-label">{{ mode.label }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 除湿机</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-dehumidifier-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.dehumidifier-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: rgb(59, 130, 246);
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
  padding: 14px 24px;
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
  background: rgb(59, 130, 246);
  border: none;
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
