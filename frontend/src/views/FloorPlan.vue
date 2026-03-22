<!--
  平面图模式 - 与后端持久化同步，与标准模式导航栏房间共享数据
-->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useTabsStore } from '@/features/layout/tabs'
import { useDevicesStore } from '@/features/device/store/devices.store'
import type { Device } from '@/features/device/store/devices.store'
import { getDeviceDisplayType } from '@/constants/deviceTypes'
import { roomApi, deviceApi } from '@/services/api'

const themeStore   = useThemeStore()
const tabsStore    = useTabsStore()
const devicesStore = useDevicesStore()

const deviceIconMap: Record<string, string> = {
  // 灯光
  'light-table-lamp': '🪔', 'light-ceiling-lamp': '💡',
  // 开关
  'switch-socket': '🔌', 'switch-switch': '🔆',
  // 清洁
  'cleaner-washing-machine': '🫧', 'cleaner-dryer': '🌀', 'cleaner-robot-vacuum': '🤖', 'cleaner-clothes-rack': '👕',
  // 安防
  'security-camera': '📷', 'security-door-lock': '🔐', 'security-smart-door': '🚪',
  // 环境
  'environment-air-conditioner': '❄️', 'environment-heater': '🔥', 'environment-humidifier': '💧',
  'environment-fan': '🌀', 'environment-air-purifier': '🌬️', 'environment-dehumidifier': '☁️',
  'environment-aroma-diffuser': '🌸',
  // 个人
  'personal-smart-bed': '🛏️', 'personal-smart-pillow': '🪨', 'personal-electric-blanket': '🧣',
  'personal-window-opener': '🪟',
  // 浴室
  'bathroom-toilet': '🚽', 'bathroom-water-heater': '🚿', 'bathroom-yuba': '☀️',
  // 厨房
  'kitchen-rice-cooker': '🍚', 'kitchen-induction-cooker': '🍳', 'kitchen-range-hood': '💨',
  'kitchen-electric-kettle': '🫖', 'kitchen-air-fryer': '🥘', 'kitchen-water-dispenser': '🚰',
  // 网络
  'network-router': '📡', 'network-gateway': '🌐', 'network-wifi-extender': '📶',
  // 娱乐
  'entertainment-tv': '📺', 'entertainment-speaker': '🔊', 'entertainment-projector': '🎬',
  'entertainment-clock': '⏰',
  // 大类兜底
  light: '💡', switch: '🔌', cleaner: '🧹', security: '🔒',
  environment: '🌡️', personal: '🛏️', bathroom: '🚿',
  kitchen: '🍳', network: '📡', entertainment: '📺', other: '📦',
}

function getDeviceIcon(device: Device): string {
  const d = device as any
  const subKey =
    d.lightType        ? `light-${d.lightType}`         :
    d.switchType       ? `switch-${d.switchType}`        :
    d.cleanerType      ? `cleaner-${d.cleanerType}`      :
    d.securityType     ? `security-${d.securityType}`    :
    d.environmentType  ? `environment-${d.environmentType}` :
    d.personalType     ? `personal-${d.personalType}`    :
    d.bathroomType     ? `bathroom-${d.bathroomType}`    :
    d.kitchenType      ? `kitchen-${d.kitchenType}`      :
    d.networkType      ? `network-${d.networkType}`      :
    d.entertainmentType? `entertainment-${d.entertainmentType}` : null
  return (subKey && deviceIconMap[subKey]) || deviceIconMap[device.type] || '📦'
}
function devicesInRoom(roomName: string) {
  return devicesStore.devices.filter(d => d.location === roomName)
}

// ── 设备在房间内拖动 ──────────────────────────────────
const CHIP_W = 32
const CHIP_H = 32
const CHIP_PAD = 16  // 胶囊间距
const CHIP_TOP = 36  // 顶部留给房间名标签的空间
const CHIP_BOTTOM_PAD = 28 // 底部留给开关按钮的空间

// 拖动中用本地 Map 缓存临时位置，mouseup 时才写 store/后端
const devicePosOverride = ref<Map<string, { x: number; y: number }>>(new Map())

function getDevicePos(device: Device): { x: number; y: number } {
  if (devicePosOverride.value.has(device.id)) return devicePosOverride.value.get(device.id)!
  const d = device as any
  if (d.fp_dx != null && d.fp_dy != null) return { x: Number(d.fp_dx), y: Number(d.fp_dy) }
  return { x: -1, y: -1 } // 未初始化，由 autoLayoutDevice 处理
}

