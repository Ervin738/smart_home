<!--
  电磁炉长按弹窗
  功能：显示电磁炉控制界面，包括烹饪模式选择
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const selectedCookingMode = computed<number>({
  get: () => (props.device as any)?.inductionCookingMode ?? -1,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { inductionCookingMode: v }) }
})
const isCooking = computed<boolean>({
  get: () => (props.device as any)?.inductionIsCooking ?? false,
  set: (v) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { inductionIsCooking: v }) }
})

// 烹饪模式
const cookingModes = [
  { name: '手动' },
  { name: '火锅' },
  { name: '蒸煮' },
  { name: '汤粥' },
  { name: '炒菜' },
  { name: '煎炸' }
]

const selectMode = (index: number) => {
  if (props.device?.status === 'offline') return
  selectedCookingMode.value = index
}

const toggleCooking = () => {
  if (props.device?.status === 'offline' || selectedCookingMode.value < 0) return
  isCooking.value = !isCooking.value
  if (isCooking.value) {
    console.log('开始烹饪模式:', cookingModes[selectedCookingMode.value]?.name)
  } else {
    console.log('停止烹饪')
  }
}

watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    devicesStore.setDeviceExtra(props.device.id, {
      inductionCookingMode: -1,
      inductionIsCooking: false,
    })
  }
})

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content induction-cooker-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">电磁炉</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <div class="induction-cooker-layout">
          <!-- 开关按钮 -->
          <div class="power-control">
            <div 
              class="power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="power-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
          </div>

          <!-- 烹饪模式选择 -->
          <div class="mode-section">
            <div class="mode-container">
              <div class="section-title">烹饪模式 <span class="section-subtitle">| {{ selectedCookingMode >= 0 ? cookingModes[selectedCookingMode]?.name : '未选择' }}</span></div>
              <div class="mode-buttons">
                <div 
                  v-for="(mode, index) in cookingModes" 
                  :key="index"
                  class="mode-btn"
                  :class="{ 
                    active: selectedCookingMode === index,
                    disabled: device.status === 'offline'
                  }"
                  @click="selectMode(index)"
                >
                  <span class="mode-text">{{ mode.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 模式开始/停止按钮 -->
          <div class="start-btn-wrapper">
            <div 
              class="start-mode-btn"
              :class="{ 
                disabled: device.status === 'offline' || selectedCookingMode < 0,
                cooking: isCooking
              }"
              @click="toggleCooking"
            >
              <svg v-if="!isCooking" class="start-icon" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              <svg v-else class="start-icon" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
              </svg>
              <span class="start-text">{{ isCooking ? '停止' : '开始' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.induction-cooker-dialog {
  width: 360px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-info {
  flex: 1;
}

.device-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
}

.device-type-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.device-status-tag {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.device-status-tag.online {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.2) 100%);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.device-status-tag.offline {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(100, 116, 139, 0.15) 100%);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.induction-cooker-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.power-control {
  display: flex;
  gap: 10px;
}

.power-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.power-icon {
  width: 18px;
  height: 18px;
}

.power-text {
  font-size: 15px;
  font-weight: 600;
}

.mode-section {
  display: flex;
  flex-direction: column;
}

.mode-container {
  padding: 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mode-btn {
  padding: 18px 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(.disabled):not(.active) {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.5) 0%, rgba(71, 85, 105, 0.4) 100%);
  border-color: rgba(148, 163, 184, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mode-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  transform: translateY(-2px);
  box-shadow: none;
}

.mode-btn.active .mode-text {
  color: white;
  font-weight: 600;
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-text {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.start-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.start-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 40px;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
  border: none;
}

.start-mode-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 208, 206, 0.4);
}

.start-mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%);
  box-shadow: none;
}

.start-mode-btn.cooking {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.start-mode-btn.cooking:hover:not(.disabled) {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.start-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.start-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
