<!--
  设备详情控制对话框
  功能：长按设备卡片后显示，提供完整的设备控制功能
  支持：灯光（亮度/色温/模式）、扫地机器人（清扫模式/吸力/水量）、晾衣架（升降/功能）等
  触发：长按设备卡片
-->
<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import type { Device } from '@/features/device/devices.store'
import { INTERACTION_TIMING } from '@/constants'
import { useDeviceState, useRobotControl, useClothesRackControl } from '@/shared/composables'
import { useVerticalSlider } from '@/shared/composables'
import { 
  isWashingMachine as checkIsWashingMachine, 
  isRobotVacuum as checkIsRobotVacuum, 
  isClothesRack as checkIsClothesRack,
  getCleanerTypeLabel 
} from '@/features/device/deviceHelpers'

const props = defineProps<{
  visible: boolean
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'open-timer'): void
  (e: 'restart'): void
  (e: 'update:brightness', value: number): void
  (e: 'update:colorTemp', value: number): void
}>()

const dialogBrightness = ref(0)
const dialogColorTemp = ref(2700)

// 使用设备状态管理
const deviceRef = toRef(props, 'device')
const {
  activeModeIndexMap,
  activeControlIndexMap,
  washingActiveMap,
  activeModeIndex,
  activeControlIndex,
  isWashingActive,
  canStartWash,
  setModeIndex,
  setControlIndex,
  toggleWashing
} = useDeviceState(deviceRef)

// 使用扫地机器人控制
const {
  suctionLevel: robotSuctionLevel,
  waterLevel: robotWaterLevel,
  suctionLevels,
  waterLevels,
  adjustSuction,
  adjustWater
} = useRobotControl()

// 使用晾衣架控制
const {
  lighting: clothesRackLighting,
  drying: clothesRackDrying,
  airDry: clothesRackAirDry,
  sterilize: clothesRackSterilize,
  moving: clothesRackMoving
} = useClothesRackControl()

// 设备类型判断
const isWashingMachine = computed(() => checkIsWashingMachine(props.device))
const isRobotVacuum = computed(() => checkIsRobotVacuum(props.device))
const isClothesRack = computed(() => checkIsClothesRack(props.device))

watch(() => props.device, (device) => {
  if (device && device.type === 'light') {
    dialogBrightness.value = device.brightness ?? 0
    dialogColorTemp.value = device.colorTemp ?? 2700
  }
})

const onDialogBrightnessChange = (value: number) => {
  emit('update:brightness', value)
}

const onDialogColorTempChange = (value: number) => {
  emit('update:colorTemp', value)
}

const getControlButtons = (device: Device) => {
  const baseButtons = [
    { icon: 'power', label: device.status === 'online' ? '关闭电源' : '开启电源', action: 'power' }
  ]
  
  switch (device.type) {
    case 'light':
      return [...baseButtons, { icon: 'timer', label: '定时', action: 'timer' }]
    case 'switch':
      return [...baseButtons, { icon: 'countdown', label: '定时开关', action: 'timer' }]
    case 'cleaner':
      // 根据cleanerType区分不同清洁电器
      if (device.cleanerType === 'washing-machine' || device.cleanerType === 'dryer') {
        // 洗衣机/烘干机 - 电源和清洗是独立的
        const isWashing = washingActiveMap.value[device.id] ?? false
        return [
          { icon: 'power', label: device.status === 'online' ? '关闭电源' : '开启电源', action: 'power' },
          { icon: 'play', label: isWashing ? '暂停清洗' : '开始清洗', action: 'wash' }
        ]
      } else if (device.cleanerType === 'robot-vacuum') {
        // 扫地机器人
        return [
          { icon: 'play', label: device.status === 'online' ? '暂停清扫' : '开始清扫', action: 'power' },
          { icon: 'home', label: '回充', action: 'charge' }
        ]
      } else if (device.cleanerType === 'clothes-rack') {
        // 晾衣架
        return [
          { icon: 'power', label: device.status === 'online' ? '关闭电源' : '开启电源', action: 'power' },
          { icon: 'up', label: '升降', action: 'lift' }
        ]
      }
    case 'security':
      return [...baseButtons, { icon: 'bell', label: '布防', action: 'arm' }]
    case 'environment':
      // 加湿器不显示控制按钮
      if (device.environmentType === 'humidifier') {
        return []
      }
      return baseButtons
    case 'personal':
      return [...baseButtons, { icon: 'settings', label: '设置', action: 'setting' }]
    case 'bathroom':
      return [...baseButtons, { icon: 'water', label: '水温调节', action: 'water' }]
    case 'kitchen':
      return [
        { icon: 'play', label: device.status === 'online' ? '停止' : '启动', action: 'power' },
        { icon: 'schedule', label: '预约', action: 'schedule' }
      ]
    case 'network':
      return [...baseButtons, { icon: 'restart', label: '重启', action: 'restart' }]
    case 'entertainment':
      return [...baseButtons, { icon: 'volume', label: '音量', action: 'volume' }]
    default:
      return [...baseButtons, { icon: 'settings', label: '设置', action: 'setting' }]
  }
}