/** 计算新设备的初始位置：从左上角按行排列，不与已有设备重叠 */
function autoLayoutDevice(
  device: Device,
  roomDevices: Device[],
  roomW: number,
  roomH: number
): { x: number; y: number } {
  const cols = Math.max(1, Math.floor((roomW - CHIP_PAD) / (CHIP_W + CHIP_PAD)))

  // 收集所有其他设备的已知位置（包括 override 和 extra 里的）
  const knownPositions: { x: number; y: number }[] = []
  // 未初始化的设备需要按 grid 顺序预分配位置，避免互相重叠
  let gridSlot = 0

  for (const d of roomDevices) {
    if (d.id === device.id) continue
    if (devicePosOverride.value.has(d.id)) {
      knownPositions.push(devicePosOverride.value.get(d.id)!)
      continue
    }
    const dd = d as any
    if (dd.fp_dx != null && dd.fp_dy != null) {
      knownPositions.push({ x: Number(dd.fp_dx), y: Number(dd.fp_dy) })
      continue
    }
    // 未初始化设备：按 grid 顺序找一个不与已知位置冲突的槽位
    while (true) {
      const row = Math.floor(gridSlot / cols)
      const col = gridSlot % cols
      gridSlot++
      const x = CHIP_PAD + col * (CHIP_W + CHIP_PAD)
      const y = CHIP_TOP + row * (CHIP_H + CHIP_PAD)
      if (y + CHIP_H > roomH - CHIP_BOTTOM_PAD) continue
      const blocked = knownPositions.some(p => Math.abs(p.x - x) < CHIP_W && Math.abs(p.y - y) < CHIP_H)
      if (!blocked) {
        knownPositions.push({ x, y })
        break
      }
    }
  }

  for (let row = 0; ; row++) {
    for (let col = 0; col < cols; col++) {
      const x = CHIP_PAD + col * (CHIP_W + CHIP_PAD)
      const y = CHIP_TOP + row * (CHIP_H + CHIP_PAD)
      if (y + CHIP_H > roomH - CHIP_BOTTOM_PAD) continue
      const overlaps = knownPositions.some(p =>
        Math.abs(p.x - x) < CHIP_W && Math.abs(p.y - y) < CHIP_H
      )
      if (!overlaps) return { x, y }
    }
    if (row > 20) break
  }
  return { x: CHIP_PAD, y: CHIP_TOP }
}

function getOrInitDevicePos(device: Device, roomDevices: Device[], roomW: number, roomH: number) {
  const pos = getDevicePos(device)
  if (pos.x >= 0) return pos
  // 未初始化，自动排列
  const newPos = autoLayoutDevice(device, roomDevices, roomW, roomH)
  // 立即写入 override，让同房间其他设备初始化时能感知到此位置
  devicePosOverride.value = new Map(devicePosOverride.value).set(device.id, newPos)
  devicesStore.setDeviceExtra(device.id, { fp_dx: newPos.x, fp_dy: newPos.y })
  return newPos
}

