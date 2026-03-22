/**
 * 设备类型定义
 * 功能：定义所有设备的类型接口，按设备类别拆分
 */

// ==================== 基础设备接口 ====================
export interface BaseDevice {
  id: string
  name: string
  type: 'light' | 'switch' | 'cleaner' | 'security' | 'environment' | 'personal' | 'bathroom' | 'kitchen' | 'network' | 'entertainment' | 'other'
  location: string
  status: 'online' | 'offline'
}

// ==================== 定时器相关接口 ====================
export interface TimerFeature {
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
}

export interface CountdownFeature {
  // 倒计时
  countdownEnabled?: boolean
  countdownAction?: 'on' | 'off'
  countdownEndTime?: number // 倒计时结束时间戳
}

// ==================== 灯光设备 ====================
export interface LightDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'light'
  lightType: 'table-lamp' | 'ceiling-lamp'
  brightness?: number // 灯光亮度 0-100
  colorTemp?: number // 色温 2700-6500K
}

// ==================== 开关设备 ====================
export interface SwitchDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'switch'
  switchType: 'socket' | 'switch'
}

// ==================== 清洁设备 ====================
export interface CleanerDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'cleaner'
  cleanerType: 'washing-machine' | 'dryer' | 'clothes-rack' | 'robot-vacuum'
}

// ==================== 安防设备 ====================
export interface SecurityDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'security'
  securityType: 'camera' | 'door-lock' | 'smart-door'
}

// ==================== 环境设备 ====================
export interface EnvironmentDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'environment'
  environmentType: 'humidifier' | 'heater' | 'air-conditioner' | 'fan' | 'air-purifier' | 'dehumidifier' | 'aroma-diffuser'
  targetTemp?: number // 目标温度 16-32°C (电暖器、空调)
  acModeIndex?: number | null // 空调模式索引 0-2 (制冷、制热、除湿)
  humidifierLevel?: number // 加湿器档位 1-3 (1档、2档、恒湿)
  speedLevel?: number // 风速档位 1-4 (风扇)
  fanModeIndex?: number // 风扇模式索引 0-1 (直吹风、自然风)
  targetHumidity?: number // 目标湿度 30-80% (除湿机)
  dehumidifierModeIndex?: number // 除湿机模式索引 0-2 (除湿、干衣、净化)
  // 摆风功能 (风扇、空气净化器)
  swingEnabled?: boolean // 摆风开关
  swingAngle?: number // 摆风角度 30/60/90
  // 空气净化器
  purifierModeIndex?: number // 空气净化器模式索引 0-3 (智能、睡眠、净化、风扇)
  brightnessLevel?: number // 屏幕亮度级别 0-3 (关闭、自动、微光、亮光)
  // 延时关闭 (电暖器)
  delayShutdownEnabled?: boolean
  delayShutdownDuration?: number // 延时关闭时长（分钟）
  delayShutdownEndTime?: number // 延时关闭结束时间戳
}

// ==================== 个护与起居设备 ====================
export interface PersonalDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'personal'
  personalType: 'smart-bed' | 'smart-pillow' | 'electric-blanket' | 'window-opener'
  // 延时关闭 (电热毯)
  delayShutdownEnabled?: boolean
  delayShutdownDuration?: number
  delayShutdownEndTime?: number
  // 智能床
  backAngle?: number // 背部升降角度 0-60
  legAngle?: number // 腿部升降角度 0-45
  // 智能枕头
  pillowAutoMode?: number // 自动模式 0-颈部按摩 1-深度拉伸
  pillowHeatingMode?: number // 加热模式 0-关闭 1-1档 2-2档
  pillowTimeAdjust?: number // 时间调节 5-30分钟
  pillowGearLevel?: number // 挡位调节 1-5档
  // 电热毯
  blanketAreaALevel?: number // A区档位 0-6
  blanketAreaBLevel?: number // B区档位 0-6
  blanketSelectedZone?: number // 选中区域 0-AB区 1-A区 2-B区
}

// ==================== 卫浴设备 ====================
export interface BathroomDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'bathroom'
  bathroomType: 'toilet' | 'water-heater' | 'yuba'
  targetTemp?: number // 目标温度 (热水器)
  // 马桶
  toiletWaterTemp?: number    // 水温档位 1-7
  toiletSeatTemp?: number     // 座圈温度档位 1-5
  toiletAirTemp?: number      // 暖风温度档位 1-7
  toiletWaterStrength?: number // 水压档位 1-5
  toiletNozzlePosition?: number // 喷嘴位置 1-5
  toiletLidOpen?: boolean     // 马桶盖状态
  toiletWashMode?: string | null // 当前清洗模式 hip/female/child/strong/null
  toiletDryMode?: boolean     // 强力烘干是否激活
  // 延时关闭 (浴霸)
  delayShutdownEnabled?: boolean
  delayShutdownDuration?: number
  delayShutdownEndTime?: number
  // 照明延时关闭 (浴霸)
  lightDelayShutdownEnabled?: boolean
  lightDelayShutdownDuration?: number
  lightDelayShutdownEndTime?: number
}

// ==================== 厨房设备 ====================
export interface KitchenDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'kitchen'
  kitchenType: 'rice-cooker' | 'induction-cooker' | 'range-hood' | 'electric-kettle' | 'air-fryer' | 'water-dispenser'
  // 饮水机
  waterDispenserCurrentTemp?: number // 当前温度
  waterDispenserTargetTemp?: number // 目标温度
  waterDispenserKeepWarmTemp?: number // 保温温度
  waterDispenserHeating?: boolean // 是否正在加热
  waterDispenserKeepingWarm?: boolean // 是否正在保温
  waterDispenserSelectedWaterType?: string // 选中的水类型
  waterDispenserKeepWarmEnabled?: boolean // 是否开启保温
  waterDispenserFanCoolingEnabled?: boolean // 是否开启风冷
  // 空气炸锅
  airFryerCooking?: boolean // 是否正在烹饪
  airFryerCookingTime?: number // 烹饪时间（分钟）
  airFryerModeId?: number // 烹饪模式ID
  airFryerModeName?: string // 烹饪模式名称
}

// ==================== 网络设备 ====================
export interface NetworkDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'network'
  networkType: 'router' | 'gateway' | 'wifi-extender'
}

// ==================== 影音娱乐设备 ====================
export interface EntertainmentDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'entertainment'
  entertainmentType: 'tv' | 'speaker' | 'projector' | 'clock'
  // 闹钟 (时钟设备)
  alarmEnabled?: boolean
  alarmTime?: string // HH:mm 格式
  alarmTimestamp?: number // 闹钟时间戳
}

// ==================== 其他设备 ====================
export interface OtherDevice extends BaseDevice, TimerFeature, CountdownFeature {
  type: 'other'
  otherType?: string
}

// ==================== 联合类型 ====================
export type Device = 
  | LightDevice 
  | SwitchDevice 
  | CleanerDevice 
  | SecurityDevice 
  | EnvironmentDevice 
  | PersonalDevice 
  | BathroomDevice 
  | KitchenDevice 
  | NetworkDevice 
  | EntertainmentDevice 
  | OtherDevice
