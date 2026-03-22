<!--
  饮水机长按弹窗
  功能：显示当前温度和水类型选择
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'
import WaterTypeSettingsDialog from './WaterTypeSettingsDialog.vue'

interface Props {
  visible: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'toggle-power'): void
  (e: 'select-water-type', type: string): void
  (e: 'open-settings'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const devicesStore = useDevicesStore()

// 初始化设备温度
watch(() => props.visible, (visible) => {
  if (visible && props.device) {
    const d = props.device as any
    // 如果设备温度未初始化，设置为15度
    if (d.waterDispenserCurrentTemp === undefined) {
      devicesStore.setWaterDispenserTemp(props.device.id, 15)
    }
    // 如果保温温度未初始化，设置为55度
    if (d.waterDispenserKeepWarmTemp === undefined) {
      devicesStore.setWaterDispenserKeepWarm(props.device.id, false, 55)
    }
  }
})

// 水类型选项
const waterTypes = [
  {
    id: 'tap-water',
    name: '自来水',
    icon: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'
  },
  {
    id: 'purified-water',
    name: '纯净水',
    icon: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'
  },
  {
    id: 'boiled-water',
    name: '凉白开',
    icon: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'
  }
]

// 从设备状态获取数据
const currentTemperature = computed(() => (props.device as any)?.waterDispenserCurrentTemp ?? 15)
const isHeating = computed(() => (props.device as any)?.waterDispenserHeating ?? false)
const selectedWaterType = computed(() => (props.device as any)?.waterDispenserSelectedWaterType ?? 'tap-water')

// 显示水类型设置弹窗
const showWaterTypeSettings = ref(false)
const settingsWaterType = ref('')

// 选择水类型
const selectWaterType = (typeId: string) => {
  if (props.device) {
    devicesStore.setWaterDispenserWaterType(props.device.id, typeId)
  }
  settingsWaterType.value = typeId
  showWaterTypeSettings.value = true
  emit('select-water-type', typeId)
}

// 打开设置弹窗
const openSettings = () => {
  emit('open-settings')
}
</script>

<template>
  <transition name="dialog">
    <div v-if="visible && device" class="dialog-overlay" @click="emit('update:visible', false)">
      <div class="dialog-content water-dispenser-dialog" @click.stop>
        <div class="dialog-header">
          <div class="device-info">
            <div class="device-title">{{ device.name }}</div>
            <div class="device-type-label">饮水机</div>
          </div>
          <div class="device-status-tag" :class="device.status">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </div>
        </div>

        <div class="water-dispenser-layout">
          <!-- 电源按钮 -->
          <div 
            class="power-btn"
            :class="{ active: device.status === 'online' }"
            @click="emit('toggle-power')"
          >
            <svg class="power-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="power-label">{{ device.status === 'online' ? '关闭' : '开启' }}</span>
          </div>

          <!-- 温度显示 -->
          <div class="temperature-display">
            <div class="status-label">{{ isHeating ? '烧水中...' : '待机' }}</div>
            <div class="temperature-value">{{ currentTemperature }}</div>
            <div class="temperature-unit">当前温度 (°C)</div>
          </div>

          <!-- 水类型选择 -->
          <div class="water-types-section">
            <div class="section-title">设备上的模式</div>
            <div class="water-types-list">
              <div 
                v-for="waterType in waterTypes" 
                :key="waterType.id"
                class="water-type-item"
                :class="{ 
                  selected: selectedWaterType === waterType.id,
                  disabled: device.status === 'offline'
                }"
                @click="device.status === 'online' && selectWaterType(waterType.id)"
              >
                <div class="water-type-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path :d="waterType.icon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="water-type-name">{{ waterType.name }}</span>
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 水类型设置弹窗 -->
      <WaterTypeSettingsDialog
        v-model:visible="showWaterTypeSettings"
        :device="device"
        :water-type="settingsWaterType"
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

.water-dispenser-dialog {
  width: 360px;
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

/* 饮水机布局 */
.water-dispenser-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 电源按钮 */
.power-btn {
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

.power-btn:hover {
  background: linear-gradient(135deg, rgba(80, 140, 190, 0.4) 0%, rgba(110, 160, 210, 0.35) 100%);
  border-color: rgba(130, 180, 230, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.power-btn.active {
  background: var(--dialog-btn-active-bg-1);
  color: white;
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

/* 温度显示 */
.temperature-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 24px 18px;
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
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.temperature-value {
  font-size: 64px;
  font-weight: 700;
  color: white;
  line-height: 1;
  margin-bottom: 8px;
}

.temperature-unit {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* 水类型选择 */
.water-types-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  padding-left: 4px;
}

.water-types-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.water-type-item {
  display: flex;
  align-items: center;
  gap: 14px;
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.water-type-item:hover:not(.disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  transform: translateY(-2px);
}

.water-type-item.selected {
  background: var(--dialog-btn-active-bg-1);
}

.water-type-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.water-type-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(38, 208, 206, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.water-type-icon svg {
  width: 24px;
  height: 24px;
  color: #26d0ce;
}

.water-type-name {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: white;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
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