// 晾衣架升降控制
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

// 使用滑动控制 - 吸力
const suctionSlider = useVerticalSlider(adjustSuction)
// 使用滑动控制 - 水量
const waterSlider = useVerticalSlider(adjustWater)

const getModeOptions = (device: Device) => {
  switch (device.type) {
    case 'light':
      return [
        { label: '阅读模式', brightness: 80, colorTemp: 4500 },
        { label: '电脑模式', brightness: 60, colorTemp: 5500 },
        { label: '休闲模式', brightness: 50, colorTemp: 3500 },
        { label: '办公模式', brightness: 90, colorTemp: 5000 },
        { label: '娱乐模式', brightness: 40, colorTemp: 3000 },
        { label: '夜灯模式', brightness: 10, colorTemp: 2700 }
      ]
    case 'switch': return []
    case 'cleaner':
      // 根据cleanerType区分不同清洁电器的模式
      if (device.cleanerType === 'washing-machine') {
        // 洗衣机模式 - 保持原样
        return ['智能洗', '随心洗烘', '快速洗', '大件洗', '单烘干', '羽绒服', '轻干洗', '单脱水']
      } else if (device.cleanerType === 'dryer') {
        // 烘干机模式
        return ['智能烘', '快速烘', '节能烘', '大件烘', '小件烘', '除菌烘', '除异味', '除静电']
      } else if (device.cleanerType === 'robot-vacuum') {
        // 扫地机器人模式 - 带图标
        return [
          { label: '扫地', icon: 'sweep' },
          { label: '拖地', icon: 'mop' },
          { label: '边扫边拖', icon: 'sweep-mop' },
          { label: '先扫后拖', icon: 'sweep-then-mop' }
        ]
      } else if (device.cleanerType === 'clothes-rack') {
        // 晾衣架模式
        return ['风干', '烘干', '消毒', '照明']
      } else {
        return ['标准', '强力', '安静']
      }
    case 'security': return ['在家', '离家', '睡眠', '自定义']
    case 'environment': 
      // 根据environmentType区分不同环境电器的模式
      if (device.environmentType === 'humidifier') {
        // 加湿器不显示模式选项
        return []
      } else {
        // 其他环境电器（空调等）
        return ['制冷', '制热', '除湿', '送风']
      }
    case 'personal': return ['舒适', '按摩', '阅读', '睡眠']
    case 'bathroom': return ['速热', '恒温', '节能', '儿童']
    case 'kitchen': return ['快煮', '精煮', '保温', '预约']
    case 'network': return []
    case 'entertainment': return ['标准', '电影', '音乐', '游戏']
    default: return ['自动', '手动', '定时', '节能']
  }
}

