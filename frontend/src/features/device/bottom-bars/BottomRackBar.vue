<!--
  晾衣架底部控制栏
  功能：单击设备卡片后显示，提供电源开关、升降控制（上升/停止/下降）
  触发：单击晾衣架设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/devices.store'
import { INTERACTION_TIMING } from '@/constants'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'lift-up'): void
  (e: 'lift-stop'): void
  (e: 'lift-down'): void
}>()

const isMoving = ref<'up' | 'down' | 'stop' | null>(null)

const handleUp = () => {
  if (props.device?.status === 'offline') return
  isMoving.value = 'up'
  emit('lift-up')
  setTimeout(() => { isMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}

const handleStop = () => {
  if (props.device?.status === 'offline') return
  isMoving.value = 'stop'
  emit('lift-stop')
  setTimeout(() => { isMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}

const handleDown = () => {
  if (props.device?.status === 'offline') return
  isMoving.value = 'down'
  emit('lift-down')
  setTimeout(() => { isMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}

watch(() => props.device?.id, () => {
  isMoving.value = null
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-rack-bar" @click.stop>
      <div class="rack-bar-content">
        <!-- 左侧电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭电源' : '开启电源' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧升降控制 -->
        <div class="lift-section">
          <div 
            class="lift-btn"
            :class="{ active: isMoving === 'up', disabled: device.status === 'offline' }"
            @click="handleUp"
          >
            <span class="lift-text">上升</span>
            <svg class="lift-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div 
            class="lift-btn"
            :class="{ active: isMoving === 'stop', disabled: device.status === 'offline' }"
            @click="handleStop"
          >
            <span class="lift-text">停止</span>
            <svg class="lift-icon-stop" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          
          <div 
            class="lift-btn"
            :class="{ active: isMoving === 'down', disabled: device.status === 'offline' }"
            @click="handleDown"
          >
            <span class="lift-text">下降</span>
            <svg class="lift-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 晾衣架</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-rack-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.rack-bar-content {
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
  gap: 8px;
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

.lift-section {
  display: flex;
  gap: 8px;
}

.lift-btn {
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

.lift-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.lift-btn.active {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
}

.lift-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lift-icon {
  width: 18px;
  height: 18px;
}

.lift-icon-stop {
  width: 18px;
  height: 18px;
}

.lift-text {
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
