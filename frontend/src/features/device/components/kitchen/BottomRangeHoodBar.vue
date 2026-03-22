<!--
  净烟机底部控制栏
  功能：单击净烟机设备卡片后显示，提供快速档位选择
  触发：单击净烟机设备卡片
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
  (e: 'select-level', level: number): void
}>()

const store = useDevicesStore()

// 档位选项
const levels = [
  { id: 0, name: '一档' },
  { id: 1, name: '二档' },
  { id: 2, name: '三档' },
  { id: 3, name: '四档' }
]

const selectedLevel = ref(0)

// 弹窗显示或设备切换时恢复状态
watch(() => [props.visible, props.device?.id], () => {
  if (props.visible && props.device) {
    selectedLevel.value = (props.device as any).rangeHoodLevel ?? 0
  }
}, { immediate: true })

const handleLevelSelect = (levelId: number) => {
  if (props.device?.status === 'offline') return
  selectedLevel.value = levelId
  if (props.device) {
    store.setDeviceExtra(props.device.id, { rangeHoodLevel: levelId })
  }
  emit('select-level', levelId)
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-range-hood-bar" @click.stop>
      <div class="range-hood-bar-content">
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
            :key="level.id"
            class="level-btn"
            :class="{ 
              active: selectedLevel === level.id,
              disabled: device.status === 'offline'
            }"
            @click="handleLevelSelect(level.id)"
          >
            <span class="level-label">{{ level.name }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 净烟机</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-range-hood-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.range-hood-bar-content {
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
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.level-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.level-btn.active {
  background: var(--bottom-bar-active-bg);
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
