<!--
  插座设备对话框
  功能：长按插座设备卡片后显示，提供电源控制、定时、倒计时、电量详情
  触发：长按插座/插排设备卡片
-->
<script setup lang="ts">
import type { Device } from '@/features/device/devices.store'

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
        
        <!-- 功能列表 -->
        <div class="socket-actions">
          <div class="socket-action-item" @click="emit('toggle-power')">
            <div class="socket-action-icon" :class="device.status === 'online' ? 'power-on' : 'power-off'">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="socket-action-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
          
          <div class="socket-action-item" @click="emit('open-timer')">
            <div class="socket-action-icon timer">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="socket-action-label">定时</span>
            <span class="socket-action-arrow">›</span>
          </div>
          
          <div class="socket-action-item" @click="emit('open-countdown')">
            <div class="socket-action-icon countdown">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="13" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M12 7v6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 2h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="7" cy="4" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="4" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span class="socket-action-label">倒计时</span>
            <span class="socket-action-arrow">›</span>
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

.socket-dialog { width: 340px; }

.socket-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.4) 0%, rgba(20, 40, 70, 0.3) 100%);
  border-radius: 16px;
  border: 1px solid rgba(100, 180, 255, 0.15);
}

.socket-stat { text-align: center; }
.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-unit { font-size: 14px; font-weight: 400; margin-left: 2px; }
.stat-label { font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-top: 6px; }

.socket-detail-link {
  text-align: center;
  font-size: 13px;
  color: rgba(79, 172, 254, 0.8);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.socket-detail-link:hover {
  color: #4facfe;
  text-decoration: underline;
}

.socket-actions { display: flex; flex-direction: column; gap: 10px; }

.socket-action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.socket-action-item:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.socket-action-item:active {
  transform: translateY(0);
}

.socket-action-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
}

.socket-action-icon.power-on {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.socket-action-icon.power-off {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
}

.socket-action-icon.timer {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.socket-action-icon.countdown {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.socket-action-label { flex: 1; font-size: 15px; font-weight: 500; color: white; }
.socket-action-arrow {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.socket-action-item:hover .socket-action-arrow {
  color: rgba(255, 255, 255, 0.7);
  transform: translateX(2px);
}

.dialog-enter-active, .dialog-leave-active { transition: all 0.3s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-content, .dialog-leave-to .dialog-content { transform: scale(0.9); opacity: 0; }
</style>
