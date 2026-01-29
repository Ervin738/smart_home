# 后端项目

智能家居控制系统的后端服务，基于 Express.js 构建。

## 📁 项目结构

```
backend/
├── src/
│   ├── middleware/      # 中间件（错误处理等）
│   ├── routes/          # 路由定义
│   ├── app.js          # 应用入口
│   └── [预留文件夹]     # controllers, models, services, config, utils
└── .env                # 环境变量配置
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

## 🛠️ 技术栈

- **框架**: Express.js 4.18+
- **跨域**: CORS
- **环境变量**: dotenv
- **开发工具**: nodemon

## 📡 API 接口

### 健康检查

```
GET /api/health
```

返回服务器运行状态。

## 🔧 配置说明

在 `.env` 文件中配置：

```env
PORT=3000
NODE_ENV=development
```

## 📝 待实现功能

- [ ] 设备管理 API（增删改查）
- [ ] 定时器管理 API
- [ ] 用户认证系统
- [ ] 数据持久化（数据库集成）
- [ ] WebSocket 实时通信

## 🔒 安全性

- 已配置 CORS 跨域支持
- 已实现基础错误处理中间件
- 建议添加：
  - 请求速率限制
  - 输入验证
  - JWT 认证
  - HTTPS 支持

## 📄 许可证

MIT License
