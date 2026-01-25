# Requirements Document

## Introduction

智能家居控制系统后端服务，提供设备管理、用户认证、实时通信、场景联动等核心功能。基于 Node.js + Express + MySQL 架构，支持 RESTful API、WebSocket 实时通信和 MQTT 设备协议。

## Glossary

- **Backend_Server**: Node.js + Express 后端服务器
- **Database**: MySQL 数据库系统
- **API_Client**: 前端 Vue 应用或其他 HTTP 客户端
- **Device**: 智能家居设备实体
- **User**: 系统用户
- **Room**: 房间/空间分组
- **Scene**: 场景联动规则
- **WebSocket_Connection**: Socket.IO 实时双向通信连接
- **MQTT_Broker**: MQTT 消息代理服务器
- **JWT_Token**: JSON Web Token 身份认证令牌
- **Device_State**: 设备当前状态数据
- **Operation_Log**: 设备操作历史记录

## Requirements

### Requirement 1: 设备管理

**User Story:** 作为用户，我希望能够管理我的智能家居设备，以便添加、删除、修改和查询设备信息。

#### Acceptance Criteria

1. WHEN API_Client 请求创建新设备 THEN THE Backend_Server SHALL 验证设备数据并将其保存到 Database
2. WHEN API_Client 请求获取设备列表 THEN THE Backend_Server SHALL 从 Database 查询并返回所有设备
3. WHEN API_Client 请求更新设备信息 THEN THE Backend_Server SHALL 验证数据并更新 Database 中的设备数据
4. WHEN API_Client 请求删除设备 THEN THE Backend_Server SHALL 从 Database 中删除该设备及相关数据
5. WHEN API_Client 请求获取单个设备详情 THEN THE Backend_Server SHALL 返回该设备的完整信息
6. WHEN 设备数据无效（缺少必填字段） THEN THE Backend_Server SHALL 返回 400 错误并说明具体问题

### Requirement 2: 设备状态控制

**User Story:** 作为用户，我希望能够控制设备的状态（开关、亮度、色温等），以便远程操作智能家居设备。

#### Acceptance Criteria

1. WHEN API_Client 请求改变设备状态 THEN THE Backend_Server SHALL 更新 Database 并通过 WebSocket_Connection 广播状态变化
2. WHEN 设备状态改变 THEN THE Backend_Server SHALL 记录操作到 Operation_Log
3. WHEN API_Client 设置灯光亮度 THEN THE Backend_Server SHALL 验证亮度值在 0-100 范围内
4. WHEN API_Client 设置色温 THEN THE Backend_Server SHALL 验证色温值在 2700-6500K 范围内
5. WHEN 状态更新失败 THEN THE Backend_Server SHALL 回滚 Database 更改并返回错误信息

### Requirement 3: 实时通信

**User Story:** 作为用户，我希望设备状态变化能够实时同步到前端界面，以便及时了解设备状态。

#### Acceptance Criteria

1. WHEN API_Client 建立 WebSocket 连接 THEN THE Backend_Server SHALL 建立持久连接
2. WHEN 设备状态发生变化 THEN THE Backend_Server SHALL 通过 WebSocket_Connection 向所有连接的客户端推送更新
3. WHEN WebSocket_Connection 断开 THEN THE Backend_Server SHALL 清理连接资源并记录日志
4. WHEN 多个客户端连接 THEN THE Backend_Server SHALL 向所有客户端同步状态变化
5. WHEN WebSocket 消息发送失败 THEN THE Backend_Server SHALL 记录错误并尝试重新发送

### Requirement 4: 定时器与倒计时管理

**User Story:** 作为用户，我希望能够为设备设置定时任务和倒计时，以便自动化控制设备。

#### Acceptance Criteria

1. WHEN API_Client 创建定时任务 THEN THE Backend_Server SHALL 验证时间格式并保存到 Database
2. WHEN 定时任务到达执行时间 THEN THE Backend_Server SHALL 执行设备控制操作并更新 Device_State
3. WHEN 定时任务设置为重复 THEN THE Backend_Server SHALL 在执行后自动计算下次执行时间
4. WHEN API_Client 取消定时任务 THEN THE Backend_Server SHALL 从调度器中移除该任务并更新 Database
5. WHEN API_Client 设置倒计时 THEN THE Backend_Server SHALL 计算结束时间并在到期时执行指定操作
6. WHEN Backend_Server 重启 THEN THE Backend_Server SHALL 从 Database 恢复所有活动的定时任务

### Requirement 5: 房间管理

**User Story:** 作为用户，我希望能够创建和管理房间，以便按空间组织我的设备。

#### Acceptance Criteria

1. WHEN API_Client 创建新房间 THEN THE Backend_Server SHALL 验证房间名称并保存到 Database
2. WHEN API_Client 请求房间列表 THEN THE Backend_Server SHALL 返回所有房间及其包含的设备
3. WHEN API_Client 删除房间 THEN THE Backend_Server SHALL 检查房间是否为空，若为空则删除，否则返回错误
4. WHEN API_Client 更新房间信息 THEN THE Backend_Server SHALL 验证数据并更新 Database
5. WHEN 设备被分配到房间 THEN THE Backend_Server SHALL 更新设备的 location 字段

### Requirement 6: 场景联动

**User Story:** 作为用户，我希望能够创建场景规则，以便一键控制多个设备或实现自动化联动。

#### Acceptance Criteria

1. WHEN API_Client 创建场景 THEN THE Backend_Server SHALL 验证场景规则并保存到 Database
2. WHEN API_Client 触发场景 THEN THE Backend_Server SHALL 按顺序执行场景中的所有设备操作
3. WHEN 场景执行失败 THEN THE Backend_Server SHALL 记录错误并返回失败的设备列表
4. WHEN API_Client 删除场景 THEN THE Backend_Server SHALL 从 Database 中删除场景及相关规则
5. WHEN 场景包含条件触发 THEN THE Backend_Server SHALL 监听设备状态变化并自动执行场景

