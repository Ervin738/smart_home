/**
 * 房间标签页状态管理 Store
 * 持久化：通过后端 /api/rooms 接口存储
 * 实时同步：监听 socket room:changed 事件，两端增删改自动同步
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { roomApi } from '@/services/api'
import { getSocket } from '@/services/socket'

export interface RoomRecord {
  id: number
  name: string
  fp_x: number | null
  fp_y: number | null
  fp_w: number | null
  fp_h: number | null
  fp_locked: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  const rooms       = ref<RoomRecord[]>([])
  const activeIndex = ref(Number(localStorage.getItem('activeTabIndex') || 0))

  // 兼容旧代码：tabs = 房间名列表
  const tabs = ref<string[]>([])
  const roomIds = ref<Record<string, number>>({})

  function syncDerived() {
    tabs.value    = rooms.value.map(r => r.name)
    roomIds.value = Object.fromEntries(rooms.value.map(r => [r.name, r.id]))
  }

  /** 从后端加载 */
  const loadFromBackend = async () => {
    try {
      const data: any[] = await roomApi.getAll()
      rooms.value = data.map(r => ({
        id:        Number(r.id),
        name:      String(r.name),
        fp_x:      r.fp_x != null ? Number(r.fp_x) : null,
        fp_y:      r.fp_y != null ? Number(r.fp_y) : null,
        fp_w:      r.fp_w != null ? Number(r.fp_w) : null,
        fp_h:      r.fp_h != null ? Number(r.fp_h) : null,
        fp_locked: Boolean(r.fp_locked),
      }))
      syncDerived()
      // 防止刷新后 index 越界（如房间被删除）
      if (activeIndex.value >= rooms.value.length) {
        activeIndex.value = 0
        localStorage.setItem('activeTabIndex', '0')
      }
    } catch (err) {
      console.warn('[Tabs] Failed to load rooms:', err)
    }
  }

  /** 添加房间（同时写后端） */
  const addTab = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || tabs.value.includes(trimmed)) return false
    try {
      const room: RoomRecord = await roomApi.create(trimmed)
      if (!rooms.value.find(r => r.id === room.id)) {
        rooms.value.push({ ...room, fp_locked: false })
        syncDerived()
      }
      return true
    } catch (err) {
      console.error('[Tabs] Failed to create room:', err)
      return false
    }
  }

  /** 删除房间 */
  const removeTab = async (index: number) => {
    const room = rooms.value[index]
    if (!room) return
    try { await roomApi.delete(room.id) } catch {}
    rooms.value.splice(index, 1)
    syncDerived()
    if (activeIndex.value >= rooms.value.length) {
      activeIndex.value = Math.max(0, rooms.value.length - 1)
    } else if (activeIndex.value > index) {
      activeIndex.value--
    }
  }

  /** 更新平面图位置/尺寸/名称，立即改响应式对象，防抖写后端 */
  const fpTimers = new Map<number, ReturnType<typeof setTimeout>>()
  const updateFloorPlan = (id: number, fields: { fp_x?: number | null; fp_y?: number | null; fp_w?: number | null; fp_h?: number | null; name?: string }) => {
    const room = rooms.value.find(r => r.id === id)
    if (!room) return
    Object.assign(room, fields)
    syncDerived()
    // 防抖 400ms，读当前 room 最新值写后端（避免旧 fields 覆盖）
    if (fpTimers.has(id)) clearTimeout(fpTimers.get(id)!)
    fpTimers.set(id, setTimeout(() => {
      roomApi.update(id, {
        fp_x: room.fp_x,
        fp_y: room.fp_y,
        fp_w: room.fp_w,
        fp_h: room.fp_h,
        ...(fields.name !== undefined ? { name: room.name } : {}),
      }).catch(() => {})
      fpTimers.delete(id)
    }, 400))
  }

  /** 拖动/resize/放置结束后立即写后端，同时取消防抖计时器 */
  const persistFloorPlan = (id: number, coords?: { fp_x: number|null, fp_y: number|null, fp_w: number|null, fp_h: number|null }) => {
    if (fpTimers.has(id)) { clearTimeout(fpTimers.get(id)!); fpTimers.delete(id) }
    const room = rooms.value.find(r => r.id === id)
    if (!room) return
    const data = coords ?? { fp_x: room.fp_x, fp_y: room.fp_y, fp_w: room.fp_w, fp_h: room.fp_h }
    console.log('[persistFloorPlan]', id, data)
    roomApi.update(id, data).catch((e) => console.error('[persistFloorPlan] failed', e))
  }

  /** 保存并锁定所有已放置房间的平面图布局 */
  const lockAllFloorPlan = async () => {
    const placed = rooms.value.filter(r => r.fp_x !== null)
    await Promise.all(placed.map(r => {
      r.fp_locked = true
      return roomApi.update(r.id, {
        fp_x: r.fp_x!, fp_y: r.fp_y!, fp_w: r.fp_w!, fp_h: r.fp_h!, fp_locked: 1
      }).catch(() => {})
    }))
  }

  /** 解锁所有房间，允许重新编辑 */
  const unlockAllFloorPlan = async () => {
    const placed = rooms.value.filter(r => r.fp_x !== null)
    await Promise.all(placed.map(r => {
      r.fp_locked = false
      return roomApi.update(r.id, { fp_locked: 0 }).catch(() => {})
    }))
  }

  /** 是否所有已放置房间都已锁定 */
  const isFloorPlanLocked = () =>
    rooms.value.filter(r => r.fp_x !== null).every(r => r.fp_locked)

  /** 拖拽排序 */
  const reorderRooms = async (newOrder: number[]) => {
    // newOrder 是 room id 数组，按新顺序排列
    rooms.value = newOrder.map(id => rooms.value.find(r => r.id === id)!)
    syncDerived()
    try { await roomApi.reorder(newOrder) } catch (e) { console.error(e) }
  }

  /** 重命名房间 */
  const renameTab = async (index: number, newName: string) => {
    const room = rooms.value[index]
    if (!room) return
    const trimmed = newName.trim()
    if (!trimmed || trimmed === room.name) return
    room.name = trimmed
    syncDerived()
    try { await roomApi.update(room.id, { name: trimmed }) } catch (e) { console.error(e) }
  }

  const setActiveIndex = (index: number) => {
    activeIndex.value = index
    localStorage.setItem('activeTabIndex', String(index))
  }

  /** 监听 socket room:changed，实时同步其他端的操作 */
  function listenSocket() {
    const socket = getSocket()
    socket.on('room:changed', (payload: { action: string; room?: RoomRecord; id?: number }) => {
      if (payload.action === 'create' && payload.room) {
        if (!rooms.value.find(r => r.id === payload.room!.id)) {
          rooms.value.push(payload.room)
          syncDerived()
        }
      } else if (payload.action === 'update' && payload.room) {
        const r = rooms.value.find(r => r.id === payload.room!.id)
        if (r) {
          const p = payload.room!
          if (p.fp_x != null)       r.fp_x      = Number(p.fp_x)
          if (p.fp_y != null)       r.fp_y      = Number(p.fp_y)
          if (p.fp_w != null)       r.fp_w      = Number(p.fp_w)
          if (p.fp_h != null)       r.fp_h      = Number(p.fp_h)
          if (p.fp_locked != null)  r.fp_locked = Boolean(p.fp_locked)
          if (p.name)               r.name      = p.name
          syncDerived()
        }
      } else if (payload.action === 'delete' && payload.id) {
        const idx = rooms.value.findIndex(r => r.id === payload.id)
        if (idx !== -1) {
          rooms.value.splice(idx, 1)
          syncDerived()
          if (activeIndex.value >= rooms.value.length) {
            activeIndex.value = Math.max(0, rooms.value.length - 1)
          }
        }
      }
    })
  }

  listenSocket()

  return {
    rooms, tabs, activeIndex, roomIds,
    loadFromBackend, addTab, removeTab, renameTab, reorderRooms,
    updateFloorPlan, persistFloorPlan,
    lockAllFloorPlan, unlockAllFloorPlan, isFloorPlanLocked,
    setActiveIndex,
  }
})
