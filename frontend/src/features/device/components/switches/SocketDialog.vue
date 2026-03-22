<!--
  插座设备对话框
  功能：长按插座设备卡片后显示，提供电源控制、定时、倒计时、电量详情
  触发：长按插座/插排设备卡片
-->
<script setup lang="ts">
import type { Device } from '@/features/device/store/devices.store'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
  (e: 'open-countdown'): void
  (e: 'open-power-detail'): void
}>()
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content socket-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">智能插座</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <!-- 功率和用电量 -->
        <div class="socket-stats">
          <div class="socket-stat">
            <div class="stat-value">0.00<span class="stat-unit">w</span></div>
            <div class="stat-label">当前功率 (w)</div>
          </div>
          <div class="socket-stat">
            <div class="stat-value">--<span class="stat-unit">度</span></div>
            <div class="stat-label">今日用电量</div>
          </div>
        </div>
        <div class="socket-detail-link" @click="emit('open-power-detail')">查看详情</div>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <div class="btn-icon-wrapper">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="btn-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
          <div 
            class="control-btn"
            @click="emit('open-timer')"
          >
            <div class="btn-icon-wrapper">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="btn-label">定时</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div 
            class="control-btn"
            :class="{ disabled: device.status === 'offline' }"
            @click="device.status === 'online' && emit('open-countdown')"
          >
            <div class="btn-icon-wrapper">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="13" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M12 7v6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 2h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="7" cy="4" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="4" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span class="btn-label">倒计时</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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

.socket-dialog {
  width: 380px;
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

.socket-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.socket-stat {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  margin-left: 2px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
}

.socket-detail-link {
  text-align: center;
  font-size: 13px;
  color: var(--dialog-text);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.socket-detail-link:hover {
  color: #4facfe;
  text-decoration: underline;
}

/* 控制按钮样式 */
.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.control-btn.active {
  background: var(--dialog-btn-active-bg-1);
  border: none;
  color: white;
  box-shadow: none;
}

.control-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  pointer-events: none;
}

.control-btn.active .btn-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon {
  width: 22px;
  height: 22px;
  pointer-events: none;
}

.btn-label {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  pointer-events: none;
}

.btn-arrow {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  transition: all 0.2s;
  pointer-events: none;
}

.control-btn:hover .btn-arrow {
  color: rgba(255, 255, 255, 0.7);
  transform: translateX(2px);
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
