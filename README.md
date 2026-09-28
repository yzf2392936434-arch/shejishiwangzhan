# 个人设计师作品集官网（Full-stack Portfolio CMS）

一个开箱即用的设计师作品集官网与后台内容管理系统（CMS）。前台展示作品与个人品牌，后台可视化装修，不用写代码即可全量管理，专为设计师求职、接单与个人品牌打造。

> 基于 React + Vite 前端、NestJS 后端的全栈单页应用，内置作品管理、分类标签、媒体库、简历管理、主题切换、在线客服、防盗水印等完整能力。

---

## 界面预览

| 前台首页 | 管理员登录 | 后台仪表盘 |
| --- | --- | --- |
| ![前台首页](docs/screenshot-home.png) | ![管理员登录](docs/screenshot-login.png) | ![后台仪表盘](docs/screenshot-admin.png) |

---

## 功能特性

### 前台（访客所见）
- **主题系统**：12 套预设主题（黑白极简、莫兰迪、翡翠绿、深海蓝、樱花粉、暗夜金等）与自定义配色，一键暗色 / 亮色切换（浏览器本地记忆）
- **背景音乐**：后台上传 MP3，前台悬浮音符播放器
- **个性光标**：多套炫酷光标，移动端自动禁用
- **在线客服**：悬浮客服窗口，访客留言直达后台
- **防盗保护**：图片 / 视频禁右键、禁拖拽、禁长按保存，作品详情斜向水印
- **滚动淡入微交互、阅读进度、响应式**（手机 / 平板 / 桌面全适配）

### 后台（管理员，需登录）
- **仪表盘**：作品数、浏览量、点赞、发布状态一览
- **作品管理**：富文本编辑、封面、分类、标签、上下架
- **分类 / 标签管理**：多级分类与标签体系
- **媒体库**：图片 / 视频上传与复用
- **个人资料 / 简历管理**：在线维护简历与联系方式
- **导航 / 首页布局**：可视化调整导航与首页区块
- **动态管理、客服消息、网站设置**

### 登录安全
- 用户名 + 密码 + **直线滑动验证码**
- 验证码：服务端一次性 Token（5 分钟有效、单次使用）、轨迹行为检测、连续失败锁定
- Session 会话管理，未登录自动跳转

---

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | React 18 + Vite + TypeScript + TanStack Query + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Drizzle ORM + class-validator + Swagger |
| 平台 SDK | `@lark-apaas/fullstack-nestjs-core`、`@lark-apaas/client-toolkit` 等 |

---

## 快速开始

本项目基于 `@lark-apaas/*` 平台 SDK 构建（见下方「开源说明」），本地完整运行需在对应平台环境部署。

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（.env）
# 数据库连接、文件存储、会话密钥等

# 3. 启动开发环境
npm run dev

# 4. 生产构建
npm run build
npm start
```

- 默认管理员账号（**首次部署后请立即修改**）：用户名 `admin`，密码 `admin123`
- 登录地址：`/login`（需完成滑动验证）；后台地址：`/admin`

---

## 目录结构

```
├── client/                 # 前端（React + Vite）
│   └── src/
│       ├── pages/          # 页面（Home / Works / WorkDetail / About / Resume / Contact / Login / admin/*）
│       ├── components/     # 组件（Layout / MusicPlayer / CustomCursor / CustomerServiceWidget 等）
│       ├── contexts/       # ThemeContext（主题与暗色切换）
│       ├── hooks/          # useAuth 等
│       ├── api/            # 接口封装
│       └── styles/         # 全局样式
├── server/                 # 后端（NestJS）
│   ├── src/modules/        # auth / works / categories / tags / profile / media / settings / public 等
│   └── database/           # Drizzle schema
├── shared/                 # 前后端共享类型
└── scripts/                 # 构建与工具脚本
```

---

## 开发指南

```bash
npm run dev          # 开发（前后端热更新）
npm run type:check   # TS 类型检查
npm run lint         # ESLint + Stylelint
npm run build        # 生产构建
```

数据库表结构变更：`npm run gen:db-schema`。设计规范见 `AGENTS.md`。

---

## 贡献

欢迎提交 Issue 与 Pull Request。功能建议请先开 Issue 讨论。

---

## 开源说明

本项目使用 **MIT License** 开源，可自由使用、修改与商用。

> 重要：项目核心依赖 `@lark-apaas/*`（`fullstack-nestjs-core`、`client-toolkit` 等）为平台私有 SDK，独立部署需要将这部分依赖替换为公开等价实现（例如更换为 Express / Prisma 与 S3 存储）。前端页面与业务逻辑代码可完整复用。
>
> 项目数据（作品、账号等）请勿提交到仓库，注意清理 `.env` 与上传的媒体文件。

---

## 联系

- 项目作者：你的名字
- 邮箱、作品集、社交链接：待补充
