<!--
  晾衣架设备对话框
  功能：长按晾衣架设备卡片后显示，提供电源控制、升降控制、工作模式选择
  触发：长按晾衣架设备卡片
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useClothesRackControl } from '@/features/device/composables'
import { INTERACTION_TIMING } from '@/constants'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'update:mode', index: number): void
}>()

const activeModeIndex = ref(-1)
const activeModes = ref<number[]>([])

// 使用晾衣架控制
const {
  lighting: clothesRackLighting,
  drying: clothesRackDrying,
  airDry: clothesRackAirDry,
  sterilize: clothesRackSterilize,
  moving: clothesRackMoving
} = useClothesRackControl()

const modeOptions = ['风干', '烘干', '消毒', '照明']

const handleModeSelect = (index: number) => {
  if (!props.device || props.device.status === 'offline') return
  const modeIndex = activeModes.value.indexOf(index)
  if (modeIndex > -1) {
    // 如果已选中，则取消选中
    activeModes.value.splice(modeIndex, 1)
  } else {
    // 如果未选中，则添加选中
    activeModes.value.push(index)
  }
  emit('update:mode', index)
}

watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    activeModeIndex.value = -1
    activeModes.value = []
    clothesRackMoving.value = null
  }
}, { flush: 'post' })

const handleClothesRackUp = () => {
  clothesRackMoving.value = 'up'
  setTimeout(() => { clothesRackMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}

const handleClothesRackDown = () => {
  clothesRackMoving.value = 'down'
  setTimeout(() => { clothesRackMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}

const handleClothesRackStop = () => {
  clothesRackMoving.value = 'stop'
  setTimeout(() => { clothesRackMoving.value = null }, INTERACTION_TIMING.RACK_ACTION_DELAY)
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content clothes-rack-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">晾衣架</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <div class="clothes-rack-layout">
          <!-- 顶部电源开关 -->
          <div class="rack-power-section">
            <div 
              class="rack-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="rack-power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="rack-power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
          </div>
          
          <!-- 升降控制 -->
          <div class="rack-lift-section">
            <div 
              class="rack-lift-btn"
              :class="{ active: clothesRackMoving === 'up', disabled: device.status === 'offline' }"
              @click="device.status === 'online' && handleClothesRackUp()"
            >
              <svg class="rack-btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="rack-btn-label">上升</div>
            </div>
            
            <div 
              class="rack-lift-btn"
              :class="{ active: clothesRackMoving === 'stop', disabled: device.status === 'offline' }"
              @click="device.status === 'online' && handleClothesRackStop()"
            >
              <svg class="rack-stop-icon" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="4" width="5" height="16" rx="1" stroke="currentColor" stroke-width="2" fill="currentColor"/>
                <rect x="14" y="4" width="5" height="16" rx="1" stroke="currentColor" stroke-width="2" fill="currentColor"/>
              </svg>
              <div class="rack-btn-label">停止</div>
            </div>
            
            <div 
              class="rack-lift-btn"
              :class="{ active: clothesRackMoving === 'down', disabled: device.status === 'offline' }"
              @click="device.status === 'online' && handleClothesRackDown()"
            >
              <svg class="rack-btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="rack-btn-label">下降</div>
            </div>
          </div>
          
          <!-- 工作模式 -->
          <div class="mode-section">
            <div class="mode-title">工作模式</div>
            <div class="rack-function-grid">
              <div 
                v-for="(mode, index) in modeOptions" 
                :key="index"
                class="rack-function-btn"
                :class="{ active: activeModes.includes(index), disabled: device.status === 'offline' }"
                @click="handleModeSelect(index)"
              >
                <svg v-if="mode === '风干'" class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="mode === '烘干'" class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg v-else-if="mode === '消毒'" class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else-if="mode === '照明'" class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18h6M10 22h4M12 2v2M12 6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M8 8l6 6 6-6a8 8 0 10-12 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="rack-func-label">{{ mode }}</span>
              </div>
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
    rgba(13, 13, 26, 0.95) 0%,
    rgba(26, 26, 46, 0.95) 25%,
    rgba(42, 58, 90, 0.95) 50%,
    rgba(58, 90, 122, 0.95) 75%,
    rgba(58, 106, 154, 0.95) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.clothes-rack-dialog {
  width: 280px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

/* 晾衣架专用布局样式 */
.clothes-rack-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rack-power-section {
  display: flex;
  justify-content: center;
}

.rack-power-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.rack-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.rack-power-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.rack-power-icon {
  width: 18px;
  height: 18px;
}

.rack-power-label {
  font-size: 16px;
  font-weight: 700;
}

.rack-lift-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rack-lift-btn {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.rack-lift-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.rack-lift-btn:active {
  transform: scale(0.98);
}

.rack-lift-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.rack-lift-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.rack-btn-label {
  font-size: 16px;
  font-weight: 700;
}

.rack-btn-icon {
  width: 28px;
  height: 28px;
}

.rack-stop-icon {
  width: 32px;
  height: 32px;
}

.mode-section {
  margin-top: 8px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 14px;
  text-align: center;
}

.rack-function-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.rack-function-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.rack-function-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.rack-function-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(79, 172, 254, 0.5) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.rack-function-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.rack-func-label {
  font-size: 16px;
  font-weight: 700;
}

.rack-func-icon {
  width: 32px;
  height: 32px;
}

/* 弹窗动画 */
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
