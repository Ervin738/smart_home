/**
 * UI配置常量
 * 功能：定义UI相关的配置参数
 */

// 交互时间配置
export const INTERACTION_TIMING = {
  /** 长按触发时间（毫秒） */
  LONG_PRESS_DURATION: 500,
  
  /** 通知显示时间（毫秒） */
  NOTIFICATION_DURATION: 3000,
  
  /** 重启延迟时间（毫秒） */
  RESTART_DELAY: 2000,
  
  /** 返回基站延迟时间（毫秒） */
  CHARGE_DELAY: 2000,
  
  /** 晾衣架动作延迟时间（毫秒） */
  RACK_ACTION_DELAY: 1500
} as const

// 滑动控制配置
export const SLIDER_CONFIG = {
  /** 滑动触发阈值（像素） */
  DRAG_THRESHOLD: 40,
  
  /** 滚轮触发阈值（像素） */
  WHEEL_THRESHOLD: 10
} as const

// 动画配置
export const ANIMATION_CONFIG = {
  /** 标准过渡时间（毫秒） */
  TRANSITION_DURATION: 300,
  
  /** 快速过渡时间（毫秒） */
  FAST_TRANSITION: 200,
  
  /** 慢速过渡时间（毫秒） */
  SLOW_TRANSITION: 500
} as const

// 设备状态
export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
} as const

// 定时器类型
export const TIMER_TYPE = {
  ON: 'on',
  OFF: 'off'
} as const
