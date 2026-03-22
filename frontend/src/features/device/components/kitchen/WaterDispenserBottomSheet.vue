<!--
  饮水机底部弹窗
  功能：显示开关和水类型快捷选择
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
  (e: 'select-water-type', type: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useDevicesStore()

// 水类型选项
const waterTypes = [
  { id: 'tap-water', name: '自来水' },
  { id: 'purified-water', name: '纯净水' },
  { id: 'boiled-water', name: '凉白开' }
]

const selectedWaterType = computed({
  get: () => (props.device as any)?.waterDispenserSelectedWaterType ?? 'tap-water',
  set: (v: string) => { if (props.device) store.setDeviceExtra(props.device.id, { waterDispenserSelectedWaterType: v }) }
})

// 选择水类型
const selectWaterType = (typeId: string) => {
  if (props.device?.status === 'offline') return
  selectedWaterType.value = typeId
  emit('select-water-type', typeId)
}

// 切换电源
const togglePower = () => {
  emit('toggle-power')
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="visible && device" class="bottom-water-dispenser-bar" @click.stop>
      <div class="water-dispenser-bar-content">
        <!-- 左侧电源按钮 -->
        <div class="control-section">
          <div 
            class="control-btn"
            :class="{ active: device.status === 'online' }"
            @click="togglePower"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="btn-text">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="divider"></div>
        
        <!-- 右侧水类型选择 -->
        <div class="water-type-section">
          <div 
            v-for="waterType in waterTypes" 
            :key="waterType.id"
            class="water-type-btn"
            :class="{ 
              active: selectedWaterType === waterType.id,
              disabled: device.status === 'offline'
            }"
            @click="selectWaterType(waterType.id)"
          >
            <span class="water-type-label">{{ waterType.name }}</span>
          </div>
        </div>
        
        <!-- 顶部居中设备名称 -->
        <div class="device-name">{{ device.name }} · 饮水机</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.bottom-water-dispenser-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.water-dispenser-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    var(--dialog-bg-1) 0%,
    var(--dialog-bg-2) 50%,
    var(--dialog-bg-3) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  position: relative;
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.3) 0%, rgba(100, 150, 200, 0.25) 100%);
  border: 1px solid rgba(120, 170, 220, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: none;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  box-shadow: none;
}

.control-btn.active {
  background: var(--bottom-bar-active-bg);
  border: none;
  border-radius: 16px;
  color: white;
  box-shadow: none;
  outline: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.water-type-section {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.water-type-section::-webkit-scrollbar {
  display: none;
}

.water-type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.water-type-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
}

.water-type-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.water-type-btn.active {
  background: var(--bottom-bar-active-bg) !important;
  border: none;
}

.water-type-label {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.water-type-btn.active .water-type-label {
  color: white;
}

.device-name {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
