<!--
  香薰机底部控制栏
  功能：单击香薰机设备卡片后显示，提供快速控制
  触发：单击香薰机设备卡片
-->
<script setup lang="ts">
import type { Device } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'quick-aroma'): void
}>()

const handleQuickAroma = () => {
  if (props.device?.status === 'offline') return
  emit('quick-aroma')
}

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-aroma-bar" @click.stop>
      <div class="aroma-bar-content">
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
        
        <!-- 快速出香按钮 -->
        <div class="quick-section">
          <div 
            class="quick-btn"
            :class="{ disabled: device.status === 'offline' }"
            @click="handleQuickAroma"
          >
            <div class="quick-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 8M12 8C10 8 8 9 8 12C8 15 10 16 12 16M12 8C14 8 16 9 16 12C16 15 14 16 12 16M12 16L12 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <span class="quick-label">快速出香</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 香薰机</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-aroma-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.aroma-bar-content {
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
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 14px;
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
  border-radius: 14px;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-text {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.quick-section {
  display: flex;
  gap: 8px;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.25) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.quick-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.35) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: none;
}

.quick-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-icon svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.quick-label {
  font-size: 14px;
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
