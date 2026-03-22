/**
 * useBackendSync
 * 启动时从后端拉取房间 + 设备，合并到 Pinia store
 * 监听 Socket.IO device:statusChanged 实时更新
 */
import { onMounted, onUnmounted } from 'vue'
import { useDevicesStore } from '@/features/device/store/devices.store'
import { useTabsStore } from '@/features/layout/tabs'
import { deviceApi } from '@/services/api'
import { getSocket } from '@/services/socket'
import type { Device } from '@/features/device/types/device.types'

function resolveStatus(s: Record<string, unknown>): 'online' | 'offline' {
  if (typeof s?.power === 'boolean') return s.power ? 'online' : 'offline'
  return 'offline'
}

/** Convert a backend DB row into a frontend Device object */
function backendToDevice(row: Record<string, unknown>): Device {
  const status = typeof row.status === 'string' ? JSON.parse(row.status as string) : (row.status ?? {})
  const extra   = typeof row.extra  === 'string' ? JSON.parse(row.extra  as string) : (row.extra  ?? {})
  return {
    id:       String(row.id),
    name:     row.name as string,
    type:     row.type as Device['type'],
    location: row.location as string ?? '',
    status:   resolveStatus(status as Record<string, unknown>),
    ...extra,
  } as Device
}

export function useBackendSync() {
  const devicesStore = useDevicesStore()
  const tabsStore    = useTabsStore()
  const socket       = getSocket()

  const syncAll = async () => {
    // 1. Load rooms
    await tabsStore.loadFromBackend()

    // 2. Load devices and replace store
    try {
      const rows = await deviceApi.getAll()
      devicesStore.devices.splice(0, devicesStore.devices.length,
        ...rows.map((r: Record<string, unknown>) => backendToDevice(r))
      )
      console.log(`[Sync] Loaded ${rows.length} device(s).`)

      // 3. Load device states and merge into store
      await Promise.allSettled(
        devicesStore.devices.map(async (device) => {
          try {
            const { state } = await deviceApi.getState(device.id)
            if (state) {
              // Remove device_id from state before merging
              const { device_id, ...stateFields } = state
              Object.assign(device, stateFields)
            }
          } catch {
            // state table may not exist yet for this device, ignore
          }
        })
      )
    } catch (err) {
      console.warn('[Sync] Failed to fetch devices:', err)
    }
  }

  const onStatusChanged = (payload: { deviceId: number; status: Record<string, unknown> }) => {
    const device = devicesStore.devices.find(d => d.id === String(payload.deviceId))
    if (!device) return
    device.status = resolveStatus(payload.status)
    Object.assign(device, payload.status)
  }

  onMounted(() => {
    syncAll()
    socket.on('device:statusChanged', onStatusChanged)
    window.addEventListener('beforeunload', devicesStore.flushSyncExtra)
  })

  onUnmounted(() => {
    socket.off('device:statusChanged', onStatusChanged)
    window.removeEventListener('beforeunload', devicesStore.flushSyncExtra)
  })

  return { syncAll }
}