### Requirement 7: 操作日志记录

**User Story:** 作为系统管理员，我希望记录所有设备操作历史，以便追踪和审计。

#### Acceptance Criteria

1. WHEN 设备状态发生变化 THEN THE Backend_Server SHALL 记录操作时间、设备和变化内容到 Operation_Log
2. WHEN API_Client 请求操作历史 THEN THE Backend_Server SHALL 返回指定时间范围内的日志记录
3. WHEN 日志记录失败 THEN THE Backend_Server SHALL 记录错误但不影响主要操作
4. WHEN 日志数据超过保留期限 THEN THE Backend_Server SHALL 自动清理过期日志
5. WHEN API_Client 请求导出日志 THEN THE Backend_Server SHALL 生成 CSV 或 JSON 格式的日志文件

### Requirement 8: 数据持久化

**User Story:** 作为开发者，我希望所有关键数据都能可靠地存储在数据库中，以便系统重启后数据不丢失。

#### Acceptance Criteria

1. WHEN Backend_Server 启动 THEN THE Backend_Server SHALL 连接到 Database 并验证连接状态
2. WHEN Database 连接失败 THEN THE Backend_Server SHALL 记录错误并拒绝启动
3. WHEN 数据写入 Database THEN THE Backend_Server SHALL 使用事务确保数据一致性
4. WHEN 数据库操作失败 THEN THE Backend_Server SHALL 回滚事务并返回错误信息
5. WHEN 系统关闭 THEN THE Backend_Server SHALL 优雅地关闭所有数据库连接

### Requirement 9: 错误处理与日志

**User Story:** 作为开发者，我希望系统能够妥善处理错误并记录详细日志，以便快速定位和解决问题。

#### Acceptance Criteria

1. WHEN 发生未捕获的异常 THEN THE Backend_Server SHALL 记录完整的错误堆栈并返回通用错误响应
2. WHEN API 请求失败 THEN THE Backend_Server SHALL 返回标准化的错误响应（包含错误码和消息）
3. WHEN 系统运行时 THEN THE Backend_Server SHALL 记录所有重要操作到日志文件
4. WHEN 日志文件过大 THEN THE Backend_Server SHALL 自动轮转日志文件
5. WHEN 发生严重错误 THEN THE Backend_Server SHALL 发送告警通知（可选）

### Requirement 10: API 接口规范

**User Story:** 作为前端开发者，我希望后端提供清晰的 RESTful API，以便轻松集成前端应用。

#### Acceptance Criteria

1. THE Backend_Server SHALL 提供符合 RESTful 规范的 API 端点
2. THE Backend_Server SHALL 返回标准的 HTTP 状态码（200、201、400、401、403、404、500）
3. THE Backend_Server SHALL 使用 JSON 格式进行数据交换
4. THE Backend_Server SHALL 支持 CORS 跨域请求
5. THE Backend_Server SHALL 提供 API 文档（可使用 Swagger/OpenAPI）
6. WHEN API 接收到无效的请求参数 THEN THE Backend_Server SHALL 返回 400 错误并说明具体问题

### Requirement 11: 性能与可扩展性

**User Story:** 作为系统架构师，我希望后端系统具有良好的性能和可扩展性，以便支持大量设备和用户。

#### Acceptance Criteria

1. WHEN 并发请求数量增加 THEN THE Backend_Server SHALL 保持响应时间在可接受范围内（< 500ms）
2. WHEN Database 查询复杂 THEN THE Backend_Server SHALL 使用索引优化查询性能
3. WHEN 系统负载过高 THEN THE Backend_Server SHALL 实施限流策略保护系统
4. THE Backend_Server SHALL 支持水平扩展（多实例部署）
5. THE Backend_Server SHALL 使用连接池管理数据库连接


### Requirement 12: 用户认证与授权（可选功能）

**User Story:** 作为系统管理员，我希望在未来能够添加用户认证功能，以便保护智能家居设备的访问权限。

#### Acceptance Criteria

1. WHERE 用户认证功能启用 WHEN 用户提交有效的注册信息 THEN THE Backend_Server SHALL 创建新用户账户并返回成功响应
2. WHERE 用户认证功能启用 WHEN 用户使用正确的凭据登录 THEN THE Backend_Server SHALL 生成 JWT_Token 并返回给客户端
3. WHERE 用户认证功能启用 WHEN API_Client 携带有效的 JWT_Token 访问受保护资源 THEN THE Backend_Server SHALL 验证令牌并允许访问
4. WHERE 用户认证功能启用 WHEN API_Client 携带无效或过期的 JWT_Token THEN THE Backend_Server SHALL 拒绝访问并返回 401 未授权错误
5. WHERE 用户认证功能未启用 THEN THE Backend_Server SHALL 允许所有 API 请求无需认证

## 实施优先级

### 第一阶段（MVP - 最小可行产品）
1. Requirement 1: 设备管理
2. Requirement 2: 设备状态控制
3. Requirement 8: 数据持久化
4. Requirement 9: 错误处理与日志
5. Requirement 10: API 接口规范

### 第二阶段（增强功能）
6. Requirement 3: 实时通信
7. Requirement 4: 定时器与倒计时管理
8. Requirement 5: 房间管理
9. Requirement 7: 操作日志记录

### 第三阶段（高级功能）
10. Requirement 6: 场景联动
11. Requirement 11: 性能与可扩展性
12. Requirement 12: 用户认证与授权（可选）
