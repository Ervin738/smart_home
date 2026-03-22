<!--
  净烟机长按弹窗
  功能：显示净烟机控制界面，包括PM2.5显示、开关和档位控制
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

const devicesStore = useDevicesStore()

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

// 设备类型切换 (0: 烟机, 1: 燃气灶)
const deviceTypeIndex = ref(0)
const deviceTypes = ['烟机', '燃气灶']

// 燃气灶状态
const leftBurnerOn = ref(false)
const rightBurnerOn = ref(false)
const stoveLinkEnabled = ref(true)

// PM2.5数值
const pm25Value = ref(19)
// 当前档位 (0-3: 低档、中档、高档、强力, -1: 关闭)
const currentLevel = ref(-1)

// 延时关机开关
const delayShutdownEnabled = ref(false)
// 延时时长（分钟）
const delayDuration = ref(30)
// 是否显示延时时长选择器
const showDelayDurationPicker = ref(false)
// 临时选择的延时时长
const tempDelayDuration = ref(30)
// 延时时长选项
const delayDurationOptions = ['30分钟', '1小时', '2小时', '3小时']
const delayDurationMinutes = [30, 60, 120, 180]
const delayDurationIndex = ref(0)
// 照明灯光开关
const lightEnabled = ref(false)
// 是否显示定时清洁弹窗
const showScheduledCleanDialog = ref(false)
// 清洁周期（小时）
const cleanCycle = ref(40)
// 是否显示清洁周期选择器
const showCleanCyclePicker = ref(false)
// 临时选择的清洁周期
const tempCleanCycle = ref(40)
// 清洁周期选项（10-100小时，步长10）
const cleanCycleOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 10)
// 定时清洁提醒开关
const cleanReminderEnabled = ref(true)
// 定时智能干洗开关
const autoCleanEnabled = ref(false)

// 档位选项
const levels = [
  { id: 0, name: '低档', icon: '~' },
  { id: 1, name: '中档', icon: '≈' },
  { id: 2, name: '高档', icon: '≋' },
  { id: 3, name: '强力', icon: '🌀' }
]

// 根据PM2.5值判断空气质量
const getAirQuality = () => {
  if (pm25Value.value <= 35) return '空气较好'
  if (pm25Value.value <= 75) return '空气一般'
  if (pm25Value.value <= 115) return '轻度污染'
  if (pm25Value.value <= 150) return '中度污染'
  return '重度污染'
}

// 根据PM2.5值获取颜色
const getPM25Color = () => {
  if (pm25Value.value <= 35) return '#22c55e' // 绿色
  if (pm25Value.value <= 75) return '#eab308' // 黄色
  if (pm25Value.value <= 115) return '#f97316' // 橙色
  return '#ef4444' // 红色
}

// 选择档位
const selectLevel = (levelId: number) => {
  if (props.device?.status === 'offline') return
  // 如果点击的是当前档位，则关闭
  if (currentLevel.value === levelId) {
    currentLevel.value = -1
  } else {
    currentLevel.value = levelId
  }
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { rangeHoodLevel: currentLevel.value })
}

// 打开定时清洁
const openScheduledClean = () => {
  showScheduledCleanDialog.value = true
}

// 关闭定时清洁弹窗
const closeScheduledCleanDialog = () => {
  showScheduledCleanDialog.value = false
}

// 打开清洁周期选择器
const openCleanCyclePicker = () => {
  tempCleanCycle.value = cleanCycle.value
  showCleanCyclePicker.value = true
}

// 关闭清洁周期选择器
const closeCleanCyclePicker = () => {
  showCleanCyclePicker.value = false
}

// 确认清洁周期选择
const confirmCleanCycle = () => {
  cleanCycle.value = tempCleanCycle.value
  showCleanCyclePicker.value = false
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { rangeHoodCleanCycle: cleanCycle.value })
}

// 切换延时关闭
const toggleDelayShutdown = () => {
  if (props.device?.status !== 'online' && !delayShutdownEnabled.value) {
    delayShutdownEnabled.value = false
    return
  }
  
  if (props.device) {
    devicesStore.setDelayShutdown(
      props.device.id,
      delayShutdownEnabled.value,
      delayShutdownEnabled.value ? delayDurationMinutes[delayDurationIndex.value] : undefined
    )
  }
}

