# Design Document: Smart Home Backend System (Phase 1 - MVP)

## Overview

智能家居后端系统第一阶段（MVP）设计文档。本阶段专注于核心功能：设备管理、设备状态控制、数据持久化、错误处理和 RESTful API 接口。

技术栈：
- **运行时**: Node.js (v20+)
- **框架**: Express.js
- **数据库**: MySQL 8.0+
- **ORM**: mysql2 (原生 SQL)
- **语言**: JavaScript (ES6+)
- **进程管理**: nodemon (开发环境)

## Architecture

### 系统架构图

```
┌─────────────────┐
│   Vue Frontend  │
│   (API Client)  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────────┐
│      Express.js Backend Server      │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐    │
│  │  Routes  │─▶│ Controllers  │    │
│  └──────────┘  └──────┬───────┘    │
│                       │             │
│  ┌────────────────────▼─────────┐  │
│  │   Business Logic Services    │  │
│  └────────────┬─────────────────┘  │
│               │                     │
│  ┌────────────▼─────────────────┐  │
│  │      Database Models         │  │
│  └────────────┬─────────────────┘  │
└───────────────┼─────────────────────┘
                │ SQL
                ▼
        ┌───────────────┐
        │  MySQL 8.0+   │
        │   Database    │
        └───────────────┘
```

### 目录结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库连接配置
│   ├── models/
│   │   ├── deviceModel.js       # 设备数据模型
│   │   └── roomModel.js         # 房间数据模型
│   ├── controllers/
│   │   ├── deviceController.js  # 设备控制器
│   │   └── roomController.js    # 房间控制器
│   ├── routes/
│   │   ├── deviceRoutes.js      # 设备路由
│   │   └── roomRoutes.js        # 房间路由
│   ├── middleware/
│   │   ├── errorHandler.js      # 错误处理中间件
│   │   └── validator.js         # 数据验证中间件
│   ├── utils/
│   │   ├── logger.js            # 日志工具
│   │   └── response.js          # 统一响应格式
│   └── app.js                   # 应用入口
├── .env                         # 环境变量
├── .env.example                 # 环境变量示例
├── package.json
└── README.md
```

## Components and Interfaces

### 1. Database Connection (config/database.js)

**职责**: 管理 MySQL 数据库连接池

**接口**:
```javascript
// 获取数据库连接
async function getConnection()

// 执行查询
async function query(sql, params)

// 执行事务
async function transaction(callback)

// 关闭连接池
async function closePool()
```

**配置参数**:
- `host`: 数据库主机地址
- `port`: 数据库端口（默认 3306）
- `user`: 数据库用户名
- `password`: 数据库密码
- `database`: 数据库名称
- `connectionLimit`: 连接池大小（默认 10）

### 2. Device Model (models/deviceModel.js)

**职责**: 设备数据的 CRUD 操作

**接口**:
```javascript
// 创建设备
async function createDevice(deviceData)
// 参数: { id, name, type, location, status, brightness?, colorTemp?, ... }
// 返回: { id, ...deviceData, createdAt, updatedAt }

// 获取所有设备
async function getAllDevices()
// 返回: Device[]

// 根据 ID 获取设备
async function getDeviceById(id)
// 返回: Device | null

// 根据房间获取设备
async function getDevicesByRoom(location)
// 返回: Device[]

// 更新设备
async function updateDevice(id, updates)
// 参数: id, { name?, type?, location?, status?, brightness?, ... }
// 返回: Device

// 删除设备
async function deleteDevice(id)
// 返回: { success: boolean, message: string }
```

### 3. Room Model (models/roomModel.js)

**职责**: 房间数据的 CRUD 操作

**接口**:
```javascript
// 创建房间
async function createRoom(roomData)
// 参数: { name }
// 返回: { id, name, createdAt }

// 获取所有房间
async function getAllRooms()
// 返回: Room[]

// 获取房间及其设备
async function getRoomWithDevices(roomName)
// 返回: { room: Room, devices: Device[] }

// 更新房间
async function updateRoom(id, updates)
// 返回: Room

// 删除房间
async function deleteRoom(id)
// 返回: { success: boolean, message: string }
```

### 4. Device Controller (controllers/deviceController.js)

**职责**: 处理设备相关的 HTTP 请求

**方法**:
```javascript
// POST /api/devices - 创建设备
async function createDevice(req, res, next)

// GET /api/devices - 获取所有设备
async function getAllDevices(req, res, next)

// GET /api/devices/:id - 获取单个设备
async function getDeviceById(req, res, next)

// PUT /api/devices/:id - 更新设备
async function updateDevice(req, res, next)

