<!--
  饮水机水类型设置弹窗
  功能：显示选中水类型的详细设置（加热温度、风冷、保温等）
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'
import WaterTempSelector from './WaterTempSelector.vue'

interface Props {
  visible: boolean
  device: Device | null
  waterType: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const devicesStore = useDevicesStore()

// 水类型名称映射
const waterTypeNames: Record<string, string> = {
  'tap-water': '自来水',
  'purified-water': '纯净水',
  'boiled-water': '凉白开'
}

// 从设备状态获取数据
const targetTemp = computed(() => (props.device as any)?.waterDispenserTargetTemp ?? 55)
const currentTemp = computed(() => (props.device as any)?.waterDispenserCurrentTemp ?? 15)
const isHeating = computed(() => (props.device as any)?.waterDispenserHeating ?? false)
const isKeepingWarm = computed(() => (props.device as any)?.waterDispenserKeepingWarm ?? false)
const keepWarmTemp = computed(() => (props.device as any)?.waterDispenserKeepWarmTemp ?? 55)

// 设置状态
const airCoolingEnabled = computed({
  get: () => (props.device as any)?.waterDispenserFanCoolingEnabled ?? false,
  set: (v: boolean) => { if (props.device) devicesStore.setDeviceExtra(props.device.id, { waterDispenserFanCoolingEnabled: v }) }
})

const keepWarmEnabled = computed({
  get: () => (props.device as any)?.waterDispenserKeepWarmEnabled ?? true,
  set: (v: boolean) => { if (props.device) devicesStore.setWaterDispenserKeepWarm(props.device.id, v) }
})

// 温度选择器
const showTempSelector = ref(false)

// 获取当前水类型名称
const currentWaterTypeName = () => {
  return waterTypeNames[props.waterType] || props.waterType
}

// 打开保温温度选择
const openKeepWarmTempSelector = () => {
  showTempSelector.value = true
}

// 确认温度选择
const confirmTempSelection = (temp: number) => {
  // 更新设备的保温温度
  if (props.device) {
    devicesStore.setWaterDispenserKeepWarm(props.device.id, keepWarmEnabled.value, temp)
  }
}

// 加热定时器
let heatingInterval: number | null = null

// 开始加热
const startHeating = () => {
  if (!props.device) return
  devicesStore.setWaterDispenserHeating(props.device.id, true)
  devicesStore.setDeviceExtra(props.device.id, { waterDispenserKeepingWarm: false })

  // 模拟升温：每秒 +1~2°C
  heatingInterval = window.setInterval(() => {
    if (!props.device) return
    const cur = (props.device as any).waterDispenserCurrentTemp ?? 15
    if (cur < 100) {
      const next = Math.min(cur + (Math.random() > 0.4 ? 2 : 1), 100)
      devicesStore.setDeviceExtra(props.device.id, { waterDispenserCurrentTemp: next })
    } else {
      // 到达100°C，停止加热
      clearInterval(heatingInterval!)
      heatingInterval = null
      devicesStore.setWaterDispenserHeating(props.device.id, false)

      if (keepWarmEnabled.value) {
        // 进入保温：降温到保温温度
        devicesStore.setDeviceExtra(props.device.id, { waterDispenserKeepingWarm: true })
        const target = (props.device as any).waterDispenserKeepWarmTemp ?? 55
        const coolingInterval = window.setInterval(() => {
          if (!props.device) { clearInterval(coolingInterval); return }
          const c = (props.device as any).waterDispenserCurrentTemp ?? 100
          if (c > target) {
            devicesStore.setDeviceExtra(props.device.id, { waterDispenserCurrentTemp: Math.max(c - 1, target) })
          } else {
            clearInterval(coolingInterval)
          }
        }, 1500)
      }
    }
  }, 1000)
}

// 停止加热
const stopHeating = () => {
  if (!props.device) return
  if (heatingInterval) { clearInterval(heatingInterval); heatingInterval = null }
  devicesStore.setWaterDispenserHeating(props.device.id, false)
  devicesStore.setDeviceExtra(props.device.id, { waterDispenserKeepingWarm: false })
}

// 监听弹窗关闭，不清理定时器（加热在后台继续）
watch(() => props.visible, (_visible) => {
  // 弹窗关闭时不做任何操作，加热继续在store中进行
})

// 监听设备离线，停止加热
watch(() => props.device?.status, (status) => {
  if (status === 'offline' && heatingInterval) {
    clearInterval(heatingInterval)
    heatingInterval = null
  }
})

// 组件卸载时也不清理（加热继续）
onUnmounted(() => {
  // 不清理定时器，让加热继续
})
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click.stop="emit('update:visible', false)">
      <div class="dialog-content water-type-settings-dialog" @click.stop>
        <!-- 水滴图标和标题 -->
        <div class="header-section">
          <div class="water-drop-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
            </svg>
            <div class="sparkle sparkle-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>
              </svg>
            </div>
          </div>
          
