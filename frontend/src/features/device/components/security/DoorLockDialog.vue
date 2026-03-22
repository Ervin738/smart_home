<!--
  门锁长按弹窗
  功能：显示门锁控制界面和监控画面
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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

// 摄像头相关
const videoRef = ref<HTMLVideoElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 门锁状态（从 device extra 读取）
const isLocked = computed(() => (props.device as any)?.doorLockIsLocked ?? true)

// 异常报警
const alarmEnabled = computed({
  get: () => (props.device as any)?.doorLockAlarmEnabled ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { doorLockAlarmEnabled: v }) }
})

// 连接摄像头
const connectCamera = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    
    mediaStream.value = stream
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.play()
    }
    
    isLoading.value = false
  } catch (error: any) {
    console.error('无法访问摄像头:', error)
    isLoading.value = false
    hasError.value = true
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage.value = '摄像头权限被拒绝'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage.value = '未找到摄像头设备'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage.value = '摄像头正被其他应用使用'
    } else {
      errorMessage.value = '无法访问摄像头'
    }
  }
}

// 停止摄像头
const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

// 切换门锁状态
const toggleLock = () => {
  if (props.device?.status === 'offline') return
  devicesStore.setDeviceExtra(props.device!.id, { doorLockIsLocked: !isLocked.value })
}

// 监听弹窗关闭
watch(() => props.visible, (visible) => {
  if (!visible) {
    stopCamera()
    hasError.value = false
    errorMessage.value = ''
  }
})

onUnmounted(() => {
  stopCamera()
})

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content door-lock-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">门锁</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <div class="door-lock-layout">
          <!-- 顶部按钮组 -->
          <div class="top-buttons">
            <!-- 电源按钮 -->
            <div 
              class="door-lock-power-btn"
              :class="{ active: device.status === 'online' }"
              @click="emit('toggle-power')"
            >
              <svg class="power-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </div>

            <!-- 门锁控制 -->
            <div 
              class="lock-control-compact"
              :class="{ disabled: device.status === 'offline', locked: isLocked }"
              @click="toggleLock"
            >
              <div class="lock-icon-wrapper">
                <svg v-if="isLocked" class="lock-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 15v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg v-else class="lock-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 15v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M8 11V7a4 4 0 010-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="lock-label">{{ isLocked ? '已上锁' : '已解锁' }}</span>
            </div>
          </div>

          <!-- 监控画面 -->
          <div class="video-container">
            <!-- 加载中 -->
            <div v-if="isLoading" class="video-placeholder loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">正在连接摄像头...</span>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="hasError" class="video-placeholder error">
              <svg class="error-icon" viewBox="0 0 24 24" fill="none">
                <path d="M15 9l-6 6m0-6l6 6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="error-text">{{ errorMessage || '暂无监控画面' }}</span>
              <button 
                class="connect-btn" 
                :disabled="device.status === 'offline'"
                @click="connectCamera"
              >
                {{ errorMessage ? '重新连接' : '连接摄像头' }}
              </button>
            </div>
            
            <!-- 未连接状态 -->
            <div v-else-if="!mediaStream" class="video-placeholder">
              <svg class="camera-icon" viewBox="0 0 24 24" fill="none">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="placeholder-text">
                {{ device.status === 'offline' ? '设备离线，无法连接摄像头' : '点击下方按钮连接摄像头' }}
              </span>
              <button 
                class="connect-btn" 
                :disabled="device.status === 'offline'"
                @click="connectCamera"
              >
                连接摄像头
              </button>
            </div>
            
            <!-- 视频流 -->
            <video
              v-show="mediaStream && !isLoading && !hasError"
              ref="videoRef"
              class="video-stream"
              autoplay
              playsinline
              muted
            ></video>
            
            <!-- 视频控制栏 -->
            <div v-if="mediaStream && !isLoading && !hasError" class="video-controls">
              <div class="control-item" @click="stopCamera">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                  <path d="M9 10h6v4H9z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 控制选项 -->
          <div class="control-options">
            <div 
              class="option-item"
              :class="{ disabled: device.status === 'offline' }"
            >
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">开门记录</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div 
              class="option-item"
              :class="{ disabled: device.status === 'offline' }"
            >
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">异常报警</span>
              <label class="option-toggle">
                <input 
                  type="checkbox"
                  v-model="alarmEnabled"
                  :disabled="device.status === 'offline'"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div 
              class="option-item"
              :class="{ disabled: device.status === 'offline' }"
            >
              <svg class="option-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="option-label">指纹管理</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
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

.door-lock-dialog {
  width: 420px;
  max-width: 90vw;
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

/* 门锁布局 */
.door-lock-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部按钮组 */
.top-buttons {
  display: flex;
  gap: 12px;
}

/* 电源按钮 */
.door-lock-power-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.door-lock-power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.door-lock-power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
  outline: none;
  filter: none;
  -webkit-filter: none;
}

.power-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.power-label {
  font-size: 15px;
  font-weight: 600;
}

/* 视频容器 */
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  overflow: hidden;
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 占位符 */
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.7);
  background: linear-gradient(
    135deg,
    rgba(40, 50, 70, 0.5) 0%,
    rgba(50, 60, 80, 0.5) 100%
  );
}

.video-placeholder.loading {
  background: linear-gradient(
    135deg,
    rgba(30, 40, 60, 0.5) 0%,
    rgba(40, 55, 80, 0.5) 100%
  );
}

.video-placeholder.error {
  background: linear-gradient(
    135deg,
    rgba(50, 50, 70, 0.5) 0%,
    rgba(60, 60, 80, 0.5) 100%
  );
}

.camera-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.4);
}

.placeholder-text {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text,
.error-text {
  font-size: 15px;
  font-weight: 500;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.5);
}

.connect-btn {
  padding: 10px 24px;
  background: var(--dialog-btn-confirm-bg-1);
  border: 1px solid var(--dialog-btn-confirm-border);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.connect-btn:hover:not(:disabled) {
  background: var(--dialog-btn-active-bg-1);
  border-color: var(--dialog-btn-active-border);
  transform: translateY(-1px);
}

.connect-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%);
  border-color: rgba(100, 116, 139, 0.3);
}

/* 视频控制栏 */
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
}

.control-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.control-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-item svg {
  width: 20px;
  height: 20px;
  color: white;
}

/* 门锁控制（紧凑版） */
.lock-control-compact {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.15) 0%,
    rgba(220, 38, 38, 0.1) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.lock-control-compact.locked {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.15) 0%,
    rgba(22, 163, 74, 0.1) 100%
  );
  border-color: rgba(34, 197, 94, 0.3);
}

.lock-control-compact:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(220, 38, 38, 0.2) 100%
  );
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.lock-control-compact.locked:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.25) 0%,
    rgba(22, 163, 74, 0.2) 100%
  );
  border-color: rgba(34, 197, 94, 0.4);
}

.lock-control-compact.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.lock-control-compact .lock-icon-wrapper {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: none;
}

.lock-control-compact .lock-icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}

.lock-label {
  font-size: 15px;
  font-weight: 600;
}

/* 控制选项 */
.control-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.option-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.option-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.option-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.option-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.option-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  transition: all 0.3s ease;
  border-radius: 32px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 3px;
  background: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.option-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.option-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.option-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
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
