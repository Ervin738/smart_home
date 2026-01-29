/**
 * 设备状态管理 Store
 * 功能：管理所有设备的状态、定时器、倒计时等
 * 包含：设备增删改查、电源控制、亮度/色温控制、定时器管理、倒计时管理
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Device {
  id: string
  name: string
  type: string
  lightType?: string
  switchType?: string
  cleanerType?: string
  securityType?: string
  environmentType?: string
  personalType?: string
  bathroomType?: string
  kitchenType?: string
  networkType?: string
  entertainmentType?: string
  otherType?: string
  location: string
  status: 'online' | 'offline'
  brightness?: number // 灯光亮度 0-100
  colorTemp?: number // 色温 2700-6500K
  targetTemp?: number // 目标温度 16-32°C (电暖器)
  acModeIndex?: number | null // 空调模式索引 0-2 (制冷、制热、除湿)
  humidifierLevel?: number // 加湿器档位 1-3 (1档、2档、恒湿)
  // 扫地机器人
  robotModeIndex?: number // 清洁模式索引 0-3 (扫地、拖地、边扫边拖、先扫后拖)
  robotIsCleaning?: boolean // 是否正在清扫
  // 延时关闭 (电暖器)
  delayShutdownEnabled?: boolean
  delayShutdownDuration?: number // 延时关闭时长（分钟）
  delayShutdownEndTime?: number // 延时关闭结束时间戳
  // 定时关闭
  timerOffEnabled?: boolean
  timerOffTime?: string // HH:mm 格式
  timerOffTimestamp?: number
  timerOffRepeat?: boolean // 是否每日重复
  // 定时开启
  timerOnEnabled?: boolean
  timerOnTime?: string // HH:mm 格式
  timerOnTimestamp?: number
  timerOnRepeat?: boolean // 是否每日重复
  // 倒计时
  countdownEnabled?: boolean
  countdownAction?: 'on' | 'off'
  countdownEndTime?: number // 倒计时结束时间戳
}

// 定时执行回调
type TimerCallback = (device: Device, action: 'on' | 'off') => void
let timerExecuteCallback: TimerCallback | null = null

export const useDevicesStore = defineStore('devices', () => {
  const devices = ref<Device[]>([])

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
      
      // 如果设备关闭，自动禁用延时关闭
      if (device.status === 'offline' && device.delayShutdownEnabled) {
        device.delayShutdownEnabled = false
        device.delayShutdownDuration = undefined
        device.delayShutdownEndTime = undefined
      }
      
      // 如果空调关闭，重置模式
      if (device.status === 'offline' && device.type === 'environment' && device.environmentType === 'air-conditioner') {
        device.acModeIndex = null
      }
    }
  }

  const setBrightness = (id: string, brightness: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'light') {
      device.brightness = Math.max(0, Math.min(100, brightness))
    }
  }

  const setColorTemp = (id: string, colorTemp: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'light') {
      device.colorTemp = Math.max(2700, Math.min(6500, colorTemp))
    }
  }

  const setTargetTemp = (id: string, targetTemp: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && (device.environmentType === 'heater' || device.environmentType === 'air-conditioner')) {
      device.targetTemp = Math.max(16, Math.min(32, targetTemp))
    }
  }

  const setHumidifierLevel = (id: string, level: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'humidifier') {
      device.humidifierLevel = Math.max(1, Math.min(3, level))
    }
  }

  const setAcMode = (id: string, modeIndex: number | null) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'air-conditioner') {
      device.acModeIndex = modeIndex
      // 如果设备关闭，重置模式
      if (device.status === 'offline') {
        device.acModeIndex = null
      }
    }
  }

  const setDelayShutdown = (id: string, enabled: boolean, durationMinutes?: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'environment' && device.environmentType === 'heater') {
      device.delayShutdownEnabled = enabled
      if (enabled && durationMinutes) {
        device.delayShutdownDuration = durationMinutes
        device.delayShutdownEndTime = Date.now() + durationMinutes * 60 * 1000
      } else {
        device.delayShutdownDuration = undefined
        device.delayShutdownEndTime = undefined
      }
    }
  }

  const setRobotMode = (id: string, modeIndex: number) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') {
      device.robotModeIndex = Math.max(-1, Math.min(3, modeIndex))
    }
  }

  const setRobotCleaning = (id: string, isCleaning: boolean) => {
    const device = devices.value.find(d => d.id === id)
    if (device && device.type === 'cleaner' && device.cleanerType === 'robot-vacuum') {
      device.robotIsCleaning = isCleaning
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
        if (device.delayShutdownEnabled && device.delayShutdownEndTime && device.delayShutdownEndTime <= now) {
          executeDelayShutdown(device.id)
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

  return {
    devices,
    addDevice,
    removeDevice,
    toggleStatus,
    setBrightness,
    setColorTemp,
    setTargetTemp,
    setHumidifierLevel,
    setAcMode,
    setDelayShutdown,
    setRobotMode,
    setRobotCleaning,
    setTimer,
    cancelTimer,
    getTimerRemaining,
    executeTimer,
    onTimerExecute,
    startTimerCheck,
    stopTimerCheck,
    setCountdown,
    cancelCountdown,
    getCountdownRemaining
  }
})