          <div class="header-title">
            {{ isHeating ? '烧水中...' : isKeepingWarm ? '保温中' : `加热${currentWaterTypeName()}至 100°C` }}
          </div>
          <div class="header-subtitle">
            {{ isHeating ? `当前温度: ${currentTemp}°C` : isKeepingWarm ? `保温温度: ${keepWarmTemp}°C` : `烧开后降温到${keepWarmTemp}°C进行保温` }}
          </div>
        </div>

        <!-- 设置选项 -->
        <div class="settings-section">
          <!-- 风冷 -->
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">风冷</div>
              <div class="setting-desc">开启风扇加速水温冷却</div>
            </div>
            <label class="setting-toggle">
              <input 
                v-model="airCoolingEnabled"
                type="checkbox" 
                :disabled="device.status === 'offline'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 保温 -->
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">保温</div>
            </div>
            <label class="setting-toggle">
              <input 
                v-model="keepWarmEnabled"
                type="checkbox" 
                :disabled="device.status === 'offline'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 保温温度 -->
          <div 
            class="setting-item clickable"
            :class="{ disabled: !keepWarmEnabled || device.status === 'offline' }"
            @click="keepWarmEnabled && device.status === 'online' && openKeepWarmTempSelector()"
          >
            <div class="setting-info">
              <div class="setting-name">保温温度</div>
              <div class="setting-desc">加热完成后自动保温至设置温度</div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ keepWarmTemp }}°C</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 开始加热/停止按钮 -->
        <button 
          v-if="!isHeating"
          class="start-heating-btn"
          :disabled="device.status === 'offline'"
          @click="startHeating"
        >
          开始加热
        </button>
        <button 
          v-else
          class="stop-heating-btn"
          @click="stopHeating"
        >
          <svg class="stop-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          停止
        </button>
      </div>

      <!-- 温度选择器 -->
      <WaterTempSelector
        v-model:visible="showTempSelector"
        :current-temp="keepWarmTemp"
        @confirm="confirmTempSelection"
      />
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
  z-index: 1002;
}

.dialog-content {
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 32px 24px 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.water-type-settings-dialog {
  width: 360px;
  max-width: 90vw;
}

/* 头部区域 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.water-drop-icon {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.water-drop-icon > svg {
  width: 80px;
  height: 80px;
  color: #26d0ce;
  filter: drop-shadow(0 4px 12px rgba(38, 208, 206, 0.4));
}

.sparkle {
  position: absolute;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle svg {
  width: 20px;
  height: 20px;
  color: #26d0ce;
}

.sparkle-1 {
  top: 5px;
  right: 10px;
  animation-delay: 0s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

/* 设置区域 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
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
  transition: all 0.3s ease;
}

.setting-item.clickable {
  cursor: pointer;
}

.setting-item.clickable:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.setting-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.setting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.setting-desc {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

/* 开关 */
.setting-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.setting-toggle input {
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

.setting-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.setting-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.setting-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 开始加热按钮 */
.start-heating-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(38, 208, 206, 0.3);
  margin-top: 8px;
}

.start-heating-btn:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(38, 208, 206, 0.4);
  transform: translateY(-2px);
}

.start-heating-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.5) 0%, rgba(71, 85, 105, 0.4) 100%);
  box-shadow: none;
}

/* 停止加热按钮 */
.stop-heating-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.85) 100%);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.stop-heating-btn:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.stop-icon {
  width: 18px;
  height: 18px;
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
