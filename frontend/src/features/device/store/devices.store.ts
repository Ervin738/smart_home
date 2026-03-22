/**
 * 设备状态管理 Store
 * 功能：管理所有设备的状态、定时器、倒计时等
 * 包含：设备增删改查、电源控制、亮度/色温控制、定时器管理、倒计时管理
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '../types/device.types'
import { deviceApi } from '@/services/api'

// 导出 Device 类型供其他模块使用
export type { Device }

// 定时执行回调
type TimerCallback = (device: Device, action: 'on' | 'off') => void
let timerExecuteCallback: TimerCallback | null = null

/** 把设备的所有前端特有字段同步到后端 extra 列（防抖 500ms） */
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

function doSyncExtra(device: Device) {
  const { id, name, type, location, status, ...extra } = device as any
  // status 和 extra 一起写，避免两个请求竞态覆盖
  deviceApi.update(id, { status: { power: status === 'online' }, extra })
    .catch(err => console.warn('[Store] Failed to sync extra:', err))
  deviceApi.updateState(id, extra)
    .catch(() => { /* 设备可能没有对应状态表，静默忽略 */ })
}

function syncExtra(device: Device) {
  if (syncTimers.has(device.id)) clearTimeout(syncTimers.get(device.id)!)
  syncTimers.set(device.id, setTimeout(() => {
    doSyncExtra(device)
    syncTimers.delete(device.id)
  }, 0))
}

/** 立即 flush 所有待同步的设备（页面卸载前调用） */
function flushSyncExtra() {
  syncTimers.forEach((timerId, deviceId) => {
    clearTimeout(timerId)
    const device = devices.value.find(d => d.id === deviceId)
    if (device) doSyncExtra(device)
  })
  syncTimers.clear()
}