// DELETE /api/devices/:id - 删除设备
async function deleteDevice(req, res, next)

// PATCH /api/devices/:id/status - 切换设备状态
async function toggleDeviceStatus(req, res, next)

// PATCH /api/devices/:id/brightness - 设置亮度
async function setDeviceBrightness(req, res, next)

// PATCH /api/devices/:id/colorTemp - 设置色温
async function setDeviceColorTemp(req, res, next)
```

### 5. Room Controller (controllers/roomController.js)

**职责**: 处理房间相关的 HTTP 请求

**方法**:
```javascript
// POST /api/rooms - 创建房间
async function createRoom(req, res, next)

// GET /api/rooms - 获取所有房间
async function getAllRooms(req, res, next)

// GET /api/rooms/:name/devices - 获取房间及其设备
async function getRoomWithDevices(req, res, next)

// PUT /api/rooms/:id - 更新房间
async function updateRoom(req, res, next)

// DELETE /api/rooms/:id - 删除房间
async function deleteRoom(req, res, next)
```

### 6. Error Handler Middleware (middleware/errorHandler.js)

**职责**: 统一处理应用错误

**接口**:
```javascript
// 全局错误处理中间件
function errorHandler(err, req, res, next)

// 404 处理
function notFoundHandler(req, res, next)

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode)
}
```

### 7. Validator Middleware (middleware/validator.js)

**职责**: 验证请求数据

**接口**:
```javascript
// 验证设备创建数据
function validateDeviceCreate(req, res, next)

// 验证设备更新数据
function validateDeviceUpdate(req, res, next)

// 验证亮度值
function validateBrightness(req, res, next)

// 验证色温值
function validateColorTemp(req, res, next)

// 验证房间数据
function validateRoom(req, res, next)
```

### 8. Response Utility (utils/response.js)

**职责**: 统一 API 响应格式

**接口**:
```javascript
// 成功响应
function success(res, data, message, statusCode = 200)
// 格式: { success: true, message, data }

// 错误响应
function error(res, message, statusCode = 500, errors = null)
// 格式: { success: false, message, errors? }
```

### 9. Logger Utility (utils/logger.js)

**职责**: 应用日志记录

**接口**:
```javascript
// 记录信息日志
function info(message, meta)

// 记录错误日志
function error(message, error)

// 记录警告日志
function warn(message, meta)

