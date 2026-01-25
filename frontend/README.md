# 智能家居控制系统

一个基于 Vue 3 + TypeScript 的现代化智能家居控制面板，提供直观的设备管理和控制界面。

## ✨ 功能特性

- 🏠 **房间管理**: 支持多房间切换和管理
- 🔌 **设备控制**: 支持多种智能设备的控制
- ⏰ **定时功能**: 定时开关、倒计时功能
- 🎨 **精美UI**: 毛玻璃效果、流畅动画
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 🌙 **深色主题**: 星空背景，视觉舒适

## 🚀 快速开始

### 环境要求

- Node.js 20.19.0+ 或 22.12.0+
- npm 或 pnpm

### 安装依赖

```sh
npm install
```

### 开发模式

```sh
npm run dev
```

### 类型检查

```sh
npm run type-check
```

### 生产构建

```sh
npm run build
```

### 预览构建

```sh
npm run preview
```

## 📦 支持的设备类型

### 灯光设备
- 台灯（亮度、色温、情景模式）
- 吸顶灯

### 清洁电器
- 扫地机器人（清扫模式、吸力/水量控制）
- 洗衣机/烘干机（多种清洁模式）
- 晾衣架（升降、照明、烘干、消毒）

### 其他设备
- 插座/插排
- 开关
- 路由器/网关
- 厨房电器（电热水壶等）

## 🎮 使用说明

### 设备操作
- **单击卡片**: 显示底部快捷控制栏
- **长按卡片**: 打开详细控制对话框
- **右键卡片**: 删除设备

### 房间管理
- 点击导航栏的 `+` 按钮添加房间
- 右键房间标签删除房间
- 点击房间标签切换当前房间

### 添加设备
1. 点击右上角模式切换按钮
2. 选择"添加设备"
3. 填写设备信息并选择所属房间
4. 点击确定完成添加

## 🛠️ 技术栈

- **框架**: Vue 3.5+ (Composition API)
- **语言**: TypeScript 5.9
- **状态管理**: Pinia 3.0+
- **路由**: Vue Router 4.6+
- **UI组件**: Element Plus 2.13+
- **图表**: ECharts 6.0+ / Vue-ECharts 8.0+
- **构建工具**: Vite 7.2+
- **开发工具**: Vue DevTools

## 📁 项目结构

详见 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🔧 开发工具推荐

### IDE
[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### 浏览器扩展
- Chrome/Edge: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 📄 许可证

MIT License
