<!--
  洗衣机/烘干机底部控制栏
  功能：单击设备卡片后显示，提供电源开关控制
  触发：单击洗衣机或烘干机设备卡片
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Device } from '@/features/device/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'start-wash'): void
  (e: 'select-mode', mode: string): void
}>()

const selectedModeIndex = ref(-1)
const isWorking = ref(false)

// 根据设备类型返回不同的模式
const modes = computed(() => {
  if (props.device?.cleanerType === 'dryer') {
    return ['智能烘', '快速烘', '节能烘']
  }
  return ['智能洗', '快速洗', '强力洗', '轻柔洗']
})

// 根据设备类型返回不同的按钮文字
const actionLabel = computed(() => {
  if (props.device?.cleanerType === 'dryer') {
    return isWorking.value ? '暂停烘干' : '开始烘干'
  }
  return isWorking.value ? '暂停清洗' : '开始清洗'
})

// 根据设备类型返回不同的设备类型名称
const deviceTypeLabel = computed(() => {
  if (props.device?.cleanerType === 'dryer') {
    return '烘干机'
  }
  return '洗衣机'
})

const canStart = computed(() => {
  return props.device?.status === 'online' && selectedModeIndex.value !== -1
})

const handleModeSelect = (index: number) => {
  if (props.device?.status === 'offline') return
  selectedModeIndex.value = index
  const mode = modes.value[index]
  if (mode) emit('select-mode', mode)
}

const handleStart = () => {
  if (!canStart.value) return
  isWorking.value = !isWorking.value
  emit('start-wash')
}

// 重置状态当设备改变
watch(() => props.device?.id, () => {
  selectedModeIndex.value = -1
  isWorking.value = false
})

// 关闭电源时停止工作并取消模式选择
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    isWorking.value = false
    selectedModeIndex.value = -1
  }
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-wash-bar" @click.stop>
      <div class="wash-bar-content">
        <!-- 左侧控制按钮 -->
        <div class="control-section">
          <div 
            class="control-btn power-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <span class="btn-text">{{ device.status === 'online' ? '关闭电源' : '打开电源' }}</span>
          </div>
          <div 
            class="control-btn wash-btn"
            :class="{ active: isWorking, disabled: !canStart }"
            @click="handleStart"
          >
            <span class="btn-text">{{ actionLabel }}</span>
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
              disabled: device.status === 'offline'
            }"
            @click="handleModeSelect(index)"
          >
            {{ mode }}
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · {{ deviceTypeLabel }}</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-wash-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.wash-bar-content {
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  padding: 14px 20px;
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
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
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
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
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
