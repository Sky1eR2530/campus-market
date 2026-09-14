# 校园淘 · 校园闲置与生活信息服务平台

面向在校学生的闲置物品信息平台。第一阶段聚焦一条完整闭环：**发布 → 浏览 → 搜索 → 详情 → 收藏 → 状态管理**。

项目按阶段推进，每个阶段都要求「可运行、可验证」，而不是一次性堆完代码。

## 当前进度

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| Phase 0 | 项目规划（产品、数据模型、架构、阶段计划） | 已完成 |
| Phase 1 | 前端 UI / MVP 页面（Mock 数据） | 已完成 |
| Phase 2 | 后端 API 与数据库 | 待开始 |
| Phase 3 | 前后端联调 | 待开始 |
| Phase 4 | 管理后台 | 待开始 |
| Phase 5 | 测试与优化 | 待开始 |
| Phase 6 | 部署上线 | 待开始 |
| Phase 7 | 真实用户测试与迭代 | 待开始 |

完整的产品与架构设计见 [docs/phase-0-plan.md](docs/phase-0-plan.md)。

## 技术栈

- **前端**：Vue 3 + Vite + Vue Router + Pinia + TypeScript
- **校验**：Zod，规则定义在共享包中，Phase 2 的后端会复用同一份 schema
- **样式**：原生 CSS + 设计令牌（CSS 变量），自研基础组件，不引入重型 UI 库
- **包管理**：pnpm workspace（monorepo）
- **后端 / 数据库（Phase 2）**：Express + Prisma + PostgreSQL

## 目录结构

```
.
├─ apps/
│  └─ web/                     # 学生端 SPA
│     └─ src/
│        ├─ api/               # 接口层（Phase 1 由本地 Mock 实现，Phase 3 换成真实请求）
│        │  └─ mock/           # Mock 数据与模拟服务端
│        ├─ components/
│        │  ├─ ui/             # 基础组件（按钮、输入框、弹窗、骨架屏…）
│        │  ├─ business/       # 业务组件（商品卡片、状态标签、表单…）
│        │  └─ layout/         # 顶部栏、底部标签栏、页脚
│        ├─ composables/       # 可复用逻辑（异步状态、收藏交互、页面标题…）
│        ├─ layouts/           # 页面布局（默认布局、用户中心、登录注册）
│        ├─ router/            # 路由与访问守卫
│        ├─ stores/            # Pinia 状态（登录态、收藏、全局提示）
│        ├─ styles/            # 设计令牌与全局样式
│        ├─ utils/             # 格式化、校验、图片处理等
│        └─ views/             # 页面
├─ packages/
│  └─ shared/                  # 前后端共享的类型、常量与校验规则
├─ docs/
└─ work/                       # 本地验证脚本与截图（不进入 Git）
```

## 快速开始

```bash
pnpm install
pnpm dev          # 启动开发服务器，默认 http://localhost:5173
```

其他命令：

```bash
pnpm build        # 类型检查 + 生产构建
pnpm preview      # 预览生产构建产物
pnpm typecheck    # 仅做类型检查
```

> 如果环境里没有全局 `pnpm`，可以用 `corepack enable` 启用，
> 或直接调用任意可用的 pnpm 可执行文件，例如
> `node <pnpm 路径>/bin/pnpm.cjs install`。

## 环境变量

复制 `.env.example` 为 `.env` 后按需修改。`.env` 已在 `.gitignore` 中，不会被提交。

Phase 1 只需要前端的两个变量：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `VITE_USE_MOCK` | 是否使用本地 Mock 数据 | `true` |
| `VITE_API_BASE_URL` | API 基础路径 | `/api` |

其余变量（数据库、JWT、对象存储）为 Phase 2 及之后预留。

## 演示账号

Phase 1 的数据保存在浏览器本地，登录页提供「一键填入」按钮：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 学生用户 | `demo@campus.edu` | `demo1234` |
| 管理员 | `admin@campus.edu` | `admin1234` |

演示账号自带 4 件商品，覆盖在售 / 已售 / 下架三种状态，便于查看状态管理的完整效果。

## 本地验证

Phase 1 用一个 Playwright 脚本走完整流程并检查控制台错误：

```bash
# 需要先启动 pnpm dev
node work/smoke.mjs
```

脚本会依次验证首页、列表筛选、搜索、空状态、接口错误与重试、详情页、未登录拦截、
登录回跳、收藏、发布（含图片上传与表单校验）、状态管理、用户中心、404，
并在 375px 宽度下复查移动端是否存在横向溢出。截图输出在 `work/shots/`。

另外两个便于手工测试的入口：

- 访问 `/items?mockError=1` 可以触发一次接口失败，用来检查错误提示与「重试」按钮
- 用户中心底部提供「重置演示数据」，可清空本地数据回到初始状态

## 设计约定

- **颜色、间距、圆角、阴影只在 `styles/tokens.css` 中定义**，组件内通过 `var()` 引用，不写死具体数值。
- **每个数据页面都必须实现四种状态**：加载中、空数据、请求失败、有数据。
- **接口层与页面解耦**：页面只调用 `src/api/` 里的函数，Phase 3 替换实现时页面代码不需要改动。
- **业务规则集中在 Mock 服务端**（`src/api/mock/db.ts`），包括权限校验、状态机和错误码，
  这样切到真实后端时行为边界一致。
- **登录态与收藏状态放在 Pinia**，保证顶部栏、列表、详情、用户中心四处状态一致。

## 已知限制（Phase 1 范围内）

- 数据保存在 `localStorage`，换浏览器或清缓存后重置；图片以压缩后的 data URL 存储。
- 密码是明文比较的——这是浏览器内演示数据的必然结果，**Phase 2 的后端会使用 bcrypt 哈希**。
- 未接入真实接口，搜索与筛选在本地内存中完成。

## 下一阶段

Phase 2 将建立真实的 Express + Prisma + PostgreSQL 后端，实现注册登录、商品增删改查、
分类、收藏与图片上传，并补齐接口层测试。前端页面不需要改动，只需把 `src/api/` 中的实现替换为真实请求。