// 打开延时时长选择器
const openDelayDurationPicker = () => {
  showDelayDurationPicker.value = true
}

// 关闭延时时长选择器
const closeDelayDurationPicker = () => {
  showDelayDurationPicker.value = false
}

// 确认延时时长选择
const confirmDelayDuration = () => {
  showDelayDurationPicker.value = false
  if (props.device) devicesStore.setDeviceExtra(props.device.id, { rangeHoodDelayDurationIndex: delayDurationIndex.value })
  if (delayShutdownEnabled.value && props.device) {
    devicesStore.setDelayShutdown(
      props.device.id,
      true,
      delayDurationMinutes[delayDurationIndex.value]
    )
  }
}

// 监听设备变化
watch(() => props.device, (device) => {
  if (device) {
    const d = device as any
    if (device.status === 'offline' && d.delayShutdownEnabled) {
      devicesStore.setDelayShutdown(device.id, false)
    }
    delayShutdownEnabled.value = d.delayShutdownEnabled || false
    if (d.delayShutdownDuration) {
      const index = delayDurationMinutes.indexOf(d.delayShutdownDuration)
      if (index !== -1) {
        delayDurationIndex.value = index
      }
    }
    // 恢复其他持久化状态
    deviceTypeIndex.value = d.rangeHoodDeviceTypeIndex ?? 0
    currentLevel.value = d.rangeHoodLevel ?? -1
    lightEnabled.value = d.rangeHoodLightEnabled ?? false
    cleanReminderEnabled.value = d.rangeHoodCleanReminderEnabled ?? true
    autoCleanEnabled.value = d.rangeHoodAutoCleanEnabled ?? false
    cleanCycle.value = d.rangeHoodCleanCycle ?? 40
    leftBurnerOn.value = d.rangeHoodLeftBurnerOn ?? false
    rightBurnerOn.value = d.rangeHoodRightBurnerOn ?? false
    stoveLinkEnabled.value = d.rangeHoodStoveLinkEnabled ?? true
    if (d.rangeHoodDelayDurationIndex !== undefined) {
      delayDurationIndex.value = d.rangeHoodDelayDurationIndex
    }
  }
}, { immediate: true })

// 监听设备状态变化
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline' && props.device) {
    if (delayShutdownEnabled.value) {
      delayShutdownEnabled.value = false
    }
    currentLevel.value = -1
    leftBurnerOn.value = false
    rightBurnerOn.value = false
    lightEnabled.value = false
    deviceTypeIndex.value = 0
    devicesStore.setDeviceExtra(props.device.id, {
      rangeHoodLeftBurnerOn: false,
      rangeHoodRightBurnerOn: false,
      rangeHoodLightEnabled: false,
      rangeHoodCurrentLevel: -1,
      rangeHoodDeviceTypeIndex: 0,
      delayShutdownEnabled: false,
    })
  }
})