const getModeTitle = (device: Device) => {
  switch (device.type) {
    case 'light': return '情景模式'
    case 'switch': return '开关模式'
    case 'cleaner':
      // 根据cleanerType区分标题
      if (device.cleanerType === 'washing-machine') {
        return '清洁模式'
      } else if (device.cleanerType === 'dryer') {
        return '烘干模式'
      } else if (device.cleanerType === 'robot-vacuum') {
        return '清扫模式'
      } else if (device.cleanerType === 'clothes-rack') {
        return '工作模式'
      } else {
        return '清洁模式'
      }
    case 'security': return '安防模式'
    case 'environment': 
      if (device.environmentType === 'humidifier') {
        return '' // 加湿器不显示模式标题
      }
      return '运行模式'
    case 'personal': return '舒适模式'
    case 'bathroom': return '热水模式'
    case 'kitchen': return '烹饪模式'
    case 'network': return '网络模式'
    case 'entertainment': return '场景模式'
    default: return '控制模式'
  }
}

const handleControlClick = (device: Device, action: string, index: number) => {
  if (action === 'power') {
    emit('toggle-power')
  } else if (action === 'timer') {
    emit('open-timer')
  } else if (action === 'restart') {
    emit('restart')
  } else if (action === 'wash') {
    // 洗衣机开始清洗 - 需要先开启电源并选择模式
    if (device.status === 'offline') {
      return // 电源关闭，不能开始清洗
    }
    const modeIndex = activeModeIndexMap.value[device.id] ?? -1
    if (modeIndex === -1) {
      return // 未选择模式，不能开始清洗
    }
    toggleWashing(device.id)
  } else if (action === 'charge') {
    // 返回基站 - 点击后延时取消选中
    setControlIndex(device.id, index)
    setTimeout(() => {
      if (activeControlIndexMap.value[device.id] === index) {
        setControlIndex(device.id, -1)
      }
    }, INTERACTION_TIMING.CHARGE_DELAY)
  } else {
    const currentIndex = activeControlIndexMap.value[device.id] ?? -1
    setControlIndex(device.id, currentIndex === index ? -1 : index)
  }
}

const handleModeSelect = (mode: any, index: number) => {
  if (!props.device) return
  
  // 关闭电源时不能选择模式
  if (props.device.status === 'offline') {
    return
  }
  
  setModeIndex(props.device.id, index)
  
  if (props.device && typeof mode === 'object' && mode.brightness !== undefined) {
    dialogBrightness.value = mode.brightness
    dialogColorTemp.value = mode.colorTemp
    emit('update:brightness', mode.brightness)
    emit('update:colorTemp', mode.colorTemp)
  }
}

const typeLabels: Record<string, string> = {
  light: '灯光', switch: '开关', cleaner: '清洁电器', security: '安防', environment: '环境电器',
  personal: '个护与起居', bathroom: '卫浴', kitchen: '厨房电器', network: '路由网关',
  entertainment: '影音娱乐', other: '其他'
}
const lightTypeLabels: Record<string, string> = { 'table-lamp': '台灯', 'ceiling-lamp': '吸顶灯' }
const switchTypeLabels: Record<string, string> = { 'socket': '插座/插排', 'switch': '开关' }
const networkTypeLabels: Record<string, string> = { 'router': '路由器', 'gateway': '网关', 'wifi-extender': 'WiFi信号放大器' }
const getDisplayType = (device: Device) => {
  return getCleanerTypeLabel(device.cleanerType || '') || 
         lightTypeLabels[device.lightType || ''] || 
         switchTypeLabels[device.switchType || ''] || 
         networkTypeLabels[device.networkType || ''] || 
         typeLabels[device.type] || 
         device.type
}

