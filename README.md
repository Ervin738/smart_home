# 🏠 智能家居控制台

**全栈智能家居可视化控制系统**

多房间设备管理 · 场景自动化 · 实时状态同步

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![MQTT](https://img.shields.io/badge/MQTT-5.0-660066?style=flat-square&logo=mqtt&logoColor=white)](https://mqtt.org/)

---

## 📖 目录

- [项目介绍](#-项目介绍)
- [系统架构](#-系统架构)
- [功能概览](#-功能概览)
- [前端介绍](#-前端介绍)
- [后端介绍](#-后端介绍)
- [快速开始](#-快速开始)

---

## 🌟 项目介绍

智能家居控制台是一套完整的全栈物联网控制系统，旨在为家庭用户提供统一的智能设备管理平台。

用户可以通过浏览器实时查看和控制家中所有智能设备，支持按房间分组管理、自定义场景联动、设备状态实时推送等核心功能。系统内置设备模拟器，无需真实硬件即可体验完整功能；同时支持 MQTT 协议，可无缝接入真实物联网设备。

**核心亮点：**

| 亮点 | 说明 |
|------|------|
| 🏘️ 多房间管理 | 按房间分组展示设备，标签页快速切换，支持动态添加房间 |
| 📱 40+ 设备类型 | 覆盖灯光、空调、厨房、卫浴、清洁、娱乐、安防、网络等全品类 |
| ⚡ 双层控制 | 底部快捷操作栏满足日常需求，详细弹窗提供精细控制 |
| 🎬 场景自动化 | 自定义场景规则，一键触发多设备联动 |
| 🗺️ 平面图视图 | 可视化房间平面图，直观展示设备位置与状态 |
| 🔄 实时同步 | Socket.IO 双向通信，设备状态毫秒级推送至所有客户端 |
| 🤖 设备模拟 | 内置状态机模拟器，开发调试无需真实硬件 |
| 🌐 MQTT 支持 | 标准物联网协议，可直接接入真实设备 |
| 🌙 主题切换 | 深色 / 浅色主题，星空粒子背景动效 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器 / 客户端                        │
│              Vue 3 + TypeScript + Pinia                  │
└──────────────┬──────────────────────┬───────────────────┘
               │ REST API             │ Socket.IO
               ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Node.js + Express                       │
│         Controllers · Models · Services                  │
└──────────────┬──────────────────────┬───────────────────┘
               │ SQL                  │ MQTT
               ▼                      ▼
        ┌─────────────┐      ┌─────────────────┐
        │    MySQL    │      │  MQTT Broker /  │
        │  Database   │      │    模拟器        │
        └─────────────┘      └─────────────────┘
```

**数据流说明：**

- 前端启动时通过 REST API 拉取房间和设备列表，初始化 Pinia 状态
- 用户操作设备时，前端发送 HTTP 请求到后端，后端更新数据库并通过 Socket.IO 广播状态变更
- 后端通过 MQTT 订阅真实设备上报，同步写入数据库并推送前端
- 场景触发时，后端批量执行规则，逐一更新设备状态并推送

---

## ✨ 功能概览

### 设备分类

| 分类 | 设备类型 |
|------|------|
| 💡 灯光 | 普通灯、氛围灯、台灯、夜灯等 |
| 🌡️ 环境 | 空调、空气净化器、加湿器、除湿机、风扇、暖风机、香薰机 |
| 🍳 厨房 | 电饭锅、油烟机、空气炸锅、电热水壶、电磁炉 |
| 🚿 卫浴 | 智能马桶、热水器、浴霸 |
| 🧹 清洁 | 洗衣机、烘干机、扫地机器人、晾衣架 |
| 🎮 娱乐 | 电视、音响、投影仪、智能时钟 |
| 🔒 安防 | 摄像头、门锁、传感器 |
| 🌐 网络 | 路由器、网关 |
| 🔌 开关 | 智能插座、开关面板 |

### 场景自动化

场景由一组设备动作规则组成，每条规则指定目标设备和期望状态。触发场景后，系统按规则顺序批量执行，并通过 Socket.IO 实时推送每个设备的状态变更。

---

## 🖥️ 前端介绍

### 技术栈

```
Vue 3 (Composition API)
├── TypeScript 5.9          类型安全
├── Vite 7.2                极速构建
├── Pinia 3.0               状态管理
├── Vue Router 4.6          路由管理
├── Element Plus 2.13       UI 组件库
├── ECharts 6.0             数据可视化
├── Socket.IO Client 4.8    实时通信
├── Axios 1.13              HTTP 请求
└── Vitest 4.1 + fast-check 单元测试 & 属性测试
```

### 项目结构

```
src/
├── 📄 App.vue                    根组件（顶栏、路由视图）
├── 📄 main.ts                    应用入口
│
├── 📂 features/
│   ├── 📂 device/                设备功能模块
│   │   ├── 📂 components/        设备组件（按分类组织）
│   │   │   ├── 🚿 bathroom/      卫浴（马桶、热水器、浴霸）
│   │   │   ├── 🧹 cleaners/      清洁（洗衣机、烘干机、扫地机）
│   │   │   ├── 🎮 entertainment/ 娱乐（电视、音响、投影仪）
│   │   │   ├── 🌡️ environment/   环境（空调、净化器、风扇、加湿器等）
│   │   │   ├── 🍳 kitchen/       厨房（电饭锅、油烟机、空气炸锅）
│   │   │   ├── 💡 lights/        灯光
│   │   │   ├── 🌐 network/       网络设备
│   │   │   ├── 👤 personal/      个人设备
│   │   │   ├── 🔒 security/      安防
│   │   │   ├── 🔌 switches/      开关插座
│   │   │   └── 🔧 common/        通用组件（定时器、电量详情）
│   │   ├── 📂 composables/       设备控制逻辑复用
│   │   ├── 📂 store/             设备 Pinia Store
│   │   └── 📂 types/             TypeScript 类型定义
│   └── 📂 layout/                布局模块（导航栏、标签页）
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
├── 📂 shared/                    公共组件（时钟、天气、导航）
├── 📂 constants/                 设备类型、配置常量
├── 📂 router/                    路由配置
└── 📂 plugins/                   插件（Element Plus 等）
```

### 与后端通信

```
启动时  ──HTTP GET──▶  拉取房间 & 设备列表，初始化 Pinia Store
操作时  ──HTTP──▶      增删改设备 / 触发场景
实时    ◀──Socket.IO── device:statusChanged 事件推送
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run test` | 运行单元测试（单次，`vitest --run`） |
| `npm run test:watch` | 监听模式运行测试（`vitest`） |
| `npm run test:ui` | 可视化测试界面（`vitest --ui`） |

---

## ⚙️ 后端介绍

### 技术栈

```
Node.js 20+
├── Express 5.2             Web 框架
├── MySQL2 3.20             数据库驱动（连接池）
├── Socket.IO 4.8           实时双向通信
├── MQTT 5.15               设备协议
├── dotenv 17.3             环境变量管理
├── CORS 2.8                跨域支持
└── body-parser 2.2         请求体解析
```

### 项目结构

```
backend/
├── 📄 app.js                     应用入口，启动序列
├── 📂 controllers/               请求处理逻辑
│   ├── 📄 deviceController.js
│   ├── 📄 deviceStateController.js
│   ├── 📄 roomController.js
│   └── 📄 sceneController.js
├── 📂 models/                    数据模型（MySQL 操作封装）
│   ├── 📄 Device.js
│   ├── 📄 DeviceState.js
│   ├── 📄 Room.js
│   ├── 📄 Scene.js
│   └── 📄 Log.js
├── 📂 routes/                    路由定义
│   ├── 📄 deviceRoutes.js
│   ├── 📄 deviceStateRoutes.js
│   ├── 📄 roomRoutes.js
│   └── 📄 sceneRoutes.js
├── 📂 simulation/                设备模拟
│   ├── 📄 deviceSimulator.js     设备状态机
│   └── 📄 simulationService.js   场景规则执行
├── 📂 utils/
│   ├── 📄 db.js                  MySQL 连接池
│   ├── 📄 initDb.js              数据库初始化
│   ├── 📄 mqttService.js         MQTT 客户端
│   └── 📄 socketService.js       Socket.IO 服务
└── 📄 .env                       环境变量配置
```

### API 接口

**设备**

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/devices` | 获取所有设备 |
| `POST` | `/api/devices` | 创建设备 |
| `PUT` | `/api/devices/:id` | 更新设备信息 |
| `DELETE` | `/api/devices/:id` | 删除设备 |
| `GET` | `/api/devices/:id/state` | 获取设备状态 |
| `PATCH` | `/api/devices/:id/state` | 更新设备状态 |

**房间**

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/rooms` | 获取所有房间 |
| `POST` | `/api/rooms` | 创建房间 |
| `DELETE` | `/api/rooms/:id` | 删除房间 |

**场景**

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/scenes` | 获取所有场景 |
| `POST` | `/api/scenes` | 创建场景 |
| `POST` | `/api/scenes/:id/trigger` | 触发场景 |

**健康检查**

```
GET /health  →  { "status": "ok" }
```

### 数据模型

**devices — 设备主表**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自增 |
| `name` | VARCHAR(100) | 设备名称 |
| `type` | VARCHAR(50) | 设备类型（light、environment 等） |
| `location` | VARCHAR(100) | 所在房间 |
| `status` | JSON | 当前状态（power、brightness 等） |
| `extra` | JSON | 前端扩展字段 |

**rooms** — `id` · `name`

**scenes** — `id` · `name` · `rules`（JSON 数组，每项为 `{ deviceId, status }`）

**logs** — `id` · `action` · `deviceId` · `timestamp`

### Socket.IO 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `device:statusChanged` | 服务端 → 客户端 | 设备状态变更推送 |

### MQTT 主题

| 主题 | 方向 | 说明 |
|------|------|------|
| `device/status` | 设备 → 服务端 | 设备上报状态 |
| `device/control` | 服务端 → 设备 | 下发控制指令 |

> MQTT 为可选功能，未配置 `MQTT_URL` 时服务正常启动。

---

## 🚀 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- MySQL 5.7+
- （可选）MQTT Broker

### 第一步：启动后端

```bash
cd backend
npm install
```

编辑 `backend/.env`：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_home

# 可选
MQTT_URL=mqtt://user:password@host:1883
```

```bash
npm run dev
# ✅ 服务运行在 http://localhost:3000
# ✅ 首次启动自动初始化数据库表
```

### 第二步：启动前端

```bash
cd frontend
npm install
```

编辑 `frontend/.env`：

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

```bash
npm run dev
# ✅ 界面运行在 http://localhost:5173
```
