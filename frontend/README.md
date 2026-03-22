# 🏠 智能家居控制台 · 前端

**基于 Vue 3 + TypeScript 构建的现代化智能家居可视化控制界面**

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3.0-FFD859?style=flat-square&logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.13-409EFF?style=flat-square&logo=element&logoColor=white)](https://element-plus.org/)

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🏘️ 多房间管理 | 按房间分组展示设备，标签页快速切换 |
| 📱 40+ 设备类型 | 灯光、空调、厨房、卫浴、清洁、娱乐、安防、网络 |
| ⚡ 双层控制 | 底部快捷操作栏 + 详细控制弹窗 |
| ⏱️ 定时功能 | 设备定时器与倒计时 |
| 🎬 场景自动化 | 一键触发多设备联动 |
| 🗺️ 平面图视图 | 可视化房间平面图，直观展示设备位置 |
| 🔄 实时同步 | Socket.IO 推送，状态毫秒级更新 |
| 🌙 主题切换 | 深色 / 浅色主题，星空粒子背景 |
| 💾 数据持久化 | 设备状态与后端 MySQL 实时同步 |

---

## 🛠️ 技术栈

```
Vue 3 (Composition API)
├── TypeScript 5.9          类型安全
├── Vite 7.2                极速构建
├── Pinia 3.0               状态管理
├── Vue Router 4.6          路由管理
├── Element Plus 2.13       UI 组件库
├── ECharts 6.0             数据可视化
├── Socket.IO Client 4.8    实时通信
└── Axios 1.13              HTTP 请求
```

---

## 📁 项目结构

```
src/
├── 📄 App.vue                    根组件（顶栏、路由视图）
├── 📄 main.ts                    应用入口
├── 📄 style.css                  全局样式
│
├── 📂 features/
│   ├── 📂 device/                设备功能模块
│   │   ├── 📂 components/        设备组件（按分类组织）
│   │   │   ├── 🚿 bathroom/      卫浴（马桶、热水器、浴霸）
│   │   │   ├── 🧹 cleaners/      清洁（洗衣机、烘干机、扫地机、晾衣架）
│   │   │   ├── 🎮 entertainment/ 娱乐（电视、音响、投影仪、时钟）
│   │   │   ├── 🌡️ environment/   环境（空调、净化器、风扇、加湿器、除湿机、取暖器、香薰机）
│   │   │   ├── 🍳 kitchen/       厨房（电饭锅、油烟机、空气炸锅、电热水壶、饮水机、电磁炉）
│   │   │   ├── 💡 lights/        灯光（吸顶灯、台灯）
│   │   │   ├── 🌐 network/       网络设备（路由器、网关、WiFi 扩展器）
│   │   │   ├── 👤 personal/      个人设备（电热毯、智能床、智能枕头、开窗器）
│   │   │   ├── 🔒 security/      安防（摄像头、门锁、智能门）
│   │   │   ├── 🔌 switches/      开关插座
│   │   │   └── 🔧 common/        通用组件（定时器、倒计时、电量详情）
│   │   ├── 📂 composables/       设备控制逻辑复用
│   │   │   ├── 📄 useBottomBar.ts
│   │   │   ├── 📄 useDeviceControl.ts
│   │   │   ├── 📄 useRobotControl.ts
│   │   │   └── 📄 useSliderControl.ts
│   │   ├── 📂 store/             设备 Pinia Store
│   │   └── 📂 types/             TypeScript 类型定义
│   └── 📂 layout/                标签页布局（tabs.ts）
│
├── 📂 views/
│   ├── 📄 StandardMode.vue       主控制页面
│   ├── 📄 FloorPlan.vue          平面图视图
│   └── 📄 AddDevice.vue          添加设备页面
│
├── 📂 services/
│   ├── 📄 api.ts                 REST API 封装
│   └── 📄 socket.ts              Socket.IO 连接管理
│
├── 📂 composables/
│   └── 📄 useBackendSync.ts      后端数据同步逻辑
│
├── 📂 stores/
│   ├── 📄 theme.ts               主题 Store
│   └── 📄 layout.ts              布局 Store
│
├── 📂 shared/                    公共模块
│   ├── 📂 components/            公共组件
│   │   ├── 📄 NavBar.vue         顶部导航栏
│   │   ├── 📄 SideBar.vue        侧边栏
│   │   ├── 📄 Clock.vue          时钟组件
│   │   ├── 📄 Weather.vue        天气组件
│   │   ├── 📄 GlassCard.vue      毛玻璃卡片
│   │   ├── 📄 BackgroundEffects.vue  背景粒子特效
│   │   ├── 📄 Switchmode.vue     模式切换
│   │   └── 📄 TimerNotification.vue  定时通知
│   ├── 📂 composables/           公共逻辑复用
│   │   └── 📄 useNameOverflow.ts 名称溢出检测
│   └── 📂 utils/                 工具函数
│       └── 📄 timeFormat.ts      时间格式化
│
├── 📂 constants/                 设备类型、配置常量
├── 📂 router/                    路由配置
└── 📂 plugins/                   插件（Element Plus 等）
```

---

## 🚀 快速开始

### 环境要求

> Node.js `^20.19.0` 或 `>=22.12.0`

### 安装 & 启动

```bash
# 安装依赖
cd frontend
npm install

# 开发模式
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### 环境配置

编辑 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 所有命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run test` | 运行单元测试（单次） |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:ui` | 可视化测试界面 |

---

## 🔗 与后端通信

```
启动时  ──HTTP GET──▶  拉取房间 & 设备列表
操作时  ──HTTP──▶      增删改设备 / 触发场景
实时    ◀──Socket.IO── device:statusChanged 事件推送
```

后端需在 `http://localhost:3000` 运行，详见 [后端文档](../backend/README.md)。
