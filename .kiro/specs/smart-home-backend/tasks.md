# Implementation Plan: Smart Home Backend System (Phase 1 - MVP)

## Overview

本实施计划将第一阶段（MVP）的后端开发分解为可执行的任务。每个任务都是独立的、可测试的步骤，按照依赖关系顺序执行。

## Tasks

- [x] 1. 初始化后端项目结构
  - 创建 backend 目录和子目录结构
  - 初始化 npm 项目（package.json）
  - 安装核心依赖包（express, mysql2, cors, dotenv）
  - 安装开发依赖（nodemon）
  - 创建 .env.example 文件
  - 创建 .gitignore 文件
  - _Requirements: 10.1_

- [x] 2. 配置数据库连接
  - [x] 2.1 创建数据库配置模块（src/config/database.js）
    - 实现连接池配置
    - 实现 getConnection() 方法
    - 实现 query() 方法
    - 实现 transaction() 方法
    - 实现 closePool() 方法
    - 添加连接错误处理
    - _Requirements: 8.1, 8.2_

  - [x] 2.2 测试数据库连接

    - 测试成功连接场景
    - 测试连接失败场景
    - 验证连接池正常工作
    - _Requirements: 8.1, 8.2_

- [x] 3. 创建数据库表结构
  - 编写 SQL 脚本创建 devices 表
  - 编写 SQL 脚本创建 rooms 表
  - 编写 SQL 脚本创建 operation_logs 表
  - 添加必要的索引
  - 执行 SQL 脚本初始化数据库
  - _Requirements: 8.3_

- [x] 4. 实现工具模块
  - [x] 4.1 创建响应工具（src/utils/response.js）
    - 实现 success() 方法
    - 实现 error() 方法
    - 定义统一响应格式
    - _Requirements: 10.2, 10.3_

  - [x] 4.2 创建日志工具（src/utils/logger.js）
    - 实现 info() 方法
    - 实现 error() 方法
    - 实现 warn() 方法
    - 实现 debug() 方法
    - 配置日志输出格式
    - _Requirements: 9.1_

- [x] 5. 实现错误处理中间件
  - [x] 5.1 创建错误处理模块（src/middleware/errorHandler.js）
    - 定义 AppError 自定义错误类
    - 定义 NotFoundError 错误类
    - 定义 ValidationError 错误类
    - 定义 DatabaseError 错误类
    - 实现 errorHandler 全局错误处理中间件
    - 实现 notFoundHandler 404 处理中间件
    - _Requirements: 9.1, 9.2_

  - [x] 5.2 编写错误处理属性测试

    - **Property 13: Error Response Consistency**
    - **Validates: Requirements 9.1, 9.2**

- [x] 6. 实现数据验证中间件
  - [x] 6.1 创建验证模块（src/middleware/validator.js）
    - 实现 validateDeviceCreate() 验证器
    - 实现 validateDeviceUpdate() 验证器
    - 实现 validateBrightness() 验证器
    - 实现 validateColorTemp() 验证器
    - 实现 validateRoom() 验证器
    - _Requirements: 1.6, 2.3, 2.4_

  - [x] 6.2 编写输入验证属性测试

    - **Property 6: Input Validation Consistency**
    - **Validates: Requirements 1.6, 10.5**

  - [ ] 6.3 编写亮度验证属性测试

    - **Property 9: Brightness Validation Range**
    - **Validates: Requirements 2.3**

  - [ ]* 6.4 编写色温验证属性测试
    - **Property 10: Color Temperature Validation Range**
    - **Validates: Requirements 2.4**

- [x] 7. 实现设备数据模型
  - [x] 7.1 创建设备模型（src/models/deviceModel.js）
    - 实现 createDevice() 方法
    - 实现 getAllDevices() 方法
    - 实现 getDeviceById() 方法
    - 实现 getDevicesByRoom() 方法
    - 实现 updateDevice() 方法
    - 实现 deleteDevice() 方法
    - 添加 SQL 参数化查询防止注入
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 7.2 编写设备创建属性测试
    - **Property 1: Device Creation Persistence**
    - **Validates: Requirements 1.1**

  - [ ]* 7.3 编写设备检索属性测试
    - **Property 2: Device Retrieval Completeness**
    - **Property 5: Device Retrieval Accuracy**
    - **Validates: Requirements 1.2, 1.5**

  - [ ]* 7.4 编写设备更新属性测试
    - **Property 3: Device Update Consistency**
    - **Validates: Requirements 1.3**

  - [ ]* 7.5 编写设备删除属性测试
    - **Property 4: Device Deletion Completeness**
    - **Validates: Requirements 1.4**

- [x] 8. 实现房间数据模型
  - [x] 8.1 创建房间模型（src/models/roomModel.js）
    - 实现 createRoom() 方法
    - 实现 getAllRooms() 方法
    - 实现 getRoomWithDevices() 方法
    - 实现 updateRoom() 方法
    - 实现 deleteRoom() 方法（检查房间是否为空）
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.2 编写房间管理单元测试
    - 测试创建房间
    - 测试获取房间列表
    - 测试删除空房间
    - 测试删除非空房间返回错误
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. 实现操作日志模型
  - [x] 9.1 创建日志模型（src/models/logModel.js）
    - 实现 createLog() 方法
    - 实现 getLogsByDevice() 方法
    - 实现 getLogsByTimeRange() 方法
    - 实现 cleanupOldLogs() 方法
    - _Requirements: 2.2, 7.1, 7.2, 7.3_

  - [ ]* 9.2 编写操作日志属性测试
    - **Property 8: Operation Logging Completeness**
    - **Validates: Requirements 2.2**

