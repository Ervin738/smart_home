<!--
  加湿器底部控制栏
  功能：单击加湿器设备卡片后显示，提供电源开关和湿度档位调节
  触发：单击加湿器设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'select-level', level: number): void
}>()

const selectedLevel = ref(1)

const levels = [
  { label: '1档', value: 1 },
  { label: '2档', value: 2 },
  { label: '3档', value: 3 },
  { label: '恒湿', value: 4 }
]

const handleLevelSelect = (level: number) => {
  if (props.device?.status === 'offline') return
  selectedLevel.value = level
  emit('select-level', level)
}

// 当设备改变时，恢复该设备的档位状态
watch(() => props.device?.id, (newId) => {
  if (newId && props.device) {
    // 从设备属性中恢复档位，如果没有则默认为1
    selectedLevel.value = (props.device as any).humidifierLevel || 1
  }
})

// 当档位改变时，同步到设备对象
watch(selectedLevel, (newLevel) => {
  if (props.device) {
    (props.device as any).humidifierLevel = newLevel
  }
})

// 初始化时恢复状态
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    selectedLevel.value = (props.device as any).humidifierLevel || 1
  }
})

// 关闭电源时重置档位为1档
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    selectedLevel.value = 1
    if (props.device) {
      (props.device as any).humidifierLevel = 1
    }
  }
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-humidifier-bar" @click.stop>
      <div class="humidifier-bar-content">
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
        
        <!-- 右侧档位选择 -->
        <div class="level-section">
          <div 
            v-for="level in levels" 
            :key="level.value"
            class="level-btn"
            :class="{ 
              active: selectedLevel === level.value,
              disabled: device.status === 'offline'
            }"
            @click="handleLevelSelect(level.value)"
          >
            <span class="level-label">{{ level.label }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 加湿器</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-humidifier-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.humidifier-bar-content {
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
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
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
  color: white;
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

.level-section {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.level-section::-webkit-scrollbar {
  display: none;
}

.level-btn {
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

.level-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.level-btn.active {
  background: rgb(59, 130, 246);
  border: none;
}

.level-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-label {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.level-btn.active .level-label {
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