export const useDevicesStore = defineStore('devices', () => {
  const devices = ref<Device[]>([])

  const reorderDevices = async (newIds: string[]) => {
    devices.value = newIds.map(id => devices.value.find(d => d.id === id)!)
    deviceApi.reorder(newIds).catch(e => console.error('[Store] reorder failed', e))
  }

  const addDevice = (device: Device) => {
    devices.value.push(device)
  }

  const removeDevice = (id: string) => {
    devices.value = devices.value.filter(d => d.id !== id)
  }

  const toggleStatus = (id: string) => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      device.status = device.status === 'online' ? 'offline' : 'online'
      
      if (device.status === 'offline') {
        // 通用：清除定时/倒计时/延时关闭
        device.timerOffEnabled = false
        device.timerOnEnabled = false
        device.countdownEnabled = false
        const d = device as any
        d.delayShutdownEnabled = false
        d.delayShutdownDuration = undefined
        d.delayShutdownEndTime = undefined

        // 按设备类型重置选中状态
        if (device.type === 'light') {
          device.brightness = 100
          device.colorTemp = 4000

        } else if (device.type === 'environment') {
          if (device.environmentType === 'air-conditioner') {
            device.acModeIndex = null
            device.targetTemp = 26
            device.swingEnabled = false
          } else if (device.environmentType === 'heater') {
            device.targetTemp = 22
          } else if (device.environmentType === 'humidifier') {
            device.humidifierLevel = 1
          } else if (device.environmentType === 'fan') {
            device.speedLevel = 1
            device.fanModeIndex = 0
            device.swingEnabled = false
            device.swingAngle = 60
          } else if (device.environmentType === 'air-purifier') {
            device.purifierModeIndex = 0
            device.swingEnabled = false
            device.brightnessLevel = 1
          } else if (device.environmentType === 'dehumidifier') {
            device.targetHumidity = 50
            device.dehumidifierModeIndex = 0
          } else if (device.environmentType === 'aroma-diffuser') {
            d.aromaModeIndex = 0
          }

        } else if (device.type === 'bathroom') {
          d.lightDelayShutdownEnabled = false
          d.lightDelayShutdownDuration = undefined
          d.lightDelayShutdownEndTime = undefined
          if (device.bathroomType === 'toilet') {
            device.toiletWashMode = null
            device.toiletDryMode = false
            device.toiletLidOpen = false
            device.toiletWaterTemp = 3
            device.toiletSeatTemp = 3
            device.toiletAirTemp = 3
            device.toiletWaterStrength = 3
            device.toiletNozzlePosition = 3
          } else if (device.bathroomType === 'water-heater') {
            device.targetTemp = 45
          }

        } else if (device.type === 'kitchen') {
          if (device.kitchenType === 'water-dispenser') {
            device.waterDispenserSelectedWaterType = 'tap-water'
            device.waterDispenserHeating = false
            device.waterDispenserKeepingWarm = false
            device.waterDispenserCurrentTemp = 15
          } else if (device.kitchenType === 'air-fryer') {
            d.airFryerCooking = false
            d.airFryerCookingTime = undefined
            d.airFryerModeId = undefined
            d.airFryerModeName = undefined
          } else if (device.kitchenType === 'rice-cooker') {
            d.riceCookerCooking = false
            d.riceCookerCookingEndTime = undefined
            d.riceCookerModeName = undefined
          } else if (device.kitchenType === 'induction-cooker') {
            d.inductionCookerModeIndex = 0
            d.inductionCookerPower = 1000
            d.inductionCookingMode = -1
            d.inductionIsCooking = false
          } else if (device.kitchenType === 'range-hood') {
            d.rangeHoodSpeedLevel = 1
            d.rangeHoodDelayShutdownEnabled = false
            d.rangeHoodLeftBurnerOn = false
            d.rangeHoodRightBurnerOn = false
            d.rangeHoodLightEnabled = false
            d.rangeHoodCurrentLevel = -1
            d.rangeHoodDeviceTypeIndex = 0
          } else if (device.kitchenType === 'electric-kettle') {
            d.electricKettleHeating = false
            d.electricKettleKeepingWarm = false
          }

        } else if (device.type === 'entertainment') {
          if (device.entertainmentType === 'clock') {
            device.alarmEnabled = false
            device.alarmTimestamp = undefined
          } else if (device.entertainmentType === 'tv') {
            d.tvVolume = 20
            d.tvModeIndex = 0
          } else if (device.entertainmentType === 'speaker') {
            d.speakerVolume = 50
            d.speakerModeIndex = 0
          } else if (device.entertainmentType === 'projector') {
            d.projectorModeIndex = 0
          }

        } else if (device.type === 'personal') {
          if (device.personalType === 'smart-bed') {
            device.backAngle = 0
            device.legAngle = 0
          } else if (device.personalType === 'smart-pillow') {
            device.pillowAutoMode = 0
            device.pillowHeatingMode = 0
            device.pillowGearLevel = 1
          } else if (device.personalType === 'electric-blanket') {
            device.blanketAreaALevel = 0
            device.blanketAreaBLevel = 0
            device.blanketSelectedZone = 0
          } else if (device.personalType === 'window-opener') {
            d.windowOpenerPosition = 0
            d.windowOpenerModeIndex = 0
          }

        } else if (device.type === 'cleaner') {
          if (device.cleanerType === 'washing-machine') {
            d.washingMachineModeIndex = 0
          } else if (device.cleanerType === 'dryer') {
            d.dryerModeIndex = 0
          } else if (device.cleanerType === 'robot-vacuum') {
            d.robotVacuumModeIndex = 0
          } else if (device.cleanerType === 'clothes-rack') {
            d.rackModeIndex = 0
          }
        }

        // 同步 extra 到后端（含 status），直接调用不走防抖
        doSyncExtra(device)
      }

      // online 时直接写 status（不走防抖，避免竞态）
      if (device.status === 'online') {
        deviceApi.update(id, { status: { power: true } })
          .catch(err => console.warn('[Store] Failed to sync status:', err))
      }
    }
  }

  const setBrightness = (id: string, brightness: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'light') {
      device.brightness = Math.max(0, Math.min(100, brightness))
      syncExtra(device)
    }
  }

  const setColorTemp = (id: string, colorTemp: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'light') {
      device.colorTemp = Math.max(2700, Math.min(6500, colorTemp))
      syncExtra(device)
    }
  }

  const setTargetTemp = (id: string, targetTemp: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && (
      (device.type === 'environment' && (device.environmentType === 'heater' || device.environmentType === 'air-conditioner')) ||
      (device.type === 'bathroom' && device.bathroomType === 'water-heater')
    )) {
      device.targetTemp = Math.max(16, Math.min(75, targetTemp))
      syncExtra(device)
    }
  }

  const setHumidifierLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'humidifier') {
      device.humidifierLevel = Math.max(1, Math.min(3, level))
      syncExtra(device)
    }
  }

  const setAcMode = (id: string, modeIndex: number | null) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'air-conditioner') {
      device.acModeIndex = modeIndex
      if (device.status === 'offline') device.acModeIndex = null
      syncExtra(device)
    }
  }

  const setFanMode = (id: string, modeIndex: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'fan') {
      device.fanModeIndex = modeIndex
      syncExtra(device)
    }
  }

  const setSpeedLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'fan') {
      device.speedLevel = Math.max(1, Math.min(4, level))
      syncExtra(device)
    }
  }

  const setDelayShutdown = (id: string, enabled: boolean, durationMinutes?: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && (
      (device.type === 'environment' && device.environmentType === 'heater') ||
      (device.type === 'personal' && device.personalType === 'electric-blanket') ||
      (device.type === 'kitchen' && device.kitchenType === 'range-hood') ||
      (device.type === 'entertainment') ||
      (device.type === 'bathroom') ||
      (device.type === 'security')
    )) {
      device.delayShutdownEnabled = enabled
      if (enabled && durationMinutes) {
        device.delayShutdownDuration = durationMinutes
        device.delayShutdownEndTime = Date.now() + durationMinutes * 60 * 1000
      } else {
        device.delayShutdownDuration = undefined
        device.delayShutdownEndTime = undefined
      }
      syncExtra(device)
    }
  }

  // 计算下次执行时间戳
  const calculateNextTimestamp = (time: string): number => {
    const parts = time.split(':').map(Number)
    const hours = parts[0] ?? 0
    const minutes = parts[1] ?? 0
    const now = new Date()
    const targetTime = new Date()
    targetTime.setHours(hours, minutes, 0, 0)
    
    if (targetTime.getTime() <= now.getTime()) {
      targetTime.setDate(targetTime.getDate() + 1)
    }
    return targetTime.getTime()
  }

  const setTimer = (id: string, type: 'on' | 'off', enabled: boolean, time?: string, repeat?: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      if (type === 'off') {
        device.timerOffEnabled = enabled
        device.timerOffTime = enabled ? time : undefined
        device.timerOffRepeat = enabled ? repeat : undefined
        device.timerOffTimestamp = enabled && time ? calculateNextTimestamp(time) : undefined
      } else {
        device.timerOnEnabled = enabled
        device.timerOnTime = enabled ? time : undefined
        device.timerOnRepeat = enabled ? repeat : undefined
        device.timerOnTimestamp = enabled && time ? calculateNextTimestamp(time) : undefined
      }
      syncExtra(device)
    }
  }

  const cancelTimer = (id: string, type: 'on' | 'off') => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      if (type === 'off') {
        device.timerOffEnabled = false
        device.timerOffTime = undefined
        device.timerOffTimestamp = undefined
        device.timerOffRepeat = undefined
      } else {
        device.timerOnEnabled = false
        device.timerOnTime = undefined
        device.timerOnTimestamp = undefined
        device.timerOnRepeat = undefined
      }
      syncExtra(device)
    }
  }

  // 获取定时剩余时间（秒）
  const getTimerRemaining = (id: string, type: 'on' | 'off'): number => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      const timestamp = type === 'off' ? device.timerOffTimestamp : device.timerOnTimestamp
      const enabled = type === 'off' ? device.timerOffEnabled : device.timerOnEnabled
      if (enabled && timestamp) {
        return Math.max(0, Math.floor((timestamp - Date.now()) / 1000))
      }
    }
    return 0
  }

  // 执行定时任务
  const executeTimer = (id: string, type: 'on' | 'off') => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      const previousStatus = device.status
      device.status = type === 'on' ? 'online' : 'offline'
      
      // 触发回调通知
      if (timerExecuteCallback && previousStatus !== device.status) {
        timerExecuteCallback(device, type)
      }
      
      // 检查是否需要重复
      const repeat = type === 'off' ? device.timerOffRepeat : device.timerOnRepeat
      const time = type === 'off' ? device.timerOffTime : device.timerOnTime
      
      if (repeat && time) {
        // 设置明天同一时间
        if (type === 'off') {
          device.timerOffTimestamp = calculateNextTimestamp(time)
        } else {
          device.timerOnTimestamp = calculateNextTimestamp(time)
        }
      } else {
        // 不重复则取消定时
        cancelTimer(id, type)
      }
    }
  }

  // 设置定时执行回调
  const onTimerExecute = (callback: TimerCallback) => {
    timerExecuteCallback = callback
  }

  // 定时器检查（每秒检查一次）
  let timerInterval: number | null = null
  
  const startTimerCheck = () => {
    if (timerInterval) return
    timerInterval = window.setInterval(() => {
      const now = Date.now()
      devices.value.forEach(device => {
        // 检查定时关闭
        if (device.timerOffEnabled && device.timerOffTimestamp && device.timerOffTimestamp <= now) {
          executeTimer(device.id, 'off')
        }
        // 检查定时开启
        if (device.timerOnEnabled && device.timerOnTimestamp && device.timerOnTimestamp <= now) {
          executeTimer(device.id, 'on')
        }
        // 检查倒计时
        if (device.countdownEnabled && device.countdownEndTime && device.countdownEndTime <= now) {
          executeCountdown(device.id)
        }
        // 检查延时关闭
        if ((device as any).delayShutdownEnabled && (device as any).delayShutdownEndTime && (device as any).delayShutdownEndTime <= now) {
          (device as any).delayShutdownEnabled = false
          ;(device as any).delayShutdownDuration = undefined
          ;(device as any).delayShutdownEndTime = undefined
          toggleStatus(device.id)
        }
        // 检查照明延时关闭 (浴霸)
        if ((device as any).lightDelayShutdownEnabled && (device as any).lightDelayShutdownEndTime && (device as any).lightDelayShutdownEndTime <= now) {
          (device as any).lightDelayShutdownEnabled = false
          ;(device as any).lightDelayShutdownDuration = undefined
          ;(device as any).lightDelayShutdownEndTime = undefined
        }
      })
    }, 1000)
  }

  // 设置倒计时（基于秒数）
  const setCountdown = (id: string, action: 'on' | 'off', seconds: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      device.countdownEnabled = true
      device.countdownAction = action
      device.countdownEndTime = Date.now() + seconds * 1000
    }
  }

  // 取消倒计时
  const cancelCountdown = (id: string) => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      device.countdownEnabled = false
      device.countdownAction = undefined
      device.countdownEndTime = undefined
    }
  }

  // 获取倒计时剩余秒数
  const getCountdownRemaining = (id: string): number => {
    const device = devices.value.find(d => d.id === id)
    if (device?.countdownEnabled && device.countdownEndTime) {
      return Math.max(0, Math.floor((device.countdownEndTime - Date.now()) / 1000))
    }
    return 0
  }

  // 执行倒计时
  const executeCountdown = (id: string) => {
    const device = devices.value.find(d => d.id === id)
    if (device?.countdownEnabled && device.countdownAction) {
      const previousStatus = device.status
      device.status = device.countdownAction === 'on' ? 'online' : 'offline'
      
      // 触发回调通知
      if (timerExecuteCallback && previousStatus !== device.status) {
        timerExecuteCallback(device, device.countdownAction)
      }
      
      // 倒计时执行后清除
      cancelCountdown(id)
    }
  }

  const stopTimerCheck = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // 自动启动定时器检查
  startTimerCheck()

  // 智能床相关方法
  const setSmartBedBackAngle = (id: string, angle: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-bed') {
      device.backAngle = Math.max(0, Math.min(60, angle)); syncExtra(device)
    }
  }

  const setSmartBedLegAngle = (id: string, angle: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-bed') {
      device.legAngle = Math.max(0, Math.min(45, angle)); syncExtra(device)
    }
  }

  // 浴霸延时关闭
  const setYubaDelayShutdown = (id: string, enabled: boolean, durationMinutes?: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'bathroom' && device.bathroomType === 'yuba') {
      device.delayShutdownEnabled = enabled
      if (enabled && durationMinutes) {
        device.delayShutdownDuration = durationMinutes
        device.delayShutdownEndTime = Date.now() + durationMinutes * 60 * 1000
      } else {
        device.delayShutdownDuration = undefined
        device.delayShutdownEndTime = undefined
      }
      syncExtra(device)
    }
  }

  const setLightDelayShutdown = (id: string, enabled: boolean, durationMinutes?: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'bathroom' && device.bathroomType === 'yuba') {
      device.lightDelayShutdownEnabled = enabled
      if (enabled && durationMinutes) {
        device.lightDelayShutdownDuration = durationMinutes
        device.lightDelayShutdownEndTime = Date.now() + durationMinutes * 60 * 1000
      } else {
        device.lightDelayShutdownDuration = undefined
        device.lightDelayShutdownEndTime = undefined
      }
      syncExtra(device)
    }
  }

  // 电热毯相关方法
  const setElectricBlanketAreaALevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'electric-blanket') {
      device.blanketAreaALevel = Math.max(0, Math.min(6, level)); syncExtra(device)
    }
  }

  const setElectricBlanketAreaBLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'electric-blanket') {
      device.blanketAreaBLevel = Math.max(0, Math.min(6, level)); syncExtra(device)
    }
  }

  const setElectricBlanketSelectedZone = (id: string, zone: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'electric-blanket') {
      device.blanketSelectedZone = zone; syncExtra(device)
    }
  }

  // 智能枕头相关方法
  const setSmartPillowAutoMode = (id: string, mode: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-pillow') {
      device.pillowAutoMode = mode; syncExtra(device)
    }
  }

  const setSmartPillowHeatingMode = (id: string, mode: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-pillow') {
      device.pillowHeatingMode = mode; syncExtra(device)
    }
  }

  const setSmartPillowTimeAdjust = (id: string, time: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-pillow') {
      device.pillowTimeAdjust = Math.max(5, Math.min(30, time)); syncExtra(device)
    }
  }

  const setSmartPillowGearLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'personal' && device.personalType === 'smart-pillow') {
      device.pillowGearLevel = Math.max(1, Math.min(5, level)); syncExtra(device)
    }
  }

  // 饮水机相关方法
  const setWaterDispenserTemp = (id: string, temp: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'water-dispenser') {
      device.waterDispenserCurrentTemp = temp; syncExtra(device)
    }
  }

  const setWaterDispenserKeepWarm = (id: string, enabled: boolean, temp?: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'water-dispenser') {
      device.waterDispenserKeepWarmEnabled = enabled
      if (temp !== undefined) device.waterDispenserKeepWarmTemp = temp
      syncExtra(device)
    }
  }

  const setWaterDispenserWaterType = (id: string, waterType: string) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'water-dispenser') {
      device.waterDispenserSelectedWaterType = waterType; syncExtra(device)
    }
  }

  const setWaterDispenserHeating = (id: string, heating: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'water-dispenser') {
      device.waterDispenserHeating = heating; syncExtra(device)
    }
  }

  const setWaterDispenserFanCooling = (id: string, enabled: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'water-dispenser') {
      device.waterDispenserFanCoolingEnabled = enabled; syncExtra(device)
    }
  }

  // 空气炸锅相关方法
  const setAirFryerCooking = (id: string, cooking: boolean, time?: number, modeId?: number, modeName?: string) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'kitchen' && device.kitchenType === 'air-fryer') {
      device.airFryerCooking = cooking
      if (time !== undefined) device.airFryerCookingTime = time
      if (modeId !== undefined) device.airFryerModeId = modeId
      if (modeName !== undefined) device.airFryerModeName = modeName
      syncExtra(device)
    }
  }

  // 空气净化器相关方法
  const setPurifierMode = (id: string, modeIndex: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'air-purifier') {
      device.purifierModeIndex = modeIndex; syncExtra(device)
    }
  }

  const setPurifierSwing = (id: string, enabled: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'air-purifier') {
      device.swingEnabled = enabled; syncExtra(device)
    }
  }

  const setBrightnessLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'air-purifier') {
      device.brightnessLevel = level; syncExtra(device)
    }
  }

  const setSwingEnabled = (id: string, enabled: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment') {
      if (device.environmentType === 'fan' || device.environmentType === 'air-purifier') {
        device.swingEnabled = enabled; syncExtra(device)
      }
    }
  }

  const setSwingAngle = (id: string, angle: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && (device.environmentType === 'fan' || device.environmentType === 'air-purifier')) {
      device.swingAngle = angle; syncExtra(device)
    }
  }

  const setDehumidifierMode = (id: string, modeIndex: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'dehumidifier') {
      device.dehumidifierModeIndex = modeIndex; syncExtra(device)
    }
  }

  const setTargetHumidity = (id: string, humidity: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'dehumidifier') {
      device.targetHumidity = Math.max(30, Math.min(80, humidity)); syncExtra(device)
    }
  }

  // 灯光情景模式
  const setLightMode = (id: string, modeIndex: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device) { (device as any).lightModeIndex = modeIndex; syncExtra(device) }
  }

  /**
   * 通用方法：直接合并任意 extra 字段到设备并同步后端
   * 用于各组件持久化本地选中状态
   */
  const setDeviceExtra = (id: string, fields: Record<string, unknown>) => {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      Object.assign(device, fields)
      syncExtra(device)
    }
  }

  // 空调扩展状态
  const setAcFanSpeed = (id: string, speed: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device) { (device as any).acFanSpeed = speed; syncExtra(device) }
  }

  const setAcAutoMode = (id: string, enabled: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device) { (device as any).acAutoMode = enabled; syncExtra(device) }
  }

  const setAcFunctions = (id: string, funcs: string[]) => {
    const device = devices.value.find(d => d.id === id)
    if (device) { (device as any).acFunctions = funcs; syncExtra(device) }
  }

  const setAcWindMode = (id: string, mode: string | null) => {
    const device = devices.value.find(d => d.id === id)
    if (device) { (device as any).acWindMode = mode; syncExtra(device) }
  }

  return {
    devices,
    addDevice,
    removeDevice,
    reorderDevices,
    toggleStatus,
    setBrightness,
    setColorTemp,
    setTargetTemp,
    setHumidifierLevel,
    setAcMode,
    setFanMode,
    setSpeedLevel,
    setDelayShutdown,
    setTimer,
    cancelTimer,
    getTimerRemaining,
    executeTimer,
    onTimerExecute,
    startTimerCheck,
    stopTimerCheck,
    setCountdown,
    cancelCountdown,
    getCountdownRemaining,
    // 浴霸
    setYubaDelayShutdown,
    setLightDelayShutdown,
    // 电热毯
    setElectricBlanketAreaALevel,
    setElectricBlanketAreaBLevel,
    setElectricBlanketSelectedZone,
    // 智能床
    setSmartBedBackAngle,
    setSmartBedLegAngle,
    // 智能枕头
    setSmartPillowAutoMode,
    setSmartPillowHeatingMode,
    setSmartPillowTimeAdjust,
    setSmartPillowGearLevel,
    // 饮水机
    setWaterDispenserTemp,
    setWaterDispenserKeepWarm,
    setWaterDispenserWaterType,
    setWaterDispenserHeating,
    setWaterDispenserFanCooling,
    // 空气炸锅
    setAirFryerCooking,
    // 空气净化器
    setPurifierMode,
    setPurifierSwing,
    setBrightnessLevel,
    // 通用摆风
    setSwingEnabled,
    setSwingAngle,
    // 除湿机
    setDehumidifierMode,
    setTargetHumidity,
    // 空调扩展
    setAcFanSpeed,
    setAcAutoMode,
    setAcFunctions,
    setAcWindMode,
    // 灯光情景模式
    setLightMode,
    // 通用 extra 持久化
    setDeviceExtra,
    flushSyncExtra,
  }
})