// SVG图标映射
const getIconSvg = (iconName: string) => {
  const icons: Record<string, string> = {
    power: '<path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    timer: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    countdown: '<circle cx="12" cy="13" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 2h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="7" cy="4" r="1.5" fill="currentColor"/><circle cx="17" cy="4" r="1.5" fill="currentColor"/>',
    play: '<path d="M5 3l14 9-14 9V3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.5" cy="18.5" r="1.5" fill="currentColor"/>',
    settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    water: '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    schedule: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 3.5L19 6M7.5 3.5L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    restart: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    volume: '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    'level-1': '<path d="M12 2v20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M12 8v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>',
    'level-2': '<path d="M12 2v20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M12 8v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    humidity: '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1" fill="currentColor"/>'
  }
  return icons[iconName] || icons.settings
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content device-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">{{ getDisplayType(device) }}</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '工作中' : '已关闭' }}
          </div>
        </div>
        
        <!-- 灯光设备的亮度调节 -->
        <div v-if="device.type === 'light'" class="brightness-section" :class="{ disabled: device.status === 'offline' }">
          <div class="brightness-header">
            <span class="brightness-label">亮度</span>
            <span class="brightness-divider">|</span>
            <span class="brightness-value">{{ dialogBrightness }}%</span>
          </div>
          <div class="brightness-slider-container">
            <svg class="brightness-icon-left" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="brightness-track">
              <div class="brightness-fill" :style="{ width: dialogBrightness + '%' }"></div>
            </div>
            <svg class="brightness-icon-right" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input 
              type="range" 
              v-model="dialogBrightness" 
              min="0" 
              max="100" 
              class="brightness-input"
              :disabled="device.status === 'offline'"
              @input="onDialogBrightnessChange(dialogBrightness)"
            />
          </div>
        </div>
        
        <!-- 灯光设备的色温调节 -->
        <div v-if="device.type === 'light'" class="color-temp-section" :class="{ disabled: device.status === 'offline' }">
          <div class="color-temp-header">
            <span class="color-temp-label">色温</span>
            <span class="color-temp-divider">|</span>
            <span class="color-temp-value">{{ dialogColorTemp }} K</span>
          </div>
          <div class="color-temp-slider-container">
            <div class="color-temp-track">
              <div class="color-temp-thumb" :style="{ left: `calc(${((dialogColorTemp - 2700) / (6500 - 2700)) * 100}% - ${((dialogColorTemp - 2700) / (6500 - 2700)) * 38}px + 3px)` }"></div>
            </div>
            <input 
              type="range" 
              v-model="dialogColorTemp" 
              min="2700" 
              max="6500" 
              class="color-temp-input"
              :disabled="device.status === 'offline'"
              @input="onDialogColorTempChange(dialogColorTemp)"
            />
          </div>
        </div>
        
        <!-- 扫地机器人专用布局 -->
        <template v-if="isRobotVacuum">
          <div class="control-buttons">
            <div 
              class="control-btn"
              :class="{ 'power-on': device.status === 'online' }"
              @click="handleControlClick(device, 'power', 0)"
            >
              <svg class="btn-svg-icon" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="btn-label">{{ device.status === 'online' ? '暂停清扫' : '开始清洁' }}</span>
            </div>
            <div 
              class="control-btn"
              :class="{ active: activeControlIndex === 1, disabled: device.status === 'offline' }"
              @click="device.status === 'online' && handleControlClick(device, 'charge', 1)"
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
                  v-for="(mode, index) in getModeOptions(device)" 
                  :key="index"
                  class="robot-mode-btn"
                  :class="{ active: activeModeIndex === index, disabled: device.status === 'offline' }"
                  @click="device.status === 'online' && handleModeSelect(mode, index)"
                >
                  <svg v-if="(mode as any).icon === 'sweep'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20h16M8 16v4M16 16v4M6 16h12l-2-8H8l-2 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <svg v-else-if="(mode as any).icon === 'mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v10M8 13h8l2 8H6l2-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 17h8M9 20h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="(mode as any).icon === 'sweep-mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20h7M17 20h3M8 16v4M6 16h6l-1-6H7l-1 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 13h6l1 7h-8l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <svg v-else-if="(mode as any).icon === 'sweep-then-mop'" class="robot-mode-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M3 18h8M7 14v4M5 14h4l-1-5H6l-1 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M17 12v6M15 18h6l1-6h-8l1 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="robot-mode-label">{{ (mode as any).label }}</span>
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
                    <div class="slider-thumb-card" :style="{ top: (4 + (2 - robotSuctionLevel) * 96) + 'px' }">
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
                    <div class="slider-thumb-card" :style="{ top: (4 + (2 - robotWaterLevel) * 96) + 'px' }">
                      {{ waterLevels[robotWaterLevel] }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 晾衣架专用布局 -->
        <template v-else-if="isClothesRack">
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
                <span class="rack-power-label">{{ device.status === 'online' ? '关闭电源' : '开启电源' }}</span>
              </div>
            </div>
            
            <!-- 升降控制 -->
            <div class="rack-lift-section">
              <div 
                class="rack-lift-btn"
                :class="{ active: clothesRackMoving === 'up', disabled: device.status === 'offline' }"
                @click="device.status === 'online' && handleClothesRackUp()"
              >
                <div class="rack-btn-label">上升</div>
                <svg class="rack-btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <div 
                class="rack-lift-btn"
                :class="{ active: clothesRackMoving === 'stop', disabled: device.status === 'offline' }"
                @click="device.status === 'online' && handleClothesRackStop()"
              >
                <div class="rack-btn-label">停止</div>
                <svg class="rack-stop-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>
                  <rect x="14" y="4" width="5" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              
              <div 
                class="rack-lift-btn"
                :class="{ active: clothesRackMoving === 'down', disabled: device.status === 'offline' }"
                @click="device.status === 'online' && handleClothesRackDown()"
              >
                <div class="rack-btn-label">下降</div>
                <svg class="rack-btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            
            <!-- 功能按钮区域 -->
            <div class="rack-function-grid">
              <div 
                class="rack-function-btn"
                :class="{ active: clothesRackLighting, disabled: device.status === 'offline' }"
                @click="device.status === 'online' && (clothesRackLighting = !clothesRackLighting)"
              >
                <div class="rack-func-label">照明</div>
                <svg class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              
              <div 
                class="rack-function-btn"
                :class="{ active: clothesRackDrying, disabled: device.status === 'offline' }"
                @click="device.status === 'online' && (clothesRackDrying = !clothesRackDrying)"
              >
                <div class="rack-func-label">烘干</div>
                <svg class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M8 16c0-4 4-8 4-12 0 4 4 8 4 12a4 4 0 11-8 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 20v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              
              <div 
                class="rack-function-btn"
                :class="{ active: clothesRackAirDry, disabled: device.status === 'offline' }"
                @click="device.status === 'online' && (clothesRackAirDry = !clothesRackAirDry)"
              >
                <div class="rack-func-label">风干</div>
                <svg class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <div 
                class="rack-function-btn"
                :class="{ active: clothesRackSterilize, disabled: device.status === 'offline' }"
                @click="device.status === 'online' && (clothesRackSterilize = !clothesRackSterilize)"
              >
                <div class="rack-func-label">消毒</div>
                <svg class="rack-func-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                  <circle cx="9" cy="10" r="1" fill="currentColor"/>
                  <circle cx="15" cy="10" r="1" fill="currentColor"/>
                  <circle cx="12" cy="15" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 其他设备的原有布局 -->
        <template v-else>
        <div class="control-buttons">
          <div 
            v-for="(btn, index) in getControlButtons(device)" 
            :key="index"
            class="control-btn"
            :class="{ 
              active: activeControlIndex === index && btn.action !== 'power' && btn.action !== 'timer' && btn.action !== 'wash',
              'power-on': btn.action === 'power' && device.status === 'online',
              'power-off': btn.action === 'power' && device.status === 'offline',
              'timer-on': btn.action === 'timer' && (device.timerOffEnabled || device.timerOnEnabled),
              'timer-off': btn.action === 'timer' && !device.timerOffEnabled && !device.timerOnEnabled,
              'wash-on': btn.action === 'wash' && isWashingActive,
              'wash-off': btn.action === 'wash' && !isWashingActive,
              'wash-disabled': btn.action === 'wash' && !canStartWash && !isWashingActive,
              'disabled': btn.action !== 'power' && device.status === 'offline'
            }"
            @click="(btn.action === 'power' || device.status === 'online') && handleControlClick(device, btn.action, index)"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" v-html="getIconSvg(btn.icon)"></svg>
            <span class="btn-label">{{ btn.label }}</span>
          </div>
        </div>
        
        <div v-if="getModeOptions(device).length > 0" class="mode-section">
          <div v-if="getModeTitle(device)" class="mode-title">{{ getModeTitle(device) }}</div>
          <div class="mode-grid" :class="{ 
            vertical: device.type === 'cleaner' && (device.cleanerType === 'washing-machine' || device.cleanerType === 'dryer'),
            disabled: device.status === 'offline'
          }">
            <div 
              v-for="(mode, index) in getModeOptions(device)" 
              :key="index"
              class="mode-btn"
              :class="{ 
                active: activeModeIndex === index,
                disabled: device.status === 'offline',
                'with-icon': typeof mode === 'object' && (mode as any).icon
              }"
              @click="device.status === 'online' && handleModeSelect(mode, index)"
            >
              <template v-if="typeof mode === 'object' && (mode as any).brightness !== undefined">
                <span class="mode-label">{{ (mode as any).label }}</span>
              </template>
              <template v-else-if="typeof mode === 'object' && (mode as any).icon">
                <svg class="mode-icon" viewBox="0 0 24 24" fill="none" v-html="getIconSvg((mode as any).icon)"></svg>
              </template>
              <template v-else-if="typeof mode === 'object' && (mode as any).label">
                {{ (mode as any).label }}
              </template>
              <template v-else>
                {{ mode }}
              </template>
            </div>
          </div>
        </div>
        </template>
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
  border-radius: 32px;
  padding: 24px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.device-dialog {
  width: 360px;
  max-height: 80vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
}