function onDeviceMouseDown(e: MouseEvent, device: Device, room: { fp_x: number|null; fp_y: number|null; fp_w: number|null; fp_h: number|null }, roomDevices: Device[]) {
  e.preventDefault(); e.stopPropagation()
  showDevicePopup.value = false
  const rw = Number(room.fp_w ?? 120), rh = Number(room.fp_h ?? 90)
  const cur = getOrInitDevicePos(device, roomDevices, rw, rh)
  const startX = e.clientX - cur.x
  const startY = e.clientY - cur.y

  const onMove = (ev: MouseEvent) => {
    const nx = Math.max(0, Math.min(ev.clientX - startX, rw - CHIP_W))
    const ny = Math.max(0, Math.min(ev.clientY - startY, rh - CHIP_H - CHIP_BOTTOM_PAD))
    // 碰撞检测：不与其他胶囊重叠
    const others = roomDevices.filter(d => d.id !== device.id)
    const blocked = others.some(d => {
      const p = getDevicePos(d)
      if (p.x < 0) return false
      return Math.abs(p.x - nx) < CHIP_W - 4 && Math.abs(p.y - ny) < CHIP_H - 4
    })
    if (!blocked) {
      devicePosOverride.value = new Map(devicePosOverride.value).set(device.id, { x: nx, y: ny })
    }
  }
  const onUp = () => {
    const pos = devicePosOverride.value.get(device.id)
    if (pos) devicesStore.setDeviceExtra(device.id, { fp_dx: pos.x, fp_dy: pos.y })
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── 设备快捷开关浮层 ──────────────────────────────────
const selectedDevice = ref<Device | null>(null)
const popupPos = ref({ x: 0, y: 0 })
const showDevicePopup = ref(false)

function onDeviceChipClick(e: MouseEvent, device: Device) {
  e.stopPropagation()
  if (selectedDevice.value?.id === device.id && showDevicePopup.value) {
    showDevicePopup.value = false
    return
  }
  selectedDevice.value = device
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  popupPos.value = { x: rect.left + rect.width / 2, y: rect.top - 8 }
  showDevicePopup.value = true
}

function handleTogglePower() {
  if (selectedDevice.value) devicesStore.toggleStatus(selectedDevice.value.id)
}

function closePopup() {
  showDevicePopup.value = false
}

// ── 一键全开 ──────────────────────────────────────────
async function handleAllOn() {
  const offline = devicesStore.devices.filter(d => d.status === 'offline')
  offline.forEach(d => { d.status = 'online' })
  await Promise.all(offline.map(d =>
    deviceApi.update(d.id, { status: { power: true } }).catch(() => {})
  ))
}

// ── 单房间开/关 ───────────────────────────────────────
async function handleRoomOn(roomName: string) {
  const devices = devicesStore.devices.filter(d => d.location === roomName && d.status === 'offline')
  devices.forEach(d => { d.status = 'online' })
  await Promise.all(devices.map(d =>
    deviceApi.update(d.id, { status: { power: true } }).catch(() => {})
  ))
}

async function handleRoomOff(roomName: string) {
  const devices = devicesStore.devices.filter(d => d.location === roomName && d.status === 'online')
  devices.forEach(d => { d.status = 'offline' })
  await Promise.all(devices.map(d =>
    deviceApi.update(d.id, { status: { power: false } }).catch(() => {})
  ))
}

// ── 离家模式（关闭所有设备） ──────────────────────────
async function handleLeave() {
  const online = devicesStore.devices.filter(d => d.status === 'online')
  online.forEach(d => { d.status = 'offline' })
  await Promise.all(online.map(d =>
    deviceApi.update(d.id, { status: { power: false } }).catch(() => {})
  ))
}

// ── 锁定状态 ──────────────────────────────────────────
const locked = computed(() =>
  tabsStore.rooms.filter(r => r.fp_x !== null).length > 0 &&
  tabsStore.rooms.filter(r => r.fp_x !== null).every(r => r.fp_locked)
)
const saving = ref(false)

async function handleSave() {
  saving.value = true
  await tabsStore.lockAllFloorPlan()
  saving.value = false
}
async function handleEdit() {
  await tabsStore.unlockAllFloorPlan()
}

const MIN_SIZE   = 60
const DEFAULT_W  = 120
const DEFAULT_H  = 90
const ROOM_COLOR = 'rgba(160,200,230,0.35)'

type Direction = 'n'|'s'|'e'|'w'|'nw'|'ne'|'se'|'sw'
const cursorMap: Record<Direction, string> = {
  n:'n-resize', s:'s-resize', e:'e-resize', w:'w-resize',
  nw:'nw-resize', ne:'ne-resize', se:'se-resize', sw:'sw-resize',
}

// 只显示已有平面图坐标的房间（fp_x != null），或全部显示但未放置的在左侧列表
const placedRooms = computed(() =>
  tabsStore.rooms.filter(r => r.fp_x !== null)
)
const unplacedRooms = computed(() =>
  tabsStore.rooms.filter(r => r.fp_x === null)
)

// ── 画布 ──────────────────────────────────────────────
const canvasRef    = ref<HTMLElement | null>(null)
const isDragOver   = ref(false)
const activeId     = ref<number | null>(null)
const resizingId   = ref<number | null>(null)
const editingId    = ref<number | null>(null)
const editingName  = ref('')

// ── 碰撞检测 ──────────────────────────────────────────
const GAP = -1
function overlaps(a: {x:number;y:number;w:number;h:number}, b: {fp_x:number|null;fp_y:number|null;fp_w:number|null;fp_h:number|null}) {
  if (b.fp_x === null) return false
  const bx = Number(b.fp_x), by = Number(b.fp_y), bw = Number(b.fp_w), bh = Number(b.fp_h)
  return (
    a.x < bx + bw - GAP &&
    a.x + a.w > bx + GAP &&
    a.y < by + bh - GAP &&
    a.y + a.h > by + GAP
  )
}
function hasCollision(candidate: {x:number;y:number;w:number;h:number}, excludeId: number) {
  return tabsStore.rooms.some(r => r.id !== excludeId && overlaps(candidate, r))
}

// ── 拖入（从左侧未放置列表 或 新建空房间） ──────────────
const draggingRoomId = ref<number | null>(null)

function onPresetDragStart(e: DragEvent, roomId: number) {
  draggingRoomId.value = roomId
  e.dataTransfer!.effectAllowed = 'copy'
}
function onCanvasDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
  isDragOver.value = true
}
function onCanvasDragLeave(e: DragEvent) {
  if (!canvasRef.value?.contains(e.relatedTarget as Node)) isDragOver.value = false
}
async function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  if (!canvasRef.value || locked.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = Math.max(0, e.clientX - rect.left - DEFAULT_W / 2)
  const y = Math.max(0, e.clientY - rect.top  - DEFAULT_H / 2)

  if (draggingRoomId.value !== null) {
    // 放置已有未放置的房间
    const room = tabsStore.rooms.find(r => r.id === draggingRoomId.value)
    draggingRoomId.value = null
    if (!room) return
    if (!hasCollision({ x, y, w: DEFAULT_W, h: DEFAULT_H }, room.id)) {
      room.fp_x = x; room.fp_y = y; room.fp_w = DEFAULT_W; room.fp_h = DEFAULT_H
      tabsStore.persistFloorPlan(room.id, { fp_x: x, fp_y: y, fp_w: DEFAULT_W, fp_h: DEFAULT_H })
      editingId.value   = room.id
      editingName.value = room.name
      nextTick(() => {
        const el = document.getElementById(`inp_${room.id}`) as HTMLInputElement | null
        el?.focus(); el?.select()
      })
    }
  } else {
    // 新建空房间
    const ok = await tabsStore.addTab('空房间')
    if (!ok) return
    const room = tabsStore.rooms[tabsStore.rooms.length - 1]
    if (!room) return
    if (!hasCollision({ x, y, w: DEFAULT_W, h: DEFAULT_H }, room.id)) {
      room.fp_x = x; room.fp_y = y; room.fp_w = DEFAULT_W; room.fp_h = DEFAULT_H
      tabsStore.persistFloorPlan(room.id, { fp_x: x, fp_y: y, fp_w: DEFAULT_W, fp_h: DEFAULT_H })
    }
    editingId.value   = room.id
    editingName.value = room.name
    nextTick(() => {
      const el = document.getElementById(`inp_${room.id}`) as HTMLInputElement | null
      el?.focus(); el?.select()
    })
  }
}

// ── 移动 ──────────────────────────────────────────────
function onRoomMouseDown(e: MouseEvent, roomId: number) {
  if (editingId.value === roomId) return
  if (locked.value) return   // 锁定时不可移动
  e.preventDefault(); e.stopPropagation()
  activeId.value = roomId
  const room = tabsStore.rooms.find(r => r.id === roomId)!
  // 强制转 number，防止后端返回字符串
  const ox = e.clientX - Number(room.fp_x), oy = e.clientY - Number(room.fp_y)
  let lastX = Number(room.fp_x), lastY = Number(room.fp_y)

  const onMove = (ev: MouseEvent) => {
    if (!canvasRef.value) return
    const r = canvasRef.value.getBoundingClientRect()
    const fw = Number(room.fp_w), fh = Number(room.fp_h)
    const nx = Math.max(0, Math.min(ev.clientX - ox, r.width  - fw))
    const ny = Math.max(0, Math.min(ev.clientY - oy, r.height - fh))
    const cand = { x: nx, y: ny, w: fw, h: fh }
    if (!hasCollision(cand, roomId)) {
      room.fp_x = nx; room.fp_y = ny
      lastX = nx; lastY = ny
    } else {
      if (!hasCollision({ x: nx, y: lastY, w: fw, h: fh }, roomId)) {
        room.fp_x = nx; lastX = nx
      }
      if (!hasCollision({ x: lastX, y: ny, w: fw, h: fh }, roomId)) {
        room.fp_y = ny; lastY = ny
      }
    }
  }
  const onUp = () => {
    activeId.value = null
    tabsStore.persistFloorPlan(roomId)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Resize ────────────────────────────────────────────
function onResizeMouseDown(e: MouseEvent, roomId: number, dir: Direction) {
  if (locked.value) return   // 锁定时不可 resize
  e.preventDefault(); e.stopPropagation()
  resizingId.value = roomId
  const room = tabsStore.rooms.find(r => r.id === roomId)!
  const sx = e.clientX, sy = e.clientY
  const ox = Number(room.fp_x), oy = Number(room.fp_y)
  const ow = Number(room.fp_w), oh = Number(room.fp_h)

  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy
    let nx = ox, ny = oy, nw = ow, nh = oh
    if (dir.includes('e')) nw = Math.max(MIN_SIZE, ow + dx)
    if (dir.includes('s')) nh = Math.max(MIN_SIZE, oh + dy)
    if (dir.includes('w')) { nw = Math.max(MIN_SIZE, ow - dx); nx = ox + ow - nw }
    if (dir.includes('n')) { nh = Math.max(MIN_SIZE, oh - dy); ny = oy + oh - nh }
    if (!hasCollision({ x: nx, y: ny, w: nw, h: nh }, roomId)) {
      room.fp_x = nx; room.fp_y = ny; room.fp_w = nw; room.fp_h = nh
    }
  }
  const onUp = () => {
    resizingId.value = null
    tabsStore.persistFloorPlan(roomId)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── 改名 ──────────────────────────────────────────────
function onRoomDblClick(roomId: number, name: string) {
  if (locked.value) return   // 锁定时不可改名
  editingId.value   = roomId
  editingName.value = name
  nextTick(() => {
    const el = document.getElementById(`inp_${roomId}`) as HTMLInputElement | null
    el?.focus(); el?.select()
  })
}
function commitEdit(roomId: number) {
  const name = editingName.value.trim()
  if (name) tabsStore.updateFloorPlan(roomId, { name })
  editingId.value = null
}

// ── 右键删除（从画布移除，但保留房间记录） ────────────
function onRoomContextMenu(e: MouseEvent, roomId: number) {
  e.preventDefault()
  const room = tabsStore.rooms.find(r => r.id === roomId)
  if (!room) return
  room.fp_x = null; room.fp_y = null; room.fp_w = null; room.fp_h = null; room.fp_locked = false
  roomApi.update(roomId, { fp_x: null, fp_y: null, fp_w: null, fp_h: null, fp_locked: 0 }).catch(() => {})
}
</script>

<template>
  <div class="fp-wrapper">
    <!-- 左侧面板 -->
    <aside class="fp-sidebar">
      <p class="sidebar-title">拖动添加至户型图</p>

      <!-- 保存 / 编辑 按钮（固定在顶部） -->
      <div class="action-area">
        <button v-if="!locked" class="save-btn" :disabled="saving || placedRooms.length === 0" @click="handleSave">
          {{ saving ? '保存中…' : '保存布局' }}
        </button>
        <button v-else class="edit-btn" @click="handleEdit">
          编辑布局
        </button>
        <!-- 一键全开 -->
        <button class="allon-btn" @click="handleAllOn">⚡ 一键全开</button>
        <!-- 离家模式 -->
        <button class="leave-btn" @click="handleLeave">🚪 离家模式</button>
      </div>

      <!-- 可滚动内容区 -->
      <div class="sidebar-scroll">
        <template v-if="!locked">
          <!-- 新建空房间 -->
          <div
            class="preset-item new-room"
            draggable="true"
            @dragstart="(e) => { draggingRoomId = null; e.dataTransfer!.effectAllowed = 'copy' }"
          >
            <div class="preset-thumb" :style="{ background: ROOM_COLOR }"></div>
            <span class="preset-label">空房间</span>
          </div>

          <!-- 已有但未放置的房间 -->
          <template v-if="unplacedRooms.length > 0">
            <div class="section-label">未放置</div>
            <div
              v-for="room in unplacedRooms" :key="room.id"
              class="preset-item"
              draggable="true"
              @dragstart="onPresetDragStart($event, room.id)"
            >
              <div class="preset-thumb placed" :style="{ background: ROOM_COLOR }"></div>
              <span class="preset-label">{{ room.name }}</span>
            </div>
          </template>

          <p class="sidebar-hint">拖拽边角调整大小<br/>双击重命名<br/>右键移出画布</p>
        </template>

        <template v-else>
          <p class="sidebar-hint locked-hint">布局已锁定<br/>点击上方「编辑」重新调整</p>
        </template>
      </div>
    </aside>

    <!-- 画布 -->
    <div
      ref="canvasRef"
      class="fp-canvas"
      :class="{ 'drag-over': isDragOver }"
      @dragover="onCanvasDragOver"
      @dragleave="onCanvasDragLeave"
      @drop="onCanvasDrop"
    >
      <div v-if="placedRooms.length === 0" class="empty-hint">
        <span>从左侧拖入房间开始绘制户型图</span>
      </div>

      <div
        v-for="room in placedRooms" :key="room.id"
        class="fp-room"
        :class="{ active: activeId === room.id || resizingId === room.id, locked: room.fp_locked }"
        :style="{
          left: room.fp_x + 'px', top: room.fp_y + 'px',
          width: room.fp_w + 'px', height: room.fp_h + 'px',
        }"
        @mousedown="onRoomMouseDown($event, room.id)"
        @dblclick="onRoomDblClick(room.id, room.name)"
        @contextmenu="onRoomContextMenu($event, room.id)"
      >
        <div class="room-inner">
          <template v-if="editingId === room.id">
            <input
              :id="`inp_${room.id}`"
              class="room-input"
              v-model="editingName"
              @blur="commitEdit(room.id)"
              @keyup.enter="commitEdit(room.id)"
              @mousedown.stop
            />
          </template>
          <template v-else>
            <span class="room-label">{{ room.name }}</span>
            <!-- 房间快捷开关 -->
            <div class="room-power-btns">
              <button class="room-power-btn on" @click.stop="handleRoomOn(room.name)" title="开启本房间所有设备">⚡</button>
              <button class="room-power-btn off" @click.stop="handleRoomOff(room.name)" title="关闭本房间所有设备">🌙</button>
            </div>
            <div v-if="devicesInRoom(room.name).length > 0" class="device-grid">
              <div
                v-for="device in devicesInRoom(room.name)"
                :key="device.id"
                class="device-chip"
                :class="{ online: device.status === 'online' }"
                :style="{
                  position: 'absolute',
                  left: getOrInitDevicePos(device, devicesInRoom(room.name), Number(room.fp_w ?? 120), Number(room.fp_h ?? 90)).x + 'px',
                  top:  getOrInitDevicePos(device, devicesInRoom(room.name), Number(room.fp_w ?? 120), Number(room.fp_h ?? 90)).y + 'px',
                }"
                :title="device.name + ' · ' + getDeviceDisplayType(device)"
                @mousedown.stop="onDeviceMouseDown($event, device, room, devicesInRoom(room.name))"
                @click.stop="onDeviceChipClick($event, device)"
              >
                <span class="device-icon">{{ getDeviceIcon(device) }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- resize handles 锁定时隐藏 -->
        <template v-if="!room.fp_locked">
          <div v-for="dir in (['n','s','e','w'] as Direction[])" :key="dir"
            class="rh-edge" :class="`rh-${dir}`"
            :style="{ cursor: cursorMap[dir] }"
            @mousedown.stop="onResizeMouseDown($event, room.id, dir)"
          ></div>
          <div v-for="dir in (['nw','ne','se','sw'] as Direction[])" :key="dir"
            class="rh-corner" :class="`rh-${dir}`"
            :style="{ cursor: cursorMap[dir] }"
            @mousedown.stop="onResizeMouseDown($event, room.id, dir)"
          ></div>
        </template>
      </div>
    </div>
  </div>

  <!-- 设备快捷开关浮层 -->
  <teleport to="body">
    <transition name="popup">
      <div
        v-if="showDevicePopup && selectedDevice"
        class="device-popup"
        :style="{ left: popupPos.x + 'px', top: popupPos.y + 'px' }"
        @click.stop
      >
        <div class="popup-name">{{ selectedDevice.name }}</div>
        <div class="popup-type">{{ getDeviceDisplayType(selectedDevice) }}</div>
        <button
          class="popup-toggle"
          :class="{ on: selectedDevice.status === 'online' }"
          @click="handleTogglePower"
        >
          <svg viewBox="0 0 24 24" fill="none" class="popup-icon">
            <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          {{ selectedDevice.status === 'online' ? '关闭' : '开启' }}
        </button>
      </div>
    </transition>
    <!-- 点击外部关闭 -->
    <div v-if="showDevicePopup" class="popup-mask" @click="closePopup" />
  </teleport>
</template>

<style scoped>
.fp-wrapper { display:flex; width:100%; height:100%; gap:16px; overflow:hidden; }

.fp-sidebar { width:150px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; padding:4px 0 0; overflow:hidden; }
.fp-sidebar::-webkit-scrollbar { display:none; }

.sidebar-title { font-size:11px; color:v-bind('themeStore.textColorSecondary'); margin:0 0 8px; line-height:1.5; }
.section-label { font-size:10px; color:v-bind('themeStore.textColorSecondary'); opacity:0.5; margin:8px 0 2px 8px; }

.sidebar-scroll { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; min-height:0; }
.sidebar-scroll::-webkit-scrollbar { display:none; }

.preset-item {
  display:flex; align-items:center; gap:10px;
  cursor:grab; user-select:none;
  padding:6px 8px; border-radius:8px; transition:background 0.15s;
}
.preset-item:hover { background:rgba(255,255,255,0.08); }
.preset-item:active { cursor:grabbing; }

.preset-thumb {
  width:32px; height:24px; border-radius:4px;
  border:1.5px solid rgba(160,185,220,0.55); flex-shrink:0;
}
.preset-thumb.placed { border-style:dashed; }

.preset-label { font-size:12px; color:v-bind('themeStore.textColor'); }
.sidebar-hint { font-size:10px; color:v-bind('themeStore.textColorSecondary'); line-height:1.7; opacity:0.5; padding:0 8px; margin-top:8px; }
.locked-hint { color:v-bind('themeStore.textColorSecondary'); opacity:0.7; margin-top:12px; }

/* 保存/编辑按钮 */
.action-area { padding:4px 0 8px; flex-shrink:0; }
.save-btn, .edit-btn {
  width:100%; padding:8px 0; border-radius:20px; border:none;
  font-size:12px; font-weight:600; letter-spacing:0.05em;
  cursor:pointer; transition:all 0.2s;
}
.save-btn {
  background:rgba(60,160,100,0.85); color:#fff;
  border:1.5px solid rgba(60,160,100,0.9);
}
.save-btn:hover:not(:disabled) { background:rgba(60,160,100,1); }
.save-btn:disabled { opacity:0.35; cursor:not-allowed; }
.edit-btn {
  background:rgba(100,140,200,0.75); color:#fff;
  border:1.5px solid rgba(100,140,200,0.9);
}
.edit-btn:hover { background:rgba(100,140,200,0.95); }
.allon-btn {
  width:100%; padding:7px 0; border-radius:20px; border:none;
  font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s;
  background:rgba(250,180,50,0.8); color:#fff;
  border:1.5px solid rgba(250,180,50,0.9); margin-top:6px;
}
.allon-btn:hover { background:rgba(250,180,50,1); }
.leave-btn {
  width:100%; padding:7px 0; border-radius:20px; border:none;
  font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s;
  background:rgba(100,120,180,0.75); color:#fff;
  border:1.5px solid rgba(100,120,180,0.9); margin-top:6px;
}
.leave-btn:hover { background:rgba(100,120,180,1); }

/* 画布 */
.fp-canvas {
  flex:1; min-width:0; height:100%; position:relative;
  border-radius:12px; border:1.5px dashed rgba(160,185,220,0.2);
  overflow:hidden; transition:border-color 0.2s, background 0.2s;
}
.fp-canvas.drag-over { border-color:rgba(160,185,220,0.55); background:rgba(160,200,240,0.05); }
.empty-hint { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.empty-hint span { font-size:13px; color:v-bind('themeStore.textColorSecondary'); opacity:0.45; }

/* 房间块 */
.fp-room {
  position:absolute; border-radius:8px;
  border:1.5px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.20) !important;
  cursor:move; user-select:none;
  transition:box-shadow 0.15s, border-color 0.15s;
}
.fp-room.locked { cursor:default; }
.fp-room:not(.locked):hover, .fp-room.active {
  border-color:rgba(255,255,255,0.35);
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
  z-index:10;
}
.room-inner { width:100%; height:100%; position:relative; padding:4px; box-sizing:border-box; }
.room-inner::before { display:none; }
.room-label {
  position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);
  font-size:13px; font-weight:600; color:rgba(255,255,255,0.45);
  pointer-events:none; white-space:nowrap; z-index:0;
  letter-spacing:0.05em;
}

.room-power-btns {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
}

.fp-room:hover .room-power-btns { opacity: 1; }

.room-power-btn {
  padding: 2px 8px;
  border-radius: 10px;
  border: none;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.room-power-btn.on { background: rgba(250,180,50,0.8); color:#fff; }
.room-power-btn.on:hover { background: rgba(250,180,50,1); }
.room-power-btn.off { background: rgba(100,120,180,0.7); color:#fff; }
.room-power-btn.off:hover { background: rgba(100,120,180,0.95); }
.room-input {
  background:rgba(255,255,255,0.85); border:1px solid rgba(100,140,200,0.5);
  border-radius:14px; padding:3px 10px; font-size:12px;
  color:rgba(40,60,100,0.9); outline:none; width:80%; text-align:center;
}

/* 设备网格 */
.device-grid {
  position:absolute; inset:0; pointer-events:none;
}
.device-chip {
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:5px;
  width:32px; height:32px; box-sizing:border-box;
  backdrop-filter:blur(4px);
  transition:background 0.15s, border-color 0.15s;
  cursor:grab; pointer-events:auto; user-select:none;
  background:rgba(220,80,80,0.25); border:1px solid rgba(220,80,80,0.4);
}
.device-chip.online {
  background:rgba(60,200,120,0.25); border:1px solid rgba(60,200,120,0.4);
}
.device-chip:active { cursor:grabbing; }
.device-chip:hover { filter:brightness(1.2); box-shadow:0 2px 6px rgba(0,0,0,0.12); }
.device-icon { font-size:20px; line-height:1; }
.device-name { display:none; }

/* Resize handles */
.rh-edge { position:absolute; z-index:20; }
.rh-n { top:-4px; left:14px; right:14px; height:8px; }
.rh-s { bottom:-4px; left:14px; right:14px; height:8px; }
.rh-w { left:-4px; top:14px; bottom:14px; width:8px; }
.rh-e { right:-4px; top:14px; bottom:14px; width:8px; }

.rh-corner { position:absolute; width:14px; height:14px; z-index:21; border-radius:3px; }
.rh-nw { top:-5px; left:-5px; }
.rh-ne { top:-5px; right:-5px; }
.rh-se { bottom:-5px; right:-5px; }
.rh-sw { bottom:-5px; left:-5px; }

.fp-room:hover .rh-corner, .fp-room.active .rh-corner {
  background:rgba(160,185,220,0.75); border:1.5px solid rgba(255,255,255,0.65);
}
.fp-room:hover .rh-edge, .fp-room.active .rh-edge { background:rgba(160,185,220,0.12); }

/* 设备快捷开关浮层 */
.popup-mask {
  position:fixed; inset:0; z-index:1999;
}
.device-popup {
  position:fixed; z-index:2000;
  transform:translate(-50%, -100%);
  background:rgba(20,30,50,0.92);
  backdrop-filter:blur(12px);
  border:1px solid rgba(160,185,220,0.25);
  border-radius:14px; padding:12px 14px;
  min-width:120px; text-align:center;
  box-shadow:0 8px 32px rgba(0,0,0,0.35);
}
.device-popup::after {
  content:''; position:absolute; bottom:-6px; left:50%;
  transform:translateX(-50%);
  border:6px solid transparent;
  border-top-color:rgba(20,30,50,0.92);
  border-bottom:none;
}
.popup-name {
  font-size:13px; font-weight:600; color:#fff;
  margin-bottom:2px; white-space:nowrap;
}
.popup-type {
  font-size:11px; color:rgba(255,255,255,0.45);
  margin-bottom:10px;
}
.popup-toggle {
  display:flex; align-items:center; justify-content:center; gap:6px;
  width:100%; padding:7px 0; border-radius:20px; border:none;
  font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s;
  background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.6);
}
.popup-toggle.on {
  background:rgba(60,200,120,0.25); color:#4ade80;
  border:1px solid rgba(60,200,120,0.4);
}
.popup-toggle:hover { filter:brightness(1.2); }
.popup-icon { width:14px; height:14px; }

/* 浮层动画 */
.popup-enter-active, .popup-leave-active { transition:all 0.15s ease; }
.popup-enter-from, .popup-leave-to { opacity:0; transform:translate(-50%, calc(-100% + 6px)); }
</style>