// 记录调试日志
function debug(message, meta)
```

## Data Models

### Database Schema

#### 1. devices 表

存储所有智能设备信息

```sql
CREATE TABLE devices (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  light_type VARCHAR(50),
  switch_type VARCHAR(50),
  cleaner_type VARCHAR(50),
  security_type VARCHAR(50),
  environment_type VARCHAR(50),
  personal_type VARCHAR(50),
  bathroom_type VARCHAR(50),
  kitchen_type VARCHAR(50),
  network_type VARCHAR(50),
  entertainment_type VARCHAR(50),
  other_type VARCHAR(50),
  location VARCHAR(100) NOT NULL,
  status ENUM('online', 'offline') DEFAULT 'offline',
  brightness INT CHECK (brightness >= 0 AND brightness <= 100),
  color_temp INT CHECK (color_temp >= 2700 AND color_temp <= 6500),
  timer_off_enabled BOOLEAN DEFAULT FALSE,
  timer_off_time VARCHAR(5),
  timer_off_timestamp BIGINT,
  timer_off_repeat BOOLEAN DEFAULT FALSE,
  timer_on_enabled BOOLEAN DEFAULT FALSE,
  timer_on_time VARCHAR(5),
  timer_on_timestamp BIGINT,
  timer_on_repeat BOOLEAN DEFAULT FALSE,
  countdown_enabled BOOLEAN DEFAULT FALSE,
  countdown_action ENUM('on', 'off'),
  countdown_end_time BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_location (location),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:
- `id`: 设备唯一标识符（UUID）
- `name`: 设备名称
- `type`: 设备类型（light, switch, cleaner, etc.）
- `*_type`: 各类型设备的子类型
- `location`: 所属房间
- `status`: 设备状态（online/offline）
- `brightness`: 亮度（0-100，仅灯光设备）
- `color_temp`: 色温（2700-6500K，仅灯光设备）
- `timer_*`: 定时器相关字段
- `countdown_*`: 倒计时相关字段

#### 2. rooms 表

存储房间信息

```sql
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:
- `id`: 房间 ID（自增）
- `name`: 房间名称（唯一）

#### 3. operation_logs 表

存储设备操作日志

```sql
CREATE TABLE operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL,
  device_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:
- `id`: 日志 ID（自增）
- `device_id`: 设备 ID
- `device_name`: 设备名称（冗余字段，便于查询）
- `action`: 操作类型（create, update, delete, toggle_status, set_brightness, etc.）
- `old_value`: 旧值（JSON 格式）
- `new_value`: 新值（JSON 格式）
- `timestamp`: 操作时间

### TypeScript/JavaScript 接口定义

```javascript
// Device 接口（与前端保持一致）
interface Device {
  id: string;
  name: string;
  type: string;
  lightType?: string;
  switchType?: string;
  cleanerType?: string;
  securityType?: string;
  environmentType?: string;
  personalType?: string;
  bathroomType?: string;
  kitchenType?: string;
  networkType?: string;
  entertainmentType?: string;
  otherType?: string;
  location: string;
  status: 'online' | 'offline';
  brightness?: number;
  colorTemp?: number;
  timerOffEnabled?: boolean;
  timerOffTime?: string;
  timerOffTimestamp?: number;
  timerOffRepeat?: boolean;
  timerOnEnabled?: boolean;
  timerOnTime?: string;
  timerOnTimestamp?: number;
  timerOnRepeat?: boolean;
  countdownEnabled?: boolean;
  countdownAction?: 'on' | 'off';
  countdownEndTime?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Room 接口
interface Room {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// OperationLog 接口
interface OperationLog {
  id: number;
  deviceId: string;
  deviceName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}
```

## API Endpoints

### 基础 URL
```
http://localhost:3000/api
```

### 设备管理 API

#### 1. 创建设备
```
POST /api/devices
Content-Type: application/json

Request Body:
{
  "id": "uuid-string",
  "name": "客厅台灯",
  "type": "light",
  "lightType": "desk",
  "location": "客厅",
  "status": "offline",
  "brightness": 50,
  "colorTemp": 4000
}

Response (201):
{
  "success": true,
  "message": "设备创建成功",
  "data": {
    "id": "uuid-string",
    "name": "客厅台灯",
    ...
    "createdAt": "2024-01-24T10:00:00.000Z",
    "updatedAt": "2024-01-24T10:00:00.000Z"
  }
}
```

#### 2. 获取所有设备
```
GET /api/devices

Response (200):
{
  "success": true,
  "message": "获取设备列表成功",
  "data": [
    {
      "id": "uuid-1",
      "name": "客厅台灯",
      ...
    },
    {
      "id": "uuid-2",
      "name": "卧室吸顶灯",
      ...
    }
  ]
}
```

#### 3. 获取单个设备
```
GET /api/devices/:id

Response (200):
{
  "success": true,
  "message": "获取设备详情成功",
  "data": {
    "id": "uuid-string",
    "name": "客厅台灯",
    ...
  }
}

Response (404):
{
  "success": false,
  "message": "设备不存在"
}
```

#### 4. 更新设备
```
PUT /api/devices/:id
Content-Type: application/json

Request Body:
{
  "name": "客厅新台灯",
  "location": "书房"
}

Response (200):
{
  "success": true,
  "message": "设备更新成功",
  "data": {
    "id": "uuid-string",
    "name": "客厅新台灯",
    "location": "书房",
    ...
  }
}
```

#### 5. 删除设备
```
DELETE /api/devices/:id

Response (200):
{
  "success": true,
  "message": "设备删除成功"
}
```

#### 6. 切换设备状态
```
PATCH /api/devices/:id/status

Response (200):
{
  "success": true,
  "message": "设备状态已切换",
  "data": {
    "id": "uuid-string",
    "status": "online"
  }
}
```

#### 7. 设置设备亮度
```
PATCH /api/devices/:id/brightness
Content-Type: application/json

Request Body:
{
  "brightness": 75
}

Response (200):
{
  "success": true,
  "message": "亮度设置成功",
  "data": {
    "id": "uuid-string",
    "brightness": 75
  }
}

Response (400):
{
  "success": false,
  "message": "亮度值必须在 0-100 之间"
}
```

#### 8. 设置设备色温
```
PATCH /api/devices/:id/colorTemp
Content-Type: application/json

Request Body:
{
  "colorTemp": 5000
}

Response (200):
{
  "success": true,
  "message": "色温设置成功",
  "data": {
    "id": "uuid-string",
    "colorTemp": 5000
  }
}

Response (400):
{
  "success": false,
  "message": "色温值必须在 2700-6500K 之间"
}
```

### 房间管理 API

#### 1. 创建房间
```
POST /api/rooms
Content-Type: application/json

Request Body:
{
  "name": "客厅"
}

Response (201):
{
  "success": true,
  "message": "房间创建成功",
  "data": {
    "id": 1,
    "name": "客厅",
    "createdAt": "2024-01-24T10:00:00.000Z"
  }
}
```

#### 2. 获取所有房间
```
GET /api/rooms

Response (200):
{
  "success": true,
  "message": "获取房间列表成功",
  "data": [
    {
      "id": 1,
      "name": "客厅",
      "createdAt": "2024-01-24T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "卧室",
      "createdAt": "2024-01-24T10:05:00.000Z"
    }
  ]
}
```

#### 3. 获取房间及其设备
```
GET /api/rooms/:name/devices

Response (200):
{
  "success": true,
  "message": "获取房间设备成功",
  "data": {
    "room": {
      "id": 1,
      "name": "客厅"
    },
    "devices": [
      {
        "id": "uuid-1",
        "name": "客厅台灯",
        ...
      }
    ]
  }
}
```

#### 4. 删除房间
```
DELETE /api/rooms/:id

Response (200):
{
  "success": true,
  "message": "房间删除成功"
}

Response (400):
{
  "success": false,
  "message": "房间不为空，无法删除"
}
```

### 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "errors": {
    "field": "具体错误信息"
  }
}
```

常见 HTTP 状态码：
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## Error Handling

### 错误处理策略

1. **全局错误捕获**: 使用 Express 错误处理中间件捕获所有未处理的错误
2. **自定义错误类**: 定义 `AppError` 类，包含错误消息和 HTTP 状态码
3. **数据库错误处理**: 捕获 MySQL 错误并转换为友好的错误消息
4. **验证错误**: 在中间件层验证请求数据，返回详细的验证错误信息

### 错误类型

```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 常见错误类型
class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} 不存在`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}
```