.device-dialog::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 10%,
    transparent 30%
  );
  pointer-events: none;
}

.device-dialog::-webkit-scrollbar { display: none; }

.device-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.device-type-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.device-status-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.device-status-tag.online {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.35) 0%, rgba(34, 197, 94, 0.3) 100%);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.5);
  box-shadow: 0 2px 10px rgba(74, 222, 128, 0.25);
}

.device-status-tag.offline {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.35) 0%, rgba(239, 68, 68, 0.3) 100%);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.5);
  box-shadow: 0 2px 10px rgba(248, 113, 113, 0.25);
}

/* 亮度调节样式 */
.brightness-section {
  margin-bottom: 24px;
}

.brightness-section.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.brightness-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.brightness-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.brightness-divider {
  color: rgba(255, 255, 255, 0.3);
}

.brightness-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.brightness-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.brightness-icon-left,
.brightness-icon-right {
  width: 24px;
  height: 24px;
  color: rgba(150, 200, 255, 0.8);
  flex-shrink: 0;
}

.brightness-icon-left {
  opacity: 0.6;
  width: 20px;
  height: 20px;
}

.brightness-track {
  flex: 1;
  height: 44px;
  background: linear-gradient(
    90deg,
    rgba(58, 58, 110, 0.7) 0%,
    rgba(74, 74, 122, 0.6) 50%,
    rgba(77, 90, 122, 0.5) 100%
  );
  border-radius: 22px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(150, 180, 220, 0.25);
}

