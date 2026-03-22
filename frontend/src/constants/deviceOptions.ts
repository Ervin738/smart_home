/**
 * 设备选项常量
 * 功能：定义添加设备时的所有选项列表
 */

// 选项类型定义
export interface DeviceOption {
  value: string
  label: string
}

// 主设备类型选项
export const DEVICE_TYPES: DeviceOption[] = [
  { value: 'light', label: '照明' },
  { value: 'switch', label: '插座开关' },
  { value: 'network', label: '路由网关' },
  { value: 'cleaner', label: '清洁电器' },
  { value: 'environment', label: '环境电器' },
  { value: 'security', label: '安防' },
  { value: 'kitchen', label: '厨房电器' },
  { value: 'personal', label: '个护与起居' },
  { value: 'bathroom', label: '卫浴' },
  { value: 'entertainment', label: '影音娱乐' },
  { value: 'other', label: '其他' }
]

// 灯光类型选项
export const LIGHT_TYPES: DeviceOption[] = [
  { value: 'table-lamp', label: '台灯' },
  { value: 'ceiling-lamp', label: '吸顶灯' }
]

// 开关类型选项
export const SWITCH_TYPES: DeviceOption[] = [
  { value: 'socket', label: '插座/插排' },
  { value: 'switch', label: '开关' }
]

// 清洁电器类型选项
export const CLEANER_TYPES: DeviceOption[] = [
  { value: 'washing-machine', label: '洗衣机' },
  { value: 'dryer', label: '烘干机' },
  { value: 'clothes-rack', label: '晾衣架' },
  { value: 'robot-vacuum', label: '扫地机器人' }
]

// 安防类型选项（删除了猫眼门铃、保险箱、报警器、对讲机）
export const SECURITY_TYPES: DeviceOption[] = [
  { value: 'camera', label: '摄像机' },
  { value: 'door-lock', label: '门锁' },
  { value: 'smart-door', label: '智能门' }
]

// 环境电器类型选项
export const ENVIRONMENT_TYPES: DeviceOption[] = [
  { value: 'humidifier', label: '加湿器' },
  { value: 'heater', label: '电暖器' },
  { value: 'air-conditioner', label: '空调' },
  { value: 'fan', label: '风扇' },
  { value: 'dehumidifier', label: '除湿机' },
  { value: 'air-purifier', label: '空气净化器' },
  { value: 'aroma-diffuser', label: '香薰机' }
]

// 个护与起居类型选项
export const PERSONAL_TYPES: DeviceOption[] = [
  { value: 'smart-bed', label: '智能床' },
  { value: 'smart-pillow', label: '智能枕头' },
  { value: 'electric-blanket', label: '电热毯' },
  { value: 'window-opener', label: '开窗器' }
]

// 卫浴类型选项
export const BATHROOM_TYPES: DeviceOption[] = [
  { value: 'toilet', label: '马桶' },
  { value: 'yuba', label: '浴霸' },
  { value: 'water-heater', label: '热水器' }
]

// 厨房电器类型选项
export const KITCHEN_TYPES: DeviceOption[] = [
  { value: 'rice-cooker', label: '电饭煲' },
  { value: 'electric-kettle', label: '电热水壶' },
  { value: 'water-dispenser', label: '饮水机' },
  { value: 'range-hood', label: '抽油烟机' },
  { value: 'induction-cooker', label: '电磁炉' },
  { value: 'air-fryer', label: '空气炸锅' }
]

// 路由网关类型选项
export const NETWORK_TYPES: DeviceOption[] = [
  { value: 'router', label: '路由器' },
  { value: 'gateway', label: '网关' },
  { value: 'wifi-extender', label: 'WiFi信号放大器' }
]

// 影音娱乐类型选项
export const ENTERTAINMENT_TYPES: DeviceOption[] = [
  { value: 'tv', label: '电视' },
  { value: 'speaker', label: '音箱' },
  { value: 'projector', label: '投影仪' },
  { value: 'clock', label: '时钟' }
]

// 其他类型选项（空数组）
export const OTHER_TYPES: DeviceOption[] = []

/**
 * 根据设备类型获取对应的子类型选项
 * @param deviceType 设备类型
 * @returns 子类型选项数组
 */
export function getSubTypeOptions(deviceType: string): DeviceOption[] {
  const typeMap: Record<string, DeviceOption[]> = {
    light: LIGHT_TYPES,
    switch: SWITCH_TYPES,
    cleaner: CLEANER_TYPES,
    security: SECURITY_TYPES,
    environment: ENVIRONMENT_TYPES,
    personal: PERSONAL_TYPES,
    bathroom: BATHROOM_TYPES,
    kitchen: KITCHEN_TYPES,
    network: NETWORK_TYPES,
    entertainment: ENTERTAINMENT_TYPES,
    other: OTHER_TYPES
  }
  return typeMap[deviceType] || []
}

/**
 * 根据值获取标签
 * @param options 选项数组
 * @param value 值
 * @returns 对应的标签，未找到返回空字符串
 */
export function getLabelByValue(options: DeviceOption[], value: string): string {
  return options.find(opt => opt.value === value)?.label || ''
}
