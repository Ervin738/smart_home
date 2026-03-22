<!--
  马桶长按弹窗
  功能：完整马桶控制，状态实时同步到 store/后端
-->
<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible && device" class="dialog-overlay" @click="close">
        <div class="dialog-box" @click.stop>
          <div class="dialog-header">
            <div class="device-name">{{ device.name }}</div>
            <div class="device-status" :class="device.status">
              {{ device.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>

          <!-- 状态和档位显示 -->
          <div class="info-section">
            <div class="status-display">
              <span class="status-text">{{ statusText }}</span>
            </div>
            <div class="level-display">
              <div class="level-item">
                <div class="level-value">{{ waterTemp }}档</div>
                <div class="level-label">水温</div>
              </div>
              <div class="divider-v"></div>
              <div class="level-item">
                <div class="level-value">{{ seatTemp }}档</div>
                <div class="level-label">座温</div>
              </div>
              <div class="divider-v"></div>
              <div class="level-item">
                <div class="level-value">{{ airTemp }}档</div>
                <div class="level-label">风温</div>
              </div>
            </div>
          </div>

          <!-- 关闭 / 停止 -->
          <div class="control-buttons">
            <button class="control-btn" :class="{ active: device.status === 'online' }" @click="handlePower">
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ device.status === 'online' ? '关闭' : '开启' }}</span>
            </button>
            <button class="control-btn" :class="{ active: stopActive, disabled: isOffline }" @click="handleStop">
              <svg class="control-icon" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>停止</span>
            </button>
          </div>

          <!-- 打开 / 关闭 / 泡沫盾 / 冲水 -->
          <div class="mode-buttons">
            <button v-for="btn in modeBtns" :key="btn.action"
              class="mode-btn" :class="{ active: activeAction === btn.action, disabled: isOffline }"
              @click="handleAction(btn.action)">
              <svg class="mode-icon" viewBox="0 0 24 24" fill="none" v-html="btn.icon"></svg>
              <span class="mode-text">{{ btn.label }}</span>
            </button>
          </div>

          <!-- 清洗功能 / 强力烘干 -->
          <div class="wash-section">
            <div class="wash-header-buttons">
              <button class="wash-header-btn" :class="{ active: showWashModes, disabled: isOffline }" @click="toggleWash">
                <svg class="wash-header-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v6M8 6l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 12c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>清洗功能</span>
              </button>
              <button class="wash-header-btn" :class="{ active: dryMode, disabled: isOffline }" @click="toggleDry">
                <svg class="wash-header-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 8h16M4 12h16M4 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>强力烘干</span>
              </button>
            </div>

            <!-- 清洗子模式 -->
            <div v-if="showWashModes" class="wash-buttons">
              <button v-for="btn in washBtns" :key="btn.action"
                class="wash-btn" :class="{ active: washMode === btn.action, disabled: isOffline }"
                @click="setWashMode(btn.action)">
                <svg class="wash-icon" viewBox="0 0 24 24" fill="none" v-html="btn.icon"></svg>
                <span class="wash-text">{{ btn.label }}</span>
              </button>
            </div>

            <!-- 往复（强力烘干子选项） -->
            <div v-if="dryMode" class="dry-button-container">
              <button class="dry-btn" :class="{ active: reciprocate, disabled: isOffline }" @click="toggleReciprocate">
                <svg class="dry-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>往复</span>
              </button>
            </div>
          </div>

          <!-- 水温 / 水强 / 喷头位置 / 座温 -->
          <div class="temp-control-section">
            <div class="temp-control-buttons">
              <button v-for="ctrl in tempCtrls" :key="ctrl.key"
                class="temp-btn" :class="{ active: activeTempCtrl === ctrl.key, disabled: isOffline }"
                @click="toggleTempCtrl(ctrl.key)">
                <svg class="temp-icon" viewBox="0 0 24 24" fill="none" v-html="ctrl.icon"></svg>
                <span class="temp-text">{{ ctrl.label }}</span>
              </button>
            </div>

            <div v-if="activeTempCtrl" class="level-selection">
              <div class="level-title">{{ activeTempLabel }} | {{ activeTempCtrl === 'nozzle' ? '位置' : '档位' }}{{ currentLevel }}</div>
              <div class="level-buttons">
                <button v-for="n in levelRange" :key="n"
                  class="level-btn" :class="{ active: currentLevel === n, disabled: isOffline }"
                  @click="setLevel(n)">
                  {{ n }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Device } from '@/features/device/store/devices.store'