- [x] 10. 实现设备控制器
  - [x] 10.1 创建设备控制器（src/controllers/deviceController.js）
    - 实现 createDevice() 控制器方法
    - 实现 getAllDevices() 控制器方法
    - 实现 getDeviceById() 控制器方法
    - 实现 updateDevice() 控制器方法
    - 实现 deleteDevice() 控制器方法
    - 实现 toggleDeviceStatus() 控制器方法
    - 实现 setDeviceBrightness() 控制器方法
    - 实现 setDeviceColorTemp() 控制器方法
    - 添加错误处理（使用 try-catch 和 next()）
    - 集成操作日志记录
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 10.2 编写状态变更属性测试
    - **Property 7: Status Change Persistence**
    - **Validates: Requirements 2.1**

- [x] 11. 实现房间控制器
  - [x] 11.1 创建房间控制器（src/controllers/roomController.js）
    - 实现 createRoom() 控制器方法
    - 实现 getAllRooms() 控制器方法
    - 实现 getRoomWithDevices() 控制器方法
    - 实现 updateRoom() 控制器方法
    - 实现 deleteRoom() 控制器方法
    - 添加错误处理
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. 实现路由配置
  - [x] 12.1 创建设备路由（src/routes/deviceRoutes.js）
    - 配置 POST /api/devices 路由
    - 配置 GET /api/devices 路由
    - 配置 GET /api/devices/:id 路由
    - 配置 PUT /api/devices/:id 路由
    - 配置 DELETE /api/devices/:id 路由
    - 配置 PATCH /api/devices/:id/status 路由
    - 配置 PATCH /api/devices/:id/brightness 路由
    - 配置 PATCH /api/devices/:id/colorTemp 路由
    - 绑定验证中间件
    - _Requirements: 10.1_

  - [x] 12.2 创建房间路由（src/routes/roomRoutes.js）
    - 配置 POST /api/rooms 路由
    - 配置 GET /api/rooms 路由
    - 配置 GET /api/rooms/:name/devices 路由
    - 配置 PUT /api/rooms/:id 路由
    - 配置 DELETE /api/rooms/:id 路由
    - 绑定验证中间件
    - _Requirements: 10.1_

- [x] 13. 实现应用入口
  - [x] 13.1 创建应用主文件（src/app.js）
    - 初始化 Express 应用
    - 配置 CORS 中间件
    - 配置 JSON 解析中间件
    - 配置请求日志中间件
    - 注册设备路由
    - 注册房间路由
    - 注册 404 处理中间件
    - 注册全局错误处理中间件
    - 配置服务器启动和关闭逻辑
    - _Requirements: 10.1, 10.4_

  - [ ]* 13.2 编写 API 规范属性测试
    - **Property 14: HTTP Status Code Correctness**
    - **Property 15: JSON Response Format**
    - **Validates: Requirements 10.2, 10.3**

- [x] 14. 配置环境变量和启动脚本
  - 创建 .env 文件（基于 .env.example）
  - 配置数据库连接信息
  - 配置服务器端口
  - 在 package.json 中添加启动脚本（dev, start）
  - _Requirements: 8.1_

- [x] 15. 实现事务支持
  - [x] 15.1 在数据模型中添加事务支持
    - 修改 createDevice() 使用事务
    - 修改 updateDevice() 使用事务
    - 修改 deleteDevice() 使用事务
    - 添加事务回滚错误处理
    - _Requirements: 8.3, 8.4, 2.5_

  - [ ]* 15.2 编写事务属性测试
    - **Property 11: Transaction Atomicity**
    - **Property 12: Transaction Consistency**
    - **Validates: Requirements 2.5, 8.3, 8.4**

- [x] 16. Checkpoint - 后端功能验证
  - 启动后端服务器
  - 使用 Postman/Thunder Client 测试所有 API 端点
  - 验证数据库数据正确性
  - 检查错误处理是否正常
  - 查看日志输出
  - 确保所有测试通过，如有问题请向用户反馈

- [ ] 17. 前端集成准备
  - [ ] 17.1 创建 API 客户端服务（前端）
    - 在前端项目创建 src/services/api.js
    - 实现设备 API 调用方法
    - 实现房间 API 调用方法
    - 配置 axios 或 fetch 基础 URL
    - 添加错误处理
    - _Requirements: 10.1_

  - [ ] 17.2 修改前端 Pinia Store
    - 修改 src/stores/devices.ts
    - 将本地状态操作替换为 API 调用
    - 添加加载状态管理
    - 添加错误处理
    - 保持现有接口兼容性
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

  - [ ]* 17.3 前后端联调测试
    - 测试设备创建功能
    - 测试设备列表显示
    - 测试设备状态切换
    - 测试设备更新和删除
    - 测试房间管理功能
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [ ] 18. 最终验证和文档
  - 验证所有 API 端点正常工作
  - 验证前后端数据同步正确
  - 更新 backend/README.md 文档
  - 添加 API 使用示例
  - 记录已知问题和改进建议

## Notes

- 标记 `*` 的任务为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的正确性
- 属性测试任务标注了对应的设计文档属性编号
- 建议按顺序执行任务，因为存在依赖关系
- 第 17 步涉及前端修改，需要在前端项目中执行
