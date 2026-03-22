<!--
  投影仪长按弹窗
  功能：显示投影仪遥控器界面，包括电源、音量、方向键、对焦等控制
-->
<script setup lang="ts">
import type { Device } from '@/features/device/store/devices.store'

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

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}

// 遥控器按钮点击
const handleRemoteButton = (button: string) => {
  if (props.device?.status === 'offline') return
  console.log('投影仪遥控器按钮:', button)
  // 这里可以添加实际的遥控器功能
}
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

          <!-- 遥控器区域 -->
          <div class="remote-control">
            <!-- 顶部按钮行：电源、音量减、音量加 -->
            <div class="top-buttons">
              <div 
                class="remote-btn power-btn"
                :class="{ active: device.status === 'online' }"
                @click="togglePower"
              >
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <div 
                class="remote-btn volume-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('volume-down')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="volume-text">−</span>
              </div>
              
              <div 
                class="remote-btn volume-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('volume-up')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="volume-text">+</span>
              </div>
            </div>

            <!-- 方向键和OK按钮 -->
            <div class="direction-pad">
              <!-- 上 -->
              <div 
                class="direction-btn up"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('up')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <!-- 左 -->
              <div 
                class="direction-btn left"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('left')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <!-- OK按钮 -->
              <div 
                class="ok-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('ok')"
              >
                <span>OK</span>
              </div>
              
              <!-- 右 -->
              <div 
                class="direction-btn right"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('right')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <!-- 下 -->
              <div 
                class="direction-btn down"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('down')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- 底部按钮行：返回、主页、菜单、对焦 -->
            <div class="bottom-buttons">
              <div 
                class="remote-btn function-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('back')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="btn-label">返回</span>
              </div>
              
              <div 
                class="remote-btn function-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('home')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="btn-label">主页</span>
              </div>
              
              <div 
                class="remote-btn function-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('menu')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="btn-label">菜单</span>
              </div>
              
              <div 
                class="remote-btn function-btn focus-btn"
                :class="{ disabled: device.status === 'offline' }"
                @click="handleRemoteButton('focus')"
              >
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="btn-label">对焦</span>
              </div>
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

/* 遥控器区域 */
.remote-control {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

/* 顶部按钮行 */
.top-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.remote-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.remote-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.remote-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.remote-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.volume-btn {
  position: relative;
}

.volume-text {
  position: absolute;
  bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

/* 方向键区域 */
.direction-pad {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 8px;
}

.direction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.direction-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.direction-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.direction-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.direction-btn.up {
  grid-column: 2;
  grid-row: 1;
  justify-self: center;
}

.direction-btn.left {
  grid-column: 1;
  grid-row: 2;
  justify-self: center;
}

.direction-btn.right {
  grid-column: 3;
  grid-row: 2;
  justify-self: center;
}

.direction-btn.down {
  grid-column: 2;
  grid-row: 3;
  justify-self: center;
}

/* OK按钮 */
.ok-btn {
  grid-column: 2;
  grid-row: 2;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.ok-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.ok-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.ok-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 底部按钮行 */
.bottom-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.function-btn {
  width: 68px;
  height: 68px;
}

.focus-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.focus-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}

.btn-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
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
