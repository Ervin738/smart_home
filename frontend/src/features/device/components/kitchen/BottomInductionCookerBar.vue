<!--
  电磁炉底部控制栏
  功能：单击电磁炉设备卡片后显示，提供状态显示和开关控制
  触发：单击电磁炉设备卡片
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

const store = useDevicesStore()
const isCooking = ref(false)
const remainingMinutes = ref(0)

// 弹窗显示或设备切换时恢复状态
watch(() => [props.visible, props.device?.id], () => {
  if (props.visible && props.device) {
    isCooking.value = (props.device as any).inductionIsCooking ?? false
    remainingMinutes.value = (props.device as any).inductionRemainingMinutes ?? 0
  }
}, { immediate: true })

const toggleCooking = () => {
  isCooking.value = !isCooking.value
  if (!isCooking.value) {
    remainingMinutes.value = 0
  }
  if (props.device) {
    store.setDeviceExtra(props.device.id, {
      inductionIsCooking: isCooking.value,
      inductionRemainingMinutes: remainingMinutes.value
    })
  }
  emit('toggle-power')
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-induction-cooker-bar" @click.stop>
      <div class="induction-cooker-bar-content">
        <!-- 左侧开关按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: isCooking }"
            @click="toggleCooking"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ isCooking ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 中间状态显示 -->
        <div class="status-section">
          <div class="status-title">{{ isCooking ? '烹饪中' : '已停止' }}</div>
          <div class="status-subtitle">状态</div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧剩余时间 -->
        <div class="time-section">
          <div class="time-value">{{ remainingMinutes }}<span class="time-unit">分</span></div>
          <div class="time-label">剩余时间</div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 电磁炉</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-induction-cooker-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.induction-cooker-bar-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
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

.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.status-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.status-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.time-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 100px;
}

.time-value {
  font-size: 28px;
  font-weight: 600;
  color: white;
  line-height: 1;
}

.time-unit {
  font-size: 16px;
  margin-left: 2px;
}

.time-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
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
