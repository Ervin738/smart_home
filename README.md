# 智能家居控制系统

一个基于 Vue 3 + TypeScript + Express.js 的全栈智能家居控制系统。

## 📁 项目结构

```
smart-home/
├── frontend/          # 前端项目（Vue 3 + TypeScript）
├── backend/           # 后端项目（Express.js）
└── docs/             # 项目文档
```

详细的目录结构说明请查看 [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)

## 🚀 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

详细说明请查看 [frontend/README.md](./frontend/README.md)

### 后端

```bash
cd backend
npm install
npm run dev
```

详细说明请查看 [backend/README.md](./backend/README.md)

### 新手指南

第一次使用？请查看 [快速开始指南](./QUICK_START.md) 📖

## ✨ 主要功能

- 🏠 多房间管理
- 🔌 多种智能设备控制（灯光、清洁电器、环境电器、网络设备等）
- ⏰ 定时开关和倒计时功能
- 🎨 精美的毛玻璃 UI 设计
- 📱 响应式布局
- 🌙 深色主题

## 🛠️ 技术栈

### 前端
- Vue 3.5+ (Composition API)
- TypeScript 5.9
- Pinia (状态管理)
- Vue Router 4.6+
- Element Plus 2.13+
- ECharts 6.0+
- Vite 7.2+

### 后端
- Node.js
- Express.js 4.18+
- CORS
- dotenv

## 🔧 最近优化（2026-01-29）

项目已完成全面的代码审查和优化：

### 删除的未使用文件（15个）
- 6个未使用的对话框组件
- 2个未使用的共享组件
- 1个未使用的底部控制栏
- 5个后端空文件夹标记
- 1个临时文件

### 代码质量改进
- ✅ 修复了重复的导出语句
- ✅ 优化了 composables 结构
- ✅ 修正了导入路径错误
- ✅ 通过 TypeScript 类型检查
- ✅ 保持所有功能和样式完整

### 优化成果
- 删除约 2000+ 行冗余代码
- 项目结构更加清晰
- 维护成本降低
- 构建速度提升

## 📚 文档

> 💡 **不知道从哪里开始？** 查看 [文档索引](./DOCUMENTATION_INDEX.md) 找到适合你的文档

- 🌟 [项目概览](./PROJECT_OVERVIEW.md) ⭐ **推荐首次阅读**
- 🚀 [快速开始指南](./QUICK_START.md) ⭐ **5分钟上手**
- 📖 [完整目录结构说明](./DIRECTORY_STRUCTURE.md) ⭐ **开发必读**
- 📑 [文档索引](./DOCUMENTATION_INDEX.md) - 按角色/主题查找文档
- 📖 [前端 README](./frontend/README.md)
- 📖 [后端 README](./backend/README.md)
- 📖 [项目结构说明](./docs/PROJECT_STRUCTURE.md)
- 📖 [核心文件说明](./docs/01-核心文件说明.md)
- 📖 [视图文件说明](./docs/02-视图文件说明.md)
- 📖 [设备功能模块说明](./docs/03-设备功能模块说明.md)
- 📖 [共享组件说明](./docs/04-共享组件说明.md)

## 📄 许可证

MIT License

## 👨‍💻 开发建议

### IDE 推荐
- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### 浏览器扩展
- Chrome/Edge: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请通过 Issue 联系我们。