.brightness-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(120, 180, 240, 0.9) 0%,
    rgba(180, 220, 255, 0.95) 50%,
    rgba(230, 245, 255, 1) 100%
  );
  border-radius: 22px;
  transition: width 0.1s ease;
  min-width: 10px;
  box-shadow: 
    0 0 20px rgba(100, 180, 255, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.brightness-thumb {
  display: none;
}

.brightness-input {
  position: absolute;
  top: 0;
  left: 44px;
  right: 44px;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

/* 色温调节样式 */
.color-temp-section {
  margin-bottom: 24px;
}

.color-temp-section.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.color-temp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.color-temp-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.color-temp-divider {
  color: rgba(255, 255, 255, 0.3);
}

.color-temp-value {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.color-temp-slider-container {
  position: relative;
}

.color-temp-track {
  height: 44px;
  background: linear-gradient(
    90deg,
    #ffb347 0%,
    #ffcc80 20%,
    #ffe4b5 40%,
    #f5f5dc 60%,
    #e0f0ff 80%,
    #87ceeb 100%
  );
  border-radius: 22px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-temp-thumb {
  position: absolute;
  width: 38px;
  height: 38px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  top: 50%;
  transform: translateY(-50%);
}

.color-temp-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
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
  padding: 14px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.control-btn:active {
  transform: translateY(0);
}

.control-btn.active {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.35) 0%, rgba(102, 126, 234, 0.3) 100%);
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.25);
}

.control-btn.power-on {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.control-btn.power-off {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
  border-color: rgba(255, 255, 255, 0.15);
}

.control-btn.timer-on {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(79, 172, 254, 0.3) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
}

.control-btn.wash-on {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.control-btn.wash-off {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
  border-color: rgba(255, 255, 255, 0.15);
}

.control-btn.wash-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.btn-label {
  font-size: 13px;
  font-weight: 600;
}

/* 模式选择样式 */
.mode-section {
  margin-top: 8px;
}

.mode-grid.disabled {
  pointer-events: none;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 14px;
  text-align: center;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 洗衣机清洁模式竖排 */
.mode-grid.vertical {
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-grid.vertical .mode-btn {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
}

.mode-btn {
  padding: 18px 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.mode-btn.with-icon {
  padding: 24px 12px;
  gap: 0;
}

.mode-btn .mode-icon {
  width: 40px;
  height: 40px;
  color: currentColor;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
}

.mode-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.mode-btn:active {
  transform: translateY(0);
}

.mode-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.mode-btn.active:hover {
  background: linear-gradient(135deg, #fff 0%, #f0f5ff 100%);
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-btn.disabled:hover {
  transform: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: rgba(255, 255, 255, 0.12);
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

.robot-mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.robot-mode-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.robot-mode-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-color: rgba(255, 255, 255, 0.2);
}

.robot-mode-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.robot-mode-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.robot-mode-label {
  font-size: 14px;
  font-weight: 600;
}

.robot-mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.robot-mode-btn.disabled:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: rgba(255, 255, 255, 0.12);
}

.robot-vertical-slider.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.robot-vertical-slider.disabled .slider-thumb-card {
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
  height: 260px;
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

.btn-svg-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 晾衣架专用布局样式 */
.clothes-rack-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.clothes-rack-layout .rack-lift-btn.disabled,
.clothes-rack-layout .rack-function-btn.disabled {
  pointer-events: none;
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
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.rack-power-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.rack-power-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.rack-power-icon {
  width: 22px;
  height: 22px;
}

.rack-power-label {
  font-size: 16px;
  font-weight: 600;
}

.rack-lift-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rack-lift-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.rack-lift-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.rack-lift-btn:active {
  transform: scale(0.98);
}

.rack-lift-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.rack-lift-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rack-btn-label {
  font-size: 14px;
  font-weight: 500;
}

.rack-btn-icon {
  width: 28px;
  height: 28px;
}

.rack-position-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
}

.rack-position-display:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.rack-position-display.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rack-position-label {
  font-size: 14px;
  font-weight: 500;
}

.rack-stop-icon {
  width: 32px;
  height: 32px;
}

.rack-function-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.rack-function-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.rack-function-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.rack-function-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.5);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.rack-function-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rack-func-label {
  font-size: 14px;
  font-weight: 600;
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
