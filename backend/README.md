# ⚙️ 智能家居控制台 · 后端

**基于 Node.js + Express 构建的 RESTful API 服务**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![MQTT](https://img.shields.io/badge/MQTT-5.0-660066?style=flat-square&logo=mqtt&logoColor=white)](https://mqtt.org/)

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🔌 RESTful API | 设备、房间、场景的完整 CRUD |
| 📡 实时推送 | Socket.IO 广播设备状态变更至所有客户端 |
| 🌐 MQTT 集成 | 订阅设备上报，下发控制指令 |
| 🤖 设备模拟器 | 无需真实硬件即可模拟设备状态变化 |
| 🎬 场景自动化 | 批量触发多设备联动规则 |
| 📋 操作日志 | 记录所有设备控制动作 |
| 🗄️ 自动建表 | 启动时自动初始化 MySQL 数据库表结构 |

---

## 🛠️ 技术栈

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

---

## 📁 项目结构

```
backend/
├── 📄 app.js                     应用入口，启动序列
│
├── 📂 controllers/               请求处理逻辑
│   ├── 📄 deviceController.js
│   ├── 📄 deviceStateController.js
│   ├── 📄 roomController.js
│   └── 📄 sceneController.js
│
├── 📂 models/                    数据模型（MySQL 操作封装）
│   ├── 📄 Device.js
│   ├── 📄 DeviceState.js
│   ├── 📄 Room.js
│   ├── 📄 Scene.js
│   └── 📄 Log.js
│
├── 📂 routes/                    路由定义
│   ├── 📄 deviceRoutes.js
│   ├── 📄 deviceStateRoutes.js
│   ├── 📄 roomRoutes.js
│   └── 📄 sceneRoutes.js
│
├── 📂 simulation/                设备模拟
│   ├── 📄 deviceSimulator.js     设备状态机
│   └── 📄 simulationService.js   场景规则执行
│
├── 📂 utils/
│   ├── 📄 db.js                  MySQL 连接池
│   ├── 📄 initDb.js              数据库初始化
│   ├── 📄 mqttService.js         MQTT 客户端
│   └── 📄 socketService.js       Socket.IO 服务
│
└── 📄 .env                       环境变量配置
```

---

## 📡 API 接口

### 设备 `/api/devices`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/devices` | 获取所有设备 |
| `POST` | `/api/devices` | 创建设备 |
| `PUT` | `/api/devices/:id` | 更新设备信息 |
| `DELETE` | `/api/devices/:id` | 删除设备 |
| `GET` | `/api/devices/:id/state` | 获取设备状态 |
| `PATCH` | `/api/devices/:id/state` | 更新设备状态 |

### 房间 `/api/rooms`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/rooms` | 获取所有房间 |
| `POST` | `/api/rooms` | 创建房间 |
| `DELETE` | `/api/rooms/:id` | 删除房间 |

### 场景 `/api/scenes`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/scenes` | 获取所有场景 |
| `POST` | `/api/scenes` | 创建场景 |
| `POST` | `/api/scenes/:id/trigger` | 触发场景 |

### 健康检查

```
GET /health  →  { "status": "ok" }
```

---

## 🗄️ 数据模型

### devices — 设备主表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自增 |
| `name` | VARCHAR(100) | 设备名称 |
| `type` | VARCHAR(50) | 设备类型（light、environment 等） |
| `location` | VARCHAR(100) | 所在房间 |
| `status` | JSON | 当前状态（power、brightness 等） |
| `extra` | JSON | 前端扩展字段 |

### rooms — 房间表

`id` · `name`

### scenes — 场景表

`id` · `name` · `rules`（JSON 数组，每项为 `{ deviceId, status }`）

### logs — 操作日志

`id` · `action` · `deviceId` · `timestamp`

---

## 🚀 快速开始

### 环境要求

> Node.js `^20.19.0` 或 `>=22.12.0` · MySQL 5.7+

### 安装 & 启动

```bash
# 安装依赖
cd backend
npm install

# 开发模式（nodemon 热重载）
npm run dev

# 生产模式
npm start
```

服务运行在 `http://localhost:3000`

> 💡 首次启动会自动创建所有数据库表，无需手动建表。

### 环境配置

编辑 `.env` 文件：

```env
PORT=3000

# 数据库
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_home

# MQTT（可选，不配置则跳过 MQTT 初始化）
MQTT_URL=mqtt://user:password@host:1883
```

---

## 📨 Socket.IO 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `device:statusChanged` | 服务端 → 客户端 | 设备状态变更推送 |

## 📬 MQTT 主题

| 主题 | 方向 | 说明 |
|------|------|------|
| `device/status` | 设备 → 服务端 | 设备上报状态 |
| `device/control` | 服务端 → 设备 | 下发控制指令 |

> MQTT 为可选功能，未配置 `MQTT_URL` 时服务正常启动。
