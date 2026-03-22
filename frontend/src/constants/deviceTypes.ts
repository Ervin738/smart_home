/**
 * 设备类型标签常量
 * 功能：定义所有设备类型的中文显示名称
 */

// 主设备类型标签
export const TYPE_LABELS: Record<string, string> = {
  light: '灯光',
  switch: '开关',
  cleaner: '清洁电器',
  security: '安防',
  environment: '环境电器',
  personal: '个护与起居',
  bathroom: '卫浴',
  kitchen: '厨房电器',
  network: '路由网关',
  entertainment: '影音娱乐',
  other: '其他'
}

// 灯光类型标签
export const LIGHT_TYPE_LABELS: Record<string, string> = {
  'table-lamp': '台灯',
  'ceiling-lamp': '吸顶灯'
}

// 开关类型标签
export const SWITCH_TYPE_LABELS: Record<string, string> = {
  'socket': '插座/插排',
  'switch': '开关'
}

// 清洁电器类型标签
export const CLEANER_TYPE_LABELS: Record<string, string> = {
  'washing-machine': '洗衣机',
  'dryer': '烘干机',
  'robot-vacuum': '扫地机器人',
  'clothes-rack': '晾衣架'
}

// 环境电器类型标签
export const ENVIRONMENT_TYPE_LABELS: Record<string, string> = {
  'humidifier': '加湿器',
  'heater': '电暖器',
  'air-conditioner': '空调',
  'fan': '风扇',
  'dehumidifier': '除湿机',
  'air-purifier': '空气净化器',
  'aroma-diffuser': '香薰机'
}

// 路由网关类型标签
export const NETWORK_TYPE_LABELS: Record<string, string> = {
  'router': '路由器',
  'gateway': '网关',
  'wifi-extender': 'WiFi信号放大器'
}

// 安防类型标签
export const SECURITY_TYPE_LABELS: Record<string, string> = {
  'camera': '摄像机',
  'door-lock': '门锁',
  'smart-door': '智能门'
}

// 个护与起居类型标签
export const PERSONAL_TYPE_LABELS: Record<string, string> = {
  'smart-bed': '智能床',
  'smart-pillow': '智能枕头',
  'electric-blanket': '电热毯',
  'window-opener': '开窗器'
}

// 卫浴类型标签
export const BATHROOM_TYPE_LABELS: Record<string, string> = {
  'toilet': '智能马桶',
  'water-heater': '热水器',
  'yuba': '浴霸'
}

// 厨房电器类型标签
export const KITCHEN_TYPE_LABELS: Record<string, string> = {
  'rice-cooker': '电饭煲',
  'induction-cooker': '电磁炉',
  'range-hood': '净烟机',
  'electric-kettle': '电水壶',
  'air-fryer': '空气炸锅',
  'water-dispenser': '饮水机'
}

// 影音娱乐类型标签
export const ENTERTAINMENT_TYPE_LABELS: Record<string, string> = {
  'tv': '电视',
  'speaker': '音箱',
  'projector': '投影仪',
  'clock': '时钟'
}

/**
 * 获取设备显示类型
 * @param device 设备对象
 * @returns 设备类型的中文显示名称
 */
export function getDeviceDisplayType(device: any): string {
  if (!device) return ''
  
  if (device.lightType && LIGHT_TYPE_LABELS[device.lightType]) {
    return LIGHT_TYPE_LABELS[device.lightType] || ''
  }
  if (device.switchType && SWITCH_TYPE_LABELS[device.switchType]) {
    return SWITCH_TYPE_LABELS[device.switchType] || ''
  }
  if (device.networkType && NETWORK_TYPE_LABELS[device.networkType]) {
    return NETWORK_TYPE_LABELS[device.networkType] || ''
  }
  if (device.cleanerType && CLEANER_TYPE_LABELS[device.cleanerType]) {
    return CLEANER_TYPE_LABELS[device.cleanerType] || ''
  }
  if (device.environmentType && ENVIRONMENT_TYPE_LABELS[device.environmentType]) {
    return ENVIRONMENT_TYPE_LABELS[device.environmentType] || ''
  }
  if (device.securityType && SECURITY_TYPE_LABELS[device.securityType]) {
    return SECURITY_TYPE_LABELS[device.securityType] || ''
  }
  if (device.personalType && PERSONAL_TYPE_LABELS[device.personalType]) {
    return PERSONAL_TYPE_LABELS[device.personalType] || ''
  }
  if (device.bathroomType && BATHROOM_TYPE_LABELS[device.bathroomType]) {
    return BATHROOM_TYPE_LABELS[device.bathroomType] || ''
  }
  if (device.kitchenType && KITCHEN_TYPE_LABELS[device.kitchenType]) {
    return KITCHEN_TYPE_LABELS[device.kitchenType] || ''
  }
  if (device.entertainmentType && ENTERTAINMENT_TYPE_LABELS[device.entertainmentType]) {
    return ENTERTAINMENT_TYPE_LABELS[device.entertainmentType] || ''
  }
  return TYPE_LABELS[device.type] || device.type || ''
}
