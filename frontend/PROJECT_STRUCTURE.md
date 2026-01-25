# 项目结构说明

## 目录结构

```
src/
├── components/          # 组件目录
│   ├── common/         # 通用组件
│   │   ├── GlassCard.vue       # 玻璃卡片组件
│   │   └── NavBar.vue          # 导航栏组件
│   ├── controls/       # 控制组件
│   │   ├── BrightnessControl.vue  # 亮度控制
│   │   ├── Clock.vue              # 时钟
│   │   ├── Switchmode.vue         # 模式切换
│   │   └── Weather.vue            # 天气
│   ├── device/         # 设备相关组件
│   │   ├── BottomPowerBar.vue     # 底部电源栏
│   │   ├── BottomRackBar.vue      # 底部晾衣架控制栏
│   │   ├── BottomRobotBar.vue     # 底部扫地机器人控制栏
│   │   ├── BottomWashBar.vue      # 底部洗衣机控制栏
│   │   └── TimerNotification.vue  # 定时通知
│   └── dialogs/        # 对话框组件
│       ├── CountdownDialog.vue    # 倒计时对话框
│       ├── DeviceDialog.vue       # 设备详情对话框
│       ├── PowerDetailDialog.vue  # 电量详情对话框
│       ├── SocketDialog.vue       # 插座对话框
│       └── TimerDialog.vue        # 定时器对话框
├── composables/        # 组合式函数
│   └── useNameOverflow.ts  # 名称溢出处理
├── router/             # 路由配置
│   └── index.ts
├── stores/             # 状态管理
│   ├── devices.ts      # 设备状态
│   └── tabs.ts         # 标签页状态
├── views/              # 页面视图
│   ├── AddDevice.vue   # 添加设备页面
│   └── StandardMode.vue # 标准模式页面
├── App.vue             # 根组件
├── main.ts             # 入口文件
└── style.css           # 全局样式

```

## 组件说明

### 通用组件 (common/)
- **GlassCard.vue**: 毛玻璃效果的卡片容器
- **NavBar.vue**: 顶部导航栏，支持房间切换

### 控制组件 (controls/)
- **BrightnessControl.vue**: 灯光亮度控制面板
- **Clock.vue**: 显示当前时间
- **Switchmode.vue**: 模式切换徽章
- **Weather.vue**: 天气信息显示

### 设备组件 (device/)
- **BottomPowerBar.vue**: 通用设备电源控制底部栏
- **BottomRackBar.vue**: 晾衣架专用控制栏（升降、电源）
- **BottomRobotBar.vue**: 扫地机器人专用控制栏（清扫、返回基站）
- **BottomWashBar.vue**: 洗衣机专用控制栏（电源控制）
- **TimerNotification.vue**: 定时器触发通知

### 对话框组件 (dialogs/)
- **DeviceDialog.vue**: 设备详情和控制对话框（长按卡片触发）
- **SocketDialog.vue**: 插座专用对话框
- **TimerDialog.vue**: 定时器设置对话框
- **CountdownDialog.vue**: 倒计时设置对话框
- **PowerDetailDialog.vue**: 电量详情对话框

### 页面视图 (views/)
- **StandardMode.vue**: 标准模式主页面，显示设备卡片
- **AddDevice.vue**: 添加设备页面

### 状态管理 (stores/)
- **devices.ts**: 管理所有设备的状态、定时器、倒计时等
- **tabs.ts**: 管理房间标签页状态

### 组合式函数 (composables/)
- **useNameOverflow.ts**: 处理设备名称过长时的滚动效果

## 设备类型

### 支持的设备类型
1. **灯光 (light)**
   - 台灯 (table-lamp)
   - 吸顶灯 (ceiling-lamp)

2. **开关 (switch)**
   - 插座/插排 (socket)
   - 开关 (switch)

3. **清洁电器 (cleaner)**
   - 洗衣机 (washing-machine)
   - 烘干机 (dryer)
   - 扫地机器人 (robot-vacuum)
   - 晾衣架 (clothes-rack)

4. **安防 (security)**
5. **环境电器 (environment)**
6. **个护与起居 (personal)**
7. **卫浴 (bathroom)**
8. **厨房电器 (kitchen)**
   - 电热水壶 (electric-kettle)
9. **路由网关 (network)**
   - 路由器 (router)
   - 网关 (gateway)
   - WiFi信号放大器 (wifi-extender)
10. **影音娱乐 (entertainment)**
11. **其他 (other)**

## 功能特性

### 设备控制
- 单击卡片：显示底部快捷控制栏
- 长按卡片：打开详细控制对话框
- 右键卡片：删除设备

### 定时功能
- 定时开启
- 定时关闭
- 倒计时

### 特殊设备功能
- **扫地机器人**: 清扫模式、吸力/水量控制
- **晾衣架**: 升降控制、照明、烘干、风干、消毒
- **洗衣机/烘干机**: 多种清洁模式
- **台灯**: 亮度、色温、情景模式

## 技术栈
- Vue 3 (Composition API)
- TypeScript
- Pinia (状态管理)
- Vue Router
- Element Plus (UI组件库)
