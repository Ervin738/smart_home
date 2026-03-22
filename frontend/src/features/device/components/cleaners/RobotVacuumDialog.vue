<!--
  扫地机器人设备对话框
  功能：长按扫地机器人设备卡片后显示，提供清扫控制、模式选择、吸力和水量调节
  触发：长按扫地机器人设备卡片
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'
import { useRobotControl, useVerticalSlider } from '@/features/device/composables'
import { INTERACTION_TIMING } from '@/constants'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'toggle-cleaning'): void
  (e: 'charge'): void
  (e: 'update:mode', index: number): void
}>()

const devicesStore = useDevicesStore()
const activeControlIndex = ref(-1)

const activeModeIndex = computed({
  get: () => (props.device as any)?.robotModeIndex ?? -1,
  set: (index: number) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { robotModeIndex: index }) }
})

const isCleaning = computed({
  get: () => (props.device as any)?.robotIsCleaning ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { robotIsCleaning: v }) }
})

// 使用扫地机器人控制
const {
  suctionLevel: robotSuctionLevel,
  waterLevel: robotWaterLevel,
  suctionLevels,
  waterLevels,
  adjustSuction,
  adjustWater
} = useRobotControl()

// 弹窗显示或设备切换时恢复吸力/水量档位
watch(() => [props.visible, props.device?.id], () => {
  if (props.visible && props.device) {
    const d = props.device as any
    robotSuctionLevel.value = d.robotSuctionLevel ?? 1
    robotWaterLevel.value = d.robotWaterLevel ?? 1
  }
}, { immediate: true })

// 档位变化时持久化
watch(robotSuctionLevel, (val) => {
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { robotSuctionLevel: val })
})
watch(robotWaterLevel, (val) => {
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { robotWaterLevel: val })
})

// 使用滑动控制
const suctionSlider = useVerticalSlider(adjustSuction)
const waterSlider = useVerticalSlider(adjustWater)

const modeOptions = [
  { label: '扫地', icon: 'sweep' },
  { label: '拖地', icon: 'mop' },
  { label: '边扫边拖', icon: 'sweep-mop' },
  { label: '先扫后拖', icon: 'sweep-then-mop' }
]

const handleModeSelect = (index: number) => {
  if (!props.device || props.device.status === 'offline') return
  activeModeIndex.value = index
  emit('update:mode', index)
}

watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    activeControlIndex.value = -1
    devicesStore.setDeviceExtra(props.device.id, { robotModeIndex: -1, robotIsCleaning: false })
  }
}, { flush: 'post' })

const handleCharge = () => {
  if (!props.device || props.device.status === 'offline') return
  activeControlIndex.value = 1
  isCleaning.value = false
  activeModeIndex.value = -1
  emit('charge')
  setTimeout(() => {
    if (activeControlIndex.value === 1) activeControlIndex.value = -1
  }, INTERACTION_TIMING.CHARGE_DELAY)
}

