/**
 * 设备相关的辅助函数
 * 功能：提供设备类型判断、控制按钮生成等工具函数
 */
import type { Device } from '../stores/devices'

/**
 * 设备类型判断
 */
export const isWashingMachine = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'cleaner' && 
    (device.cleanerType === 'washing-machine' || device.cleanerType === 'dryer')
}

export const isRobotVacuum = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'cleaner' && device.cleanerType === 'robot-vacuum'
}

export const isClothesRack = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'cleaner' && device.cleanerType === 'clothes-rack'
}

export const isLight = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'light'
}

export const isSocket = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'switch' && device.switchType === 'socket'
}

export const isRouter = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'network'
}

export const isHumidifier = (device: Device | null): boolean => {
  if (!device) return false
  return device.type === 'environment' && device.environmentType === 'humidifier'
}

/**
 * 清洁电器类型标签
 */
export const cleanerTypeLabels: Record<string, string> = {
  'washing-machine': '洗衣机',
  'dryer': '烘干机',
  'robot-vacuum': '扫地机器人',
  'clothes-rack': '晾衣架'
}

/**
 * 获取清洁电器类型标签
 */
export const getCleanerTypeLabel = (cleanerType: string): string => {
  return cleanerTypeLabels[cleanerType] || cleanerType
}