import { useDevicesStore } from '@/features/device/store/devices.store'

interface Props { visible: boolean; device: Device | null }
interface Emits {
  (e: 'update:visible', v: boolean): void
  (e: 'toggle-power'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const store = useDevicesStore()

const isOffline = computed(() => props.device?.status === 'offline')

// ── 从 device 读取档位（后端同步后会更新） ──────────────────────────
const d = () => props.device as any
const waterTemp    = computed(() => d()?.toiletWaterTemp    ?? 4)
const seatTemp     = computed(() => d()?.toiletSeatTemp     ?? 1)
const airTemp      = computed(() => d()?.toiletAirTemp      ?? 5)
const waterStrength = computed(() => d()?.toiletWaterStrength ?? 3)
const nozzlePos    = computed(() => d()?.toiletNozzlePosition ?? 3)
const lidOpen      = computed(() => d()?.toiletLidOpen      ?? false)
const washMode     = computed(() => d()?.toiletWashMode     ?? null)
const dryMode      = computed<boolean>(() => d()?.toiletDryMode ?? false)

// ── 本地瞬态 ──────────────────────────────────────────────────────
const activeAction  = ref<string | null>(null)
const stopActive    = ref(false)
const showWashModes = ref(false)
const reciprocate   = ref(false)
const activeTempCtrl = ref<'water' | 'strength' | 'nozzle' | 'seat' | null>(null)
let actionTimer: number | null = null
let stopTimer: number | null = null

// ── 状态文字 ──────────────────────────────────────────────────────
const statusText = computed(() => {
  if (props.device?.status === 'offline') return '已关机'
  // 优先显示当前激活的操作
  if (activeAction.value === 'open') return '已打开'
  if (activeAction.value === 'close') return '已关闭'
  if (activeAction.value === 'foam') return '泡沫盾已启动'
  if (activeAction.value === 'flush') return '冲水中'
  // 无瞬态操作时，基于持久状态
  const lid = lidOpen.value ? '已打开' : '已关闭'
  const wash = washMode.value
    ? ({ hip: '臀洗中', female: '妇洗中', child: '童洗中', strong: '强洗中' } as Record<string, string>)[washMode.value] ?? ''
    : ''
  return wash ? `${lid} | ${wash}` : lid
})

// 弹窗打开时从 store 恢复持久化状态
watch(() => props.visible, (v) => {
  if (v && props.device) {
    const d = props.device as any
    reciprocate.value = d.toiletReciprocate ?? false
    // 如果有清洗模式激活，自动展开清洗面板
    showWashModes.value = !!(d.toiletWashMode)
    // 恢复上次展开的温控面板
    activeTempCtrl.value = d.toiletActiveTempCtrl ?? null
  }
  if (!v) {
    if (actionTimer) clearTimeout(actionTimer)
    if (stopTimer) clearTimeout(stopTimer)
    activeAction.value = null
    stopActive.value = false
    showWashModes.value = false
    activeTempCtrl.value = null
  }
})

// 离线时重置本地状态
watch(() => props.device?.status, (newStatus) => {
  if (newStatus === 'offline') {
    activeAction.value = null
    stopActive.value = false
    showWashModes.value = false
    activeTempCtrl.value = null
    reciprocate.value = false
  }
})

// ── 按钮定义 ──────────────────────────────────────────────────────
const modeBtns = [
  { action: 'open',  label: '打开', icon: '<path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  { action: 'close', label: '关闭', icon: '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  { action: 'foam',  label: '泡沫盾', icon: '<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="12" r="2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="16" r="2.5" stroke="currentColor" stroke-width="2"/>' },
  { action: 'flush', label: '冲水', icon: '<path d="M12 3v8M9 8l3 3 3-3M6 16c0 2.21 2.686 4 6 4s6-1.79 6-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
]

const washBtns = [
  { action: 'hip',    label: '臀洗',  icon: '<path d="M12 3v6M8 6l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  { action: 'female', label: '妇洗',  icon: '<path d="M12 2v8M9 7l3 3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="16" r="4" stroke="currentColor" stroke-width="2"/>' },
  { action: 'child',  label: '童洗',  icon: '<circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/>' },
  { action: 'strong', label: '强洗',  icon: '<path d="M12 3v6M8 6l4 3 4-3M12 9v6M8 12l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
]

const tempCtrls = [
  { key: 'water' as const,    label: '水温',   icon: '<path d="M12 2v6M8 5l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19" r="2" stroke="currentColor" stroke-width="2"/>' },
  { key: 'strength' as const, label: '水强',   icon: '<path d="M12 2v6M8 5l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 14h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  { key: 'nozzle' as const,   label: '喷头位置', icon: '<path d="M12 3v8M9 8l3 3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  { key: 'seat' as const,     label: '座温',   icon: '<path d="M6 8h12c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="2"/>' },
]

// ── 档位计算 ──────────────────────────────────────────────────────
const activeTempLabel = computed(() => tempCtrls.find(c => c.key === activeTempCtrl.value)?.label ?? '')

const currentLevel = computed(() => {
  switch (activeTempCtrl.value) {
    case 'water':    return waterTemp.value
    case 'strength': return waterStrength.value
    case 'nozzle':   return nozzlePos.value
    case 'seat':     return seatTemp.value
    default: return 0
  }
})

const levelRange = computed(() => {
  // 水温/风温 1-7档，其余 1-5档
  return activeTempCtrl.value === 'water' ? [1,2,3,4,5,6,7] : [1,2,3,4,5]
})

// ── 操作处理 ──────────────────────────────────────────────────────
const close = () => emit('update:visible', false)
const handlePower = () => emit('toggle-power')

const handleStop = () => {
  if (isOffline.value) return
  store.setDeviceExtra(props.device!.id, { toiletWashMode: null, toiletDryMode: false, toiletReciprocate: false })
  reciprocate.value = false
  showWashModes.value = false
  if (stopTimer) clearTimeout(stopTimer)
  stopActive.value = true
  stopTimer = window.setTimeout(() => { stopActive.value = false }, 2000)
}

const handleAction = (action: string) => {
  if (isOffline.value) return
  if (action === 'open' || action === 'close') {
    store.setDeviceExtra(props.device!.id, { toiletLidOpen: action === 'open' })
  }
  if (actionTimer) clearTimeout(actionTimer)
  activeAction.value = action
  actionTimer = window.setTimeout(() => { activeAction.value = null }, 2000)
}

const toggleWash = () => {
  if (isOffline.value) return
  showWashModes.value = !showWashModes.value
}

const toggleDry = () => {
  if (isOffline.value) return
  const next = !dryMode.value
  store.setDeviceExtra(props.device!.id, { toiletDryMode: next })
  if (next) showWashModes.value = false
}

const setWashMode = (mode: string) => {
  if (isOffline.value) return
  const next = washMode.value === mode ? null : mode
  store.setDeviceExtra(props.device!.id, { toiletWashMode: next })
}

const toggleReciprocate = () => {
  if (isOffline.value) return
  reciprocate.value = !reciprocate.value
  store.setDeviceExtra(props.device!.id, { toiletReciprocate: reciprocate.value })
}

const toggleTempCtrl = (key: typeof activeTempCtrl.value) => {
  if (isOffline.value) return
  activeTempCtrl.value = activeTempCtrl.value === key ? null : key
  store.setDeviceExtra(props.device!.id, { toiletActiveTempCtrl: activeTempCtrl.value })
}

const setLevel = (level: number) => {
  if (isOffline.value || !props.device) return
  const fieldMap: Record<string, string> = {
    water: 'toiletWaterTemp', strength: 'toiletWaterStrength',
    nozzle: 'toiletNozzlePosition', seat: 'toiletSeatTemp',
  }
  const field = fieldMap[activeTempCtrl.value!]
  if (field) store.setDeviceExtra(props.device.id, { [field]: level })
}
</script>

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
  background: linear-gradient(135deg, var(--dialog-bg-1) 0%, var(--dialog-bg-2) 50%, var(--dialog-bg-3) 100%);
  backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  width: 340px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.device-name {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.device-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.device-status.online  { background: rgba(74,222,128,0.2); color: #4ade80; }
.device-status.offline { background: rgba(248,113,113,0.2); color: #f87171; }

/* 状态档位区 */
.info-section {
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  margin-bottom: 16px;
}
.status-display { text-align: center; margin-bottom: 16px; }
.status-text { font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.9); }
.level-display { display: flex; align-items: center; justify-content: space-around; }
.level-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.level-value { font-size: 28px; font-weight: 700; color: white; }
.level-label { font-size: 13px; color: rgba(255,255,255,0.7); }
.divider-v { width: 1px; height: 50px; background: rgba(255,255,255,0.2); }

/* 通用按钮基础 */
.control-buttons { display: flex; gap: 12px; margin-bottom: 16px; }
.control-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px 16px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
  font-size: 15px; font-weight: 600;
}
.control-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.control-btn.disabled { opacity: 0.5; pointer-events: none; }
.control-icon { width: 22px; height: 22px; flex-shrink: 0; }

/* 模式按钮 */
.mode-buttons { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
.mode-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 8px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
}
.mode-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.mode-btn.disabled { opacity: 0.5; pointer-events: none; }
.mode-icon { width: 30px; height: 30px; }
.mode-text { font-size: 13px; font-weight: 500; white-space: nowrap; }

/* 清洗区 */
.wash-section {
  padding: 16px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; margin-bottom: 12px;
}
.wash-header-buttons { display: flex; gap: 12px; }
.wash-header-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px 16px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
  font-size: 14px; font-weight: 600;
}
.wash-header-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.wash-header-btn.disabled { opacity: 0.5; pointer-events: none; }
.wash-header-icon { width: 22px; height: 22px; flex-shrink: 0; }

.wash-buttons { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 12px; }
.wash-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 8px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
}
.wash-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.wash-btn.disabled { opacity: 0.5; pointer-events: none; }
.wash-icon { width: 26px; height: 26px; }
.wash-text { font-size: 13px; font-weight: 500; white-space: nowrap; }

.dry-button-container { margin-top: 12px; }
.dry-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 28px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
  font-size: 14px; font-weight: 600;
}
.dry-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.dry-btn.disabled { opacity: 0.5; pointer-events: none; }
.dry-icon { width: 22px; height: 22px; }

/* 温控区 */
.temp-control-section {
  padding: 16px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
}
.temp-control-buttons { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.temp-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 8px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
}
.temp-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.temp-btn.disabled { opacity: 0.5; pointer-events: none; }
.temp-icon { width: 24px; height: 24px; }
.temp-text { font-size: 12px; font-weight: 500; white-space: nowrap; }

.level-selection {
  margin-top: 16px; padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.level-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 12px; }
.level-buttons { display: flex; gap: 8px; justify-content: space-between; }
.level-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 14px 4px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 50%;
  cursor: pointer; transition: all 0.3s; color: rgba(255,255,255,0.9);
  font-size: 15px; font-weight: 600; aspect-ratio: 1;
}
.level-btn.active { background: var(--dialog-btn-active-bg-1); color: white; }
.level-btn.disabled { opacity: 0.5; pointer-events: none; }

.dialog-enter-active, .dialog-leave-active { transition: all 0.3s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-box, .dialog-leave-to .dialog-box { transform: scale(0.9); }
</style>
