<!--
  电热水壶底部控制栏
  功能：单击电热水壶设备卡片后显示，提供加热按钮
  触发：单击电热水壶设备卡片
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'toggle-power'): void
  (e: 'open-heating'): void
}>()

const store = useDevicesStore()

const keepWarmEnabled = computed({
  get: () => (props.device as any)?.kettleAutoKeepWarm ?? true,
  set: (v: boolean) => { if (props.device) store.setDeviceExtra(props.device.id, { kettleAutoKeepWarm: v }) }
})

</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-kettle-bar" @click.stop>
      <div class="kettle-bar-content">
        <!-- 电源按钮 -->
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

        <!-- 保温功能 toggle -->
        <div class="toggle-section">
          <span class="toggle-label">保温</span>
          <label class="bar-toggle">
            <input
              type="checkbox"
              v-model="keepWarmEnabled"
              :disabled="device.status === 'offline'"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 加热按钮 -->
        <div class="heating-section">
          <div 
            class="heating-btn"
            :class="{ disabled: device.status === 'offline' }"
            @click="device.status === 'online' && emit('open-heating')"
          >
            <svg class="heating-icon" viewBox="0 0 24 24" fill="none">
              <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="heating-text">加热</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 电热水壶</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-kettle-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.kettle-bar-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px 18px 18px;
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  backdrop-filter: blur(10px);
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: var(--dialog-btn-active-light-bg-1);
  border: 1.5px solid var(--dialog-btn-active-light-border);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:hover {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.control-btn.active {
  background: var(--bottom-bar-active-bg);
  border: none;
  color: white;
  box-shadow: none;
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
  width: 1.5px;
  height: 32px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  margin: 0 8px;
  border-radius: 2px;
}

.heating-section {
  display: flex;
  gap: 8px;
}

.heating-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba(38, 208, 206, 0.25) 0%, rgba(31, 161, 159, 0.2) 100%);
  border: 1.5px solid rgba(38, 208, 206, 0.35);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.heating-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(38, 208, 206, 0.35) 0%, rgba(31, 161, 159, 0.3) 100%);
  border-color: rgba(38, 208, 206, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(38, 208, 206, 0.25);
}

.heating-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.heating-icon {
  width: 18px;
  height: 18px;
}

.heating-text {
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

.toggle-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.toggle-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.bar-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}

.bar-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.bar-toggle .toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  transition: all 0.3s ease;
  border-radius: 26px;
}

.bar-toggle .toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bar-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 10px rgba(38, 208, 206, 0.4);
}

.bar-toggle input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

.bar-toggle input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
