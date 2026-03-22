<!--
  音箱长按弹窗
  功能：显示音箱控制界面，包括音量调节、播放控制等功能
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const devicesStore = useDevicesStore()

const volume = computed({
  get: () => (props.device as any)?.speakerVolume ?? 50,
  set: (v: number) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { speakerVolume: v }) }
})

const isPlaying = computed({
  get: () => (props.device as any)?.speakerIsPlaying ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { speakerIsPlaying: v }) }
})

const close = () => emit('update:visible', false)
const togglePower = () => emit('toggle-power')
const openTimer = () => emit('open-timer')

const adjustVolume = (delta: number) => {
  if (props.device?.status === 'offline') return
  volume.value = Math.max(0, Math.min(100, volume.value + delta))
}

const togglePlay = () => {
  if (props.device?.status === 'offline') return
  isPlaying.value = !isPlaying.value
}

const previousTrack = () => { if (props.device?.status === 'offline') return }
const nextTrack = () => { if (props.device?.status === 'offline') return }
</script>

<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @click="close">
        <div class="dialog-box" @click.stop>
          <!-- 头部 -->
          <div class="dialog-header">
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-status" :class="device.status">
                {{ device.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
          </div>

          <!-- 音量显示 -->
          <div class="volume-display">
            <div class="volume-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="volume-value">{{ volume }}</div>
            <div class="volume-label">音量</div>
          </div>

          <!-- 音量调节 -->
          <div class="volume-control">
            <div class="volume-control-header">
              <span class="control-label">音量</span>
              <span class="control-value">{{ volume }}</span>
            </div>
            
            <div class="volume-slider-container">
              <button 
                class="volume-adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustVolume(-5)"
              >
                <span>−</span>
              </button>
              
              <div 
                class="volume-slider"
                :class="{ disabled: device.status === 'offline' }"
              >
                <div class="slider-track">
                  <div class="slider-fill" :style="{ width: volume + '%' }"></div>
                </div>
                <input 
                  type="range" 
                  v-model.number="volume" 
                  min="0" 
                  max="100" 
                  class="slider-input"
                  :disabled="device.status === 'offline'"
                  @input="volume = Number(($event.target as HTMLInputElement).value)"
                />
              </div>
              
              <button 
                class="volume-adjust-btn" 
                :class="{ disabled: device.status === 'offline' }"
                @click="adjustVolume(5)"
              >
                <span>+</span>
              </button>
            </div>
          </div>

          <!-- 播放控制 -->
          <div class="playback-controls">
            <div 
              class="control-btn"
              :class="{ disabled: device.status === 'offline' }"
              @click="previousTrack"
            >
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <path d="M19 20L9 12l10-8v16zM5 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <div 
              class="play-btn"
              :class="{ active: isPlaying, disabled: device.status === 'offline' }"
              @click="togglePlay"
            >
              <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
              </svg>
            </div>
            
            <div 
              class="control-btn"
              :class="{ disabled: device.status === 'offline' }"
              @click="nextTrack"
            >
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <path d="M5 4l10 8-10 8V4zM19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 功能按钮 -->
          <div class="action-buttons">
            <div 
              class="action-btn"
              :class="{ active: device.status === 'online' }"
              @click="togglePower"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>
            
            <div 
              class="action-btn"
              @click="openTimer"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>定时</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-box {
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px;
  width: 340px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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

.device-name {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 6px;
}

.device-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.device-status.online {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.device-status.offline {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

/* 音量显示 */
.volume-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.volume-icon-wrapper {
  color: var(--dialog-text);
  margin-bottom: 12px;
}

.volume-value {
  font-size: 48px;
  font-weight: 200;
  color: white;
  line-height: 1;
  margin-bottom: 8px;
}

.volume-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* 音量调节 */
.volume-control {
  margin-bottom: 32px;
}

.volume-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.control-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.volume-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-adjust-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 26px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.volume-adjust-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.volume-adjust-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.volume-slider {
  flex: 1;
  height: 44px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.volume-slider.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.slider-track {
  position: relative;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--slider-active-color-1) 0%, var(--slider-active-color-3) 100%);
  border-radius: 24px;
  transition: width 0.2s ease;
  min-width: 10px;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

/* 播放控制 */
.playback-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.control-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.play-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.play-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.play-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.play-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 功能按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.action-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

/* 动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  transform: scale(0.9);
}
</style>