### 错误处理流程

```javascript
// 1. 在控制器中抛出错误
async function getDeviceById(req, res, next) {
  try {
    const device = await deviceModel.getDeviceById(req.params.id);
    if (!device) {
      throw new NotFoundError('设备');
    }
    return success(res, device, '获取设备详情成功');
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
}

// 2. 全局错误处理中间件
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error(err.message, err);
  
  // 操作性错误（已知错误）
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null
    });
  }
  
  // 未知错误
  return res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
}
```

## Testing Strategy

### 测试方法

第一阶段（MVP）采用**手动测试 + API 测试工具**的方式：

1. **API 测试工具**: 使用 Postman 或 Thunder Client 测试所有 API 端点
2. **数据库测试**: 直接查询数据库验证数据正确性
3. **日志检查**: 查看应用日志确认错误处理正确

### 测试清单

#### 设备管理测试
- [ ] 创建设备 - 验证设备正确保存到数据库
- [ ] 获取所有设备 - 验证返回所有设备列表
- [ ] 获取单个设备 - 验证返回正确的设备信息
- [ ] 更新设备 - 验证设备信息正确更新
- [ ] 删除设备 - 验证设备从数据库中删除
- [ ] 切换设备状态 - 验证状态在 online/offline 之间切换
- [ ] 设置亮度 - 验证亮度值在 0-100 范围内
- [ ] 设置色温 - 验证色温值在 2700-6500K 范围内

#### 房间管理测试
- [ ] 创建房间 - 验证房间正确保存
- [ ] 获取所有房间 - 验证返回所有房间列表
- [ ] 获取房间及设备 - 验证返回房间和关联设备
- [ ] 删除空房间 - 验证空房间可以删除
- [ ] 删除非空房间 - 验证返回错误信息

#### 错误处理测试
- [ ] 无效的设备 ID - 返回 404 错误
- [ ] 无效的亮度值 - 返回 400 错误
- [ ] 无效的色温值 - 返回 400 错误
- [ ] 缺少必填字段 - 返回 400 错误
- [ ] 数据库连接失败 - 返回 500 错误

#### 数据持久化测试
- [ ] 服务器重启后数据保持 - 验证数据不丢失
- [ ] 并发写入 - 验证数据一致性
- [ ] 事务回滚 - 验证错误时数据回滚

### 测试数据

```javascript
// 测试设备数据
const testDevice = {
  id: "test-device-001",
  name: "测试台灯",
  type: "light",
  lightType: "desk",
  location: "测试房间",
  status: "offline",
  brightness: 50,
  colorTemp: 4000
};

// 测试房间数据
const testRoom = {
  name: "测试房间"
};
```

## Implementation Notes

### 开发步骤