const handleToggleCleaning = () => {
  if (!props.device || props.device.status === 'offline' || activeModeIndex.value === -1) return
  isCleaning.value = !isCleaning.value
  emit('toggle-cleaning')
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content robot-vacuum-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">扫地机器人</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <!-- 电源控制按钮 -->
        <div class="power-control-section">
          <div 
            class="power-control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <div 
            class="control-btn"
            :class="{ 'power-on': isCleaning, disabled: device.status === 'offline' || activeModeIndex === -1 }"
            @click="handleToggleCleaning"
          >
            <svg class="btn-svg-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-label">{{ isCleaning ? '暂停清扫' : '开始清洁' }}</span>
          </div>
          <div 
            class="control-btn"
            :class="{ active: activeControlIndex === 1, disabled: device.status === 'offline' }"
            @click="device.status === 'online' && handleCharge()"
          >
            <svg class="btn-svg-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-label">返回基站</span>
          </div>
        </div>
        
        <div class="robot-control-layout" :class="{ disabled: device.status === 'offline' }">
          <!-- 左侧清洁模式 -->
          <div class="robot-mode-section">
            <div class="mode-title">清洁模式</div>
            <div class="robot-mode-list">
              <div 
                v-for="(mode, index) in modeOptions" 
                :key="index"
                class="robot-mode-btn"
                :class="{ active: activeModeIndex === index, disabled: device.status === 'offline' }"
                @click="handleModeSelect(index)"
              >
                <svg v-if="mode.icon === 'sweep'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20h16M8 16v4M16 16v4M6 16h12l-2-8H8l-2 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else-if="mode.icon === 'mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v10M8 13h8l2 8H6l2-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 17h8M9 20h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <svg v-else-if="mode.icon === 'sweep-mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20h7M17 20h3M8 16v4M6 16h6l-1-6H7l-1 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 13h6l1 7h-8l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="9" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else-if="mode.icon === 'sweep-then-mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18h8M7 14v4M5 14h4l-1-5H6l-1 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 8l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M17 12v6M15 18h6l1-6h-8l1 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="robot-mode-label">{{ mode.label }}</span>
              </div>
            </div>
          </div>
          
          <!-- 右侧吸力和水量控制 -->
          <div class="robot-slider-section">
            <div class="robot-slider-group">
              <div class="robot-slider-title">吸力</div>
              <div 
                class="robot-vertical-slider"
                :class="{ disabled: device.status === 'offline' }"
                @touchstart="device.status === 'online' && suctionSlider.onDragStart($event)"
                @touchmove="device.status === 'online' && suctionSlider.onDragMove($event)"
                @touchend="device.status === 'online' && suctionSlider.onDragEnd()"
                @mousedown="device.status === 'online' && suctionSlider.onDragStart($event)"
                @mousemove="device.status === 'online' && suctionSlider.onDragMove($event)"
                @mouseup="device.status === 'online' && suctionSlider.onDragEnd()"
                @mouseleave="device.status === 'online' && suctionSlider.onDragEnd()"
                @wheel="device.status === 'online' && suctionSlider.onWheel($event)"
              >
                <div class="slider-track-vertical">
                  <div class="slider-thumb-card" :style="{ top: (4 + (2 - robotSuctionLevel) * 106) + 'px' }">
                    {{ suctionLevels[robotSuctionLevel] }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="robot-slider-group">
              <div class="robot-slider-title">水量</div>
              <div 
                class="robot-vertical-slider"
                :class="{ disabled: device.status === 'offline' }"
                @touchstart="device.status === 'online' && waterSlider.onDragStart($event)"
                @touchmove="device.status === 'online' && waterSlider.onDragMove($event)"
                @touchend="device.status === 'online' && waterSlider.onDragEnd()"
                @mousedown="device.status === 'online' && waterSlider.onDragStart($event)"
                @mousemove="device.status === 'online' && waterSlider.onDragMove($event)"
                @mouseup="device.status === 'online' && waterSlider.onDragEnd()"
                @mouseleave="device.status === 'online' && waterSlider.onDragEnd()"
                @wheel="device.status === 'online' && waterSlider.onWheel($event)"
              >
                <div class="slider-track-vertical water">
                  <div class="slider-thumb-card" :style="{ top: (4 + (2 - robotWaterLevel) * 106) + 'px' }">
                    {{ waterLevels[robotWaterLevel] }}
                  </div>
                </div>
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
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.robot-vacuum-dialog {
  width: 340px;
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

/* 电源控制按钮样式 */
.power-control-section {
  margin-bottom: 16px;
}

.power-control-btn {
  display: flex;
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

.power-control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.power-control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.power-control-btn .btn-icon {
  width: 18px;
  height: 18px;
}

.power-control-btn .btn-label {
  font-size: 16px;
  font-weight: 700;
}

/* 控制按钮样式 */
.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.control-btn {
  flex: 1;
  display: flex;
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

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.control-btn.power-on {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-svg-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-label {
  font-size: 16px;
  font-weight: 700;
}

/* 扫地机器人专用布局样式 */
.robot-control-layout {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.robot-control-layout.disabled .robot-mode-btn,
.robot-control-layout.disabled .robot-vertical-slider {
  pointer-events: none;
}

.robot-mode-section {
  flex: 1;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 14px;
  text-align: center;
}

.robot-mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.robot-mode-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 8px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.robot-mode-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.robot-mode-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.robot-mode-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.robot-mode-label {
  font-size: 16px;
  font-weight: 700;
}

.robot-mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.robot-vertical-slider.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 右侧滑块区域 */
.robot-slider-section {
  display: flex;
  gap: 16px;
}

.robot-slider-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.robot-slider-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.robot-vertical-slider {
  position: relative;
  width: 76px;
  height: 280px;
  cursor: pointer;
}

.slider-track-vertical {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(120, 140, 170, 0.5) 0%,
    rgba(100, 120, 150, 0.4) 100%
  );
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.slider-track-vertical.water {
  background: linear-gradient(
    180deg,
    rgba(80, 150, 220, 0.6) 0%,
    rgba(60, 130, 200, 0.5) 100%
  );
}

.slider-thumb-card {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 68px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 248, 255, 0.95) 100%);
  border-radius: 18px;
  font-size: 16px;
  font-weight: 600;
  color: #2c5282;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: top 0.2s ease;
  cursor: grab;
  user-select: none;
}

.slider-thumb-card:active {
  cursor: grabbing;
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