</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content range-hood-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">净烟机</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <!-- 设备类型切换 -->
        <div class="device-type-switch">
          <div 
            v-for="(type, index) in deviceTypes" 
            :key="index"
            class="type-switch-btn"
            :class="{ active: deviceTypeIndex === index }"
            @click="deviceTypeIndex = index; props.device && devicesStore.setDeviceExtra(props.device.id, { rangeHoodDeviceTypeIndex: index })"
          >
            {{ type }}
          </div>
        </div>

        <!-- 烟机内容 -->
        <div v-if="deviceTypeIndex === 0" class="range-hood-layout">
          <!-- PM2.5显示区域 -->
          <div class="pm25-display">
            <div class="pm25-content">
              <div class="pm25-value" :style="{ color: getPM25Color() }">
                {{ pm25Value.toString().padStart(3, '0') }}
              </div>
              <div class="pm25-unit-wrapper">
                <div class="pm25-unit-line">PM2.5</div>
                <div class="pm25-unit-line">μg/m³</div>
              </div>
            </div>
            <div class="air-quality">{{ getAirQuality() }}</div>
          </div>

          <!-- 开关和定时清洁按钮 -->
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
            
            <div 
              class="timer-btn"
              @click="openScheduledClean"
            >
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="timer-text">定时清洁</span>
            </div>
          </div>

          <!-- 档位选择 -->
          <div class="level-section">
            <div class="level-container">
              <div class="section-title">档位 <span class="section-subtitle">| {{ currentLevel >= 0 ? '开启' : '关闭' }}</span></div>
              <div class="level-buttons">
                <div 
                  v-for="level in levels" 
                  :key="level.id"
                  class="level-btn-circle"
                  :class="{ 
                    active: currentLevel === level.id,
                    disabled: device.status === 'offline'
                  }"
                  @click="selectLevel(level.id)"
                >
                  <span class="level-text">{{ ['一档', '二档', '三档', '四档'][level.id] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 延时关机 -->
          <div class="feature-item">
            <div class="feature-left">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="feature-label">延时关机</span>
            </div>
            <label class="feature-toggle">
              <input type="checkbox" v-model="delayShutdownEnabled" :disabled="device.status === 'offline'" @change="toggleDelayShutdown" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 延时时长（仅在开启延时关机时显示） -->
          <div v-if="delayShutdownEnabled" class="feature-item clickable" @click="openDelayDurationPicker">
            <span class="feature-label-secondary">延迟时间</span>
            <div class="feature-value">
              <span class="value-text">{{ delayDurationOptions[delayDurationIndex] }}</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 照明灯光 -->
          <div class="feature-item">
            <div class="feature-left">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="feature-label">照明灯光</span>
            </div>
            <label class="feature-toggle">
              <input type="checkbox" v-model="lightEnabled" :disabled="device.status === 'offline'" @change="devicesStore.setDeviceExtra(device.id, { rangeHoodLightEnabled: lightEnabled })" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- 燃气灶内容 -->
        <div v-else class="gas-stove-layout">
          <!-- 灶眼控制 -->
          <div class="burners-control">
            <!-- 左灶 -->
            <div class="burner-item">
              <div class="burner-label">左灶</div>
              <div class="burner-circle" :class="{ active: leftBurnerOn }" @click="leftBurnerOn = !leftBurnerOn; devicesStore.setDeviceExtra(device.id, { rangeHoodLeftBurnerOn: leftBurnerOn })">
                <div class="burner-status">{{ leftBurnerOn ? '开启' : '关闭' }}</div>
              </div>
            </div>
            
            <!-- 右灶 -->
            <div class="burner-item">
              <div class="burner-label">右灶</div>
              <div class="burner-circle" :class="{ active: rightBurnerOn }" @click="rightBurnerOn = !rightBurnerOn; devicesStore.setDeviceExtra(device.id, { rangeHoodRightBurnerOn: rightBurnerOn })">
                <div class="burner-status">{{ rightBurnerOn ? '开启' : '关闭' }}</div>
              </div>
            </div>
          </div>

          <!-- 烟灶绑定 -->
          <div class="feature-item clickable">
            <div class="feature-left">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="feature-label">烟灶绑定</span>
            </div>
            <div class="feature-value">
              <span class="value-text">解除绑定</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 烟灶联动 -->
          <div class="feature-item">
            <div class="feature-left">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 9h6v6H9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="feature-text-group">
                <span class="feature-label">烟灶联动</span>
                <span class="feature-desc">开启后烟机随灶具同步启停</span>
              </div>
            </div>
            <label class="feature-toggle">
              <input type="checkbox" v-model="stoveLinkEnabled" :disabled="device.status === 'offline'" @change="devicesStore.setDeviceExtra(device.id, { rangeHoodStoveLinkEnabled: stoveLinkEnabled })" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 定时清洁弹窗 -->
  <transition name="selector">
    <div v-if="showScheduledCleanDialog && device" class="temp-selector-overlay" @click="closeScheduledCleanDialog">
      <div class="scheduled-clean-dialog" @click.stop>
        <!-- 标题 -->
        <div class="clean-dialog-title">定时清洁</div>

        <!-- 清洁周期设置 -->
        <div class="clean-section">
          <div class="clean-section-title">清洁周期</div>
          <div class="clean-option clickable" @click="openCleanCyclePicker">
            <div class="clean-option-text">
              <span class="clean-desc">烟机每工作{{ cleanCycle }}小时，提醒用户清洁</span>
            </div>
            <div class="clean-option-right">
              <span class="clean-value">{{ cleanCycle }}小时</span>
              <svg class="arrow-icon-small" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 定时清洁提醒 -->
        <div class="clean-option-card" :class="{ active: cleanReminderEnabled }" @click="cleanReminderEnabled = !cleanReminderEnabled; props.device && devicesStore.setDeviceExtra(props.device.id, { rangeHoodCleanReminderEnabled: cleanReminderEnabled })">
          <div class="clean-card-header">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none">
              <path v-if="cleanReminderEnabled" d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="clean-card-title">定时清洁提醒</span>
          </div>
          <div class="clean-card-desc">烟机每工作40小时，提醒用户清洁</div>
        </div>

        <!-- 定时智能干洗 -->
        <div class="clean-option-card" :class="{ active: autoCleanEnabled }" @click="autoCleanEnabled = !autoCleanEnabled; props.device && devicesStore.setDeviceExtra(props.device.id, { rangeHoodAutoCleanEnabled: autoCleanEnabled })">
          <div class="clean-card-header">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none">
              <path v-if="autoCleanEnabled" d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="clean-card-title">定时智能干洗</span>
          </div>
          <div class="clean-card-desc">烟机每工作40小时，自动启动智能干洗</div>
        </div>

        <!-- 按钮组 -->
        <div class="dialog-buttons">
          <button class="dialog-btn cancel-btn" @click="closeScheduledCleanDialog">
            取消
          </button>
          <button class="dialog-btn confirm-btn" @click="closeScheduledCleanDialog">
            确定
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 清洁周期选择器弹窗 -->
  <transition name="selector">
    <div v-if="showCleanCyclePicker && device" class="temp-selector-overlay" @click="closeCleanCyclePicker">
      <div class="cycle-picker-dialog" @click.stop>
        <div class="picker-title">清洁周期</div>
        
        <!-- 滚动选择器 -->
        <div class="cycle-picker-container">
          <div class="picker-highlight"></div>
          <div class="cycle-picker">
            <div 
              v-for="cycle in cleanCycleOptions" 
              :key="cycle"
              class="cycle-option"
              :class="{ active: cycle === tempCleanCycle }"
              @click="tempCleanCycle = cycle"
            >
              {{ cycle }}<span class="cycle-unit">小时</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="picker-buttons">
          <button class="picker-btn cancel-btn" @click="closeCleanCyclePicker">
            取消
          </button>
          <button class="picker-btn confirm-btn" @click="confirmCleanCycle">
            确定
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 延时时长选择器弹窗 -->
  <transition name="selector">
    <div v-if="showDelayDurationPicker && device" class="temp-selector-overlay" @click="closeDelayDurationPicker">
      <div class="cycle-picker-dialog" @click.stop>
        <div class="picker-title">延迟时间</div>
        
        <!-- 选项列表 -->
        <div class="duration-options">
          <div 
            v-for="(option, index) in delayDurationOptions" 
            :key="index"
            class="duration-option"
            :class="{ active: delayDurationIndex === index }"
            @click="delayDurationIndex = index"
          >
            <svg class="check-icon-small" viewBox="0 0 24 24" fill="none">
              <path v-if="delayDurationIndex === index" d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="duration-text">{{ option }}</span>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="picker-buttons">
          <button class="picker-btn cancel-btn" @click="closeDelayDurationPicker">
            取消
          </button>
          <button class="picker-btn confirm-btn" @click="confirmDelayDuration">
            确定
          </button>
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

.range-hood-dialog {
  width: 360px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-type-switch {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.type-switch-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-switch-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.type-switch-btn.active {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
  color: var(--dialog-text);
  font-weight: 600;
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

.range-hood-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pm25-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pm25-content {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
}

.pm25-value {
  font-size: 64px;
  font-weight: 200;
  line-height: 1;
  letter-spacing: -3px;
}

.pm25-unit-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 6px;
}

.pm25-unit-line {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.2;
  white-space: nowrap;
}

.air-quality {
  font-size: 20px;
  font-weight: 500;
  color: white;
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

.timer-btn {
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

.timer-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.timer-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-icon {
  width: 18px;
  height: 18px;
}

.timer-text {
  font-size: 15px;
  font-weight: 600;
}

.level-section {
  display: flex;
  flex-direction: column;
}

.level-container {
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

.level-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.level-btn-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.4);
  cursor: pointer;
  transition: all 0.2s;
}

.level-btn-circle:hover:not(.disabled):not(.active) {
  background: rgba(100, 116, 139, 0.5);
  transform: scale(1.05);
}

.level-btn-circle.active {
  background: var(--dialog-btn-active-bg-1);
  transform: scale(1.05);
}

.level-btn-circle.active .level-text {
  color: white;
  font-weight: 600;
}

.level-btn-circle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.feature-item.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-item.clickable:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.feature-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.feature-label {
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.feature-label-secondary {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.feature-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.feature-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.feature-toggle input {
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

.feature-toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  border-color: rgba(38, 208, 206, 0.4);
  box-shadow: 0 0 12px rgba(38, 208, 206, 0.4);
}

.feature-toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.feature-toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
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

.temp-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.scheduled-clean-dialog {
  width: 360px;
  max-width: 90vw;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.clean-dialog-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 4px;
}

.clean-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clean-section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.clean-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.clean-option.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clean-option.clickable:hover {
  background: rgba(255, 255, 255, 0.08);
}

.clean-option-text {
  flex: 1;
}

.clean-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.clean-option-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clean-value {
  font-size: 14px;
  color: #ef4444;
  font-weight: 500;
}

.arrow-icon-small {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.clean-option-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.clean-option-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.clean-option-card.active {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
}

.clean-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.check-icon {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: var(--dialog-text);
  padding: 2px;
}

.clean-option-card.active .check-icon {
  border-color: var(--dialog-btn-active-border);
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.clean-card-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.clean-card-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin-left: 36px;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.dialog-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: rgba(100, 116, 139, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.cancel-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 208, 206, 0.4);
}

.selector-enter-active,
.selector-leave-active {
  transition: all 0.3s ease;
}

.selector-enter-from,
.selector-leave-to {
  opacity: 0;
}

.selector-enter-from .scheduled-clean-dialog,
.selector-leave-to .scheduled-clean-dialog {
  transform: scale(0.9);
  opacity: 0;
}

.cycle-picker-dialog {
  width: 360px;
  max-width: 90vw;
  background: linear-gradient(
    180deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.picker-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-align: center;
}

.cycle-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.cycle-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  width: 100%;
  padding: 76px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.cycle-picker::-webkit-scrollbar {
  display: none;
}

.cycle-option {
  font-size: 32px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  scroll-snap-align: center;
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
  padding: 0 20px;
}

.cycle-option.active {
  font-size: 48px;
  font-weight: 400;
  color: rgb(38, 208, 206);
  transform: scale(1.2);
}

.cycle-unit {
  font-size: 0.5em;
  margin-left: 4px;
  opacity: 0.8;
}

.picker-highlight {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 56px;
  pointer-events: none;
  z-index: 1;
}

.picker-buttons {
  display: flex;
  gap: 12px;
}

.picker-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.picker-btn.cancel-btn {
  background: rgba(100, 116, 139, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.picker-btn.cancel-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  transform: translateY(-2px);
}

.picker-btn.confirm-btn {
  background: linear-gradient(135deg, #26d0ce 0%, #1fa19f 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(38, 208, 206, 0.3);
}

.picker-btn.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 208, 206, 0.4);
}

.selector-enter-from .cycle-picker-dialog,
.selector-leave-to .cycle-picker-dialog {
  transform: scale(0.9);
  opacity: 0;
}

.duration-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.duration-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.duration-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.duration-option.active {
  background: var(--dialog-btn-active-light-bg-1);
  border-color: var(--dialog-btn-active-light-border);
}

.check-icon-small {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: var(--dialog-text);
  padding: 2px;
}

.duration-option.active .check-icon-small {
  border-color: var(--dialog-btn-active-border);
  background: var(--dialog-btn-active-bg-1);
  color: white;
}

.duration-text {
  font-size: 16px;
  font-weight: 500;
  color: white;
}

/* 燃气灶布局 */
.gas-stove-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.burners-control {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 20px 0;
}

.burner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.burner-label {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  order: -1;
}

.burner-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
}

.burner-circle::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.burner-circle:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.burner-circle.active {
  border-color: var(--dialog-btn-active-border);
  background: var(--dialog-btn-active-light-bg-1);
}

.burner-circle.active::before {
  background: var(--dialog-btn-active-bg-1);
  box-shadow: none;
}

.burner-status {
  font-size: 20px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.burner-circle.active .burner-status {
  color: rgb(59, 130, 246);
  font-weight: 600;
}

.feature-text-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}
</style>