1. **初始化项目**
   - 创建 backend 目录
   - 初始化 npm 项目
   - 安装依赖包

2. **配置数据库**
   - 创建 MySQL 数据库
   - 执行建表 SQL
   - 配置数据库连接

3. **实现核心模块**
   - 数据库连接模块
   - 数据模型层
   - 控制器层
   - 路由层
   - 中间件

4. **测试验证**
   - 使用 Postman 测试所有 API
   - 验证数据库数据正确性
   - 检查错误处理

5. **前端集成**
   - 修改前端 Pinia store
   - 替换本地状态为 API 调用
   - 测试前后端联调

### 环境变量配置

`.env` 文件示例：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_home

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 依赖包说明

```json
{
  "dependencies": {
    "express": "^4.18.2",      // Web 框架
    "mysql2": "^3.6.5",        // MySQL 驱动
    "cors": "^2.8.5",          // 跨域支持
    "dotenv": "^16.3.1"        // 环境变量
  },
  "devDependencies": {
    "nodemon": "^3.0.2"        // 开发热重载
  }
}
```

### 性能优化建议

1. **数据库连接池**: 使用连接池避免频繁创建连接
2. **索引优化**: 在常用查询字段上创建索引
3. **缓存策略**: 后续可考虑添加 Redis 缓存
4. **批量操作**: 批量插入/更新时使用事务
5. **查询优化**: 避免 SELECT *，只查询需要的字段

### 安全注意事项

1. **SQL 注入防护**: 使用参数化查询
2. **输入验证**: 验证所有用户输入
3. **错误信息**: 不暴露敏感的系统信息
4. **CORS 配置**: 限制允许的来源域名
5. **环境变量**: 敏感信息存储在 .env 文件中

## Next Steps (Phase 2)

第二阶段将实现以下功能：

1. **实时通信**: 集成 Socket.IO，实现设备状态实时推送
2. **定时器管理**: 实现定时任务调度和持久化
3. **倒计时功能**: 实现倒计时自动执行
4. **操作日志**: 完善日志记录和查询功能

这些功能将在第一阶段稳定运行后逐步添加。


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Device Creation Persistence
*For any* valid device data, when the API creates a device, querying the database should return a device with matching data.
**Validates: Requirements 1.1**

### Property 2: Device Retrieval Completeness
*For any* set of devices in the database, the get all devices API should return all devices without omission.
**Validates: Requirements 1.2**

### Property 3: Device Update Consistency
*For any* existing device and valid update data, after updating the device, querying the database should reflect all the changes.
**Validates: Requirements 1.3**

### Property 4: Device Deletion Completeness
*For any* existing device, after deletion, querying the database should return no results for that device ID.
**Validates: Requirements 1.4**

### Property 5: Device Retrieval Accuracy
*For any* existing device, querying by ID should return the complete and accurate device information.
**Validates: Requirements 1.5**

### Property 6: Input Validation Consistency
*For any* invalid device data (missing required fields or invalid values), the API should return a 400 error with specific error details.
**Validates: Requirements 1.6, 10.5**

### Property 7: Status Change Persistence
*For any* device, when the status is toggled, the database should reflect the new status immediately.
**Validates: Requirements 2.1**

### Property 8: Operation Logging Completeness
*For any* device state change, an operation log entry should be created with accurate before/after values.
**Validates: Requirements 2.2**

### Property 9: Brightness Validation Range
*For any* brightness value, the API should accept values in range [0, 100] and reject values outside this range with a 400 error.
**Validates: Requirements 2.3**

### Property 10: Color Temperature Validation Range
*For any* color temperature value, the API should accept values in range [2700, 6500] and reject values outside this range with a 400 error.
**Validates: Requirements 2.4**

### Property 11: Transaction Atomicity
*For any* database operation that fails, no partial changes should be persisted to the database (all-or-nothing).
**Validates: Requirements 2.5, 8.4**

### Property 12: Transaction Consistency
*For any* database write operation, the operation should be wrapped in a transaction to ensure data consistency.
**Validates: Requirements 8.3**

### Property 13: Error Response Consistency
*For any* error condition (validation, not found, server error), the API should return a standardized error response format with success=false, message, and optional errors field.
**Validates: Requirements 9.1, 9.2**

### Property 14: HTTP Status Code Correctness
*For any* API response, the HTTP status code should correctly reflect the outcome (200/201 for success, 400 for validation errors, 404 for not found, 500 for server errors).
**Validates: Requirements 10.2**

### Property 15: JSON Response Format
*For any* API response, the Content-Type header should be application/json and the response body should be valid JSON.
**Validates: Requirements 10.3**
