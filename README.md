# 校园淘 · 校园闲置与生活信息服务平台

面向在校学生的闲置物品信息平台。第一阶段聚焦一条完整闭环：**发布 → 浏览 → 搜索 → 详情 → 收藏 → 状态管理**。

项目按阶段推进，每个阶段都要求「可运行、可验证」，而不是一次性堆完代码。

## 当前进度

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| Phase 0 | 项目规划（产品、数据模型、架构、阶段计划） | 已完成 |
| Phase 1 | 前端 UI / MVP 页面（Mock 数据） | 已完成 |
| Phase 2 | 后端 API 与数据库 | 进行中 |
| 2.1 | 工程骨架、环境变量校验、Prisma 模型、迁移、种子数据、健康检查 | 已完成 |
| 2.2 | 认证模块（注册 / 登录 / JWT） | 待开始 |
| 2.3 | 分类与商品 CRUD、状态机 | 待开始 |
| 2.4 | 图片上传（存储抽象层） | 待开始 |
| 2.5 | 收藏与用户资料 | 待开始 |
| 2.6 | 接口层测试 | 待开始 |
| Phase 3 | 前后端联调 | 待开始 |
| Phase 4 | 管理后台 | 待开始 |
| Phase 5 | 测试与优化 | 待开始 |
| Phase 6 | 部署上线 | 待开始 |
| Phase 7 | 真实用户测试与迭代 | 待开始 |

完整的产品与架构设计见 [docs/phase-0-plan.md](docs/phase-0-plan.md)。

## 技术栈

- **前端**：Vue 3 + Vite + Vue Router + Pinia + TypeScript
- **后端**：Express 5 + TypeScript，分层结构（router → controller → service → repository）
- **数据库**：PostgreSQL + Prisma 7（driver adapter 直连）
- **校验**：Zod，规则定义在共享包中，前后端复用同一份 schema
- **样式**：原生 CSS + 设计令牌（CSS 变量），自研基础组件，不引入重型 UI 库
- **包管理**：pnpm workspace（monorepo）

## 目录结构

```
.
├─ apps/
│  ├─ web/                     # 学生端 SPA
│  │  └─ src/
│  │     ├─ api/               # 接口层（Phase 1 由本地 Mock 实现，Phase 3 换成真实请求）
│  │     │  └─ mock/           # Mock 数据与模拟服务端
│  │     ├─ components/        # ui（基础组件）/ business（业务组件）/ layout（布局）
│  │     ├─ composables/       # 可复用逻辑（异步状态、收藏交互、页面标题…）
│  │     ├─ layouts/           # 页面布局（默认布局、用户中心、登录注册）
│  │     ├─ router/            # 路由与访问守卫
│  │     ├─ stores/            # Pinia 状态（登录态、收藏、全局提示）
│  │     ├─ styles/            # 设计令牌与全局样式
│  │     ├─ utils/             # 格式化、校验、图片处理等
│  │     └─ views/             # 页面
│  └─ api/                     # 后端 API
│     ├─ prisma/
│     │  ├─ schema.prisma      # 数据模型
│     │  ├─ migrations/        # 迁移历史（纳入版本控制）
│     │  └─ seed.ts            # 种子数据
│     ├─ src/
│     │  ├─ config/            # 环境变量校验
│     │  ├─ lib/               # Prisma 客户端、日志
│     │  ├─ middlewares/       # 请求日志、错误处理
│     │  ├─ modules/           # 业务模块（当前：health）
│     │  ├─ dev/               # 本地开发工具（不进入生产构建）
│     │  ├─ app.ts             # Express 应用组装
│     │  └─ index.ts           # 进程入口与优雅退出
│     └─ prisma.config.ts      # Prisma 7 配置（schema 路径、seed 命令、连接串）
├─ packages/
│  └─ shared/                  # 前后端共享的类型、常量与校验规则（构建到 dist 后供双方消费）
├─ docs/
└─ work/                       # 本地验证脚本与截图（不进入 Git）
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备数据库

本项目使用 PostgreSQL。开发环境有两种选择，任选其一：

**方式 A：使用内置的本地数据库（推荐，无需 Docker、无需注册账号）**

```bash
pnpm db:local      # 终端 A：启动本地 PostgreSQL（数据保存在 apps/api/.localdb）
```

**方式 B：使用托管数据库**（Neon / Supabase 等）

在控制台创建数据库后，把连接串填入 `apps/api/.env` 的 `DATABASE_URL`。

### 3. 配置环境变量

```bash
cp apps/api/.env.example apps/api/.env   # 后端
cp apps/web/.env.example apps/web/.env   # 前端
```

使用方式 A 时，`apps/api/.env` 中的默认连接串即可直接使用：

```
DATABASE_URL=postgresql://campus:campus@localhost:5433/campus_market?schema=public
```

### 4. 初始化数据库

```bash
pnpm build            # 首次需要先构建共享包
pnpm db:migrate       # 应用迁移
pnpm db:seed          # 写入分类与演示账号（可重复执行）
```

### 5. 启动

```bash
pnpm dev:api          # 后端：http://localhost:3000
pnpm dev              # 前端：http://localhost:5173
```

两个命令分别在两个终端里运行。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动前端开发服务器（5173） |
| `pnpm dev:api` | 启动后端开发服务器（3000，带热重载） |
| `pnpm build` | 构建共享包 + 前端 + 后端 |
| `pnpm typecheck` | 全部包类型检查 |
| `pnpm db:local` | 启动本地 PostgreSQL（5433） |
| `pnpm db:migrate` | 创建并应用迁移 |
| `pnpm db:deploy` | 仅应用已有迁移（生产环境用） |
| `pnpm db:seed` | 写入种子数据 |
| `pnpm db:reset` | 清空并重建数据库（会丢数据） |
| `pnpm db:studio` | 打开 Prisma Studio 可视化查看数据 |

> 如果环境里没有全局 `pnpm`，可以用 `corepack enable` 启用，
> 或直接调用任意可用的 pnpm 可执行文件，例如
> `node <pnpm 路径>/bin/pnpm.cjs install`。

## 环境变量

环境变量按应用分开放置，各自有对应的示例文件（`.env` 已被 `.gitignore` 忽略，不会提交）：

| 文件 | 用途 | 关键变量 |
| --- | --- | --- |
| `apps/api/.env` | 后端 | `DATABASE_URL`、`PORT`、`LOG_LEVEL` |
| `apps/web/.env` | 前端 | `VITE_USE_MOCK`、`VITE_API_BASE_URL` |

后端启动时会校验环境变量，缺少必需项会立即退出并打印可读的错误清单，
而不是带着半截配置跑起来、在某个请求上才崩掉。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务与依赖状态。数据库正常返回 200，不可用返回 503 |

响应示例：

```json
{
  "status": "ok",
  "environment": "development",
  "uptimeSeconds": 12,
  "timestamp": "2026-09-14T07:49:56.611Z",
  "checks": { "database": { "status": "up", "latencyMs": 4 } }
}
```

错误响应统一为 `{ "error": { "code": "...", "message": "...", "details": [] } }`。

## 演示账号

由 `pnpm db:seed` 写入：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 学生用户 | `demo@campus.edu` | `demo1234` |
| 管理员 | `admin@campus.edu` | `admin1234` |

前端登录页提供「一键填入演示账号」，Phase 3 接入真实接口后即可用它们登录。

## 本地验证

**前端**：用一个 Playwright 脚本走完整流程并检查控制台错误（需要先启动 `pnpm dev`）。

```bash
node work/smoke.mjs
```

脚本会依次验证首页、列表筛选、搜索、空状态、接口错误与重试、详情页、未登录拦截、
登录回跳、收藏、发布（含图片上传与表单校验）、状态管理、用户中心、404，
并在 375px 宽度下复查移动端是否存在横向溢出。截图输出在 `work/shots/`。

**后端**：

```bash
curl http://localhost:3000/api/health
```

数据库不可用时该接口返回 503，并在 `checks.database.error` 中给出原因（例如 `ECONNREFUSED`）。

另外两个便于手工测试的入口：

- 访问 `/items?mockError=1` 可以触发一次接口失败，用来检查错误提示与「重试」按钮
- 用户中心底部提供「重置演示数据」，可清空前端本地数据回到初始状态

## 设计约定

- **颜色、间距、圆角、阴影只在 `styles/tokens.css` 中定义**，组件内通过 `var()` 引用，不写死具体数值。
- **每个数据页面都必须实现四种状态**：加载中、空数据、请求失败、有数据。
- **接口层与页面解耦**：页面只调用 `src/api/` 里的函数，Phase 3 替换实现时页面代码不需要改动。
- **错误处理集中在一处**：Express 5 会自动把 async 处理函数中抛出的异常转发到统一的错误中间件，
  因此业务代码里不需要写 try/catch 包裹。
- **价格一律以「分」为单位的整数存储**，避免浮点误差。
- **迁移文件纳入版本控制**：数据库结构的每一次变更都有可回滚的记录。

## 已知限制（当前阶段）

- 前端仍使用本地 Mock 数据，尚未接入真实接口（Phase 3 完成）。
- 除 `/api/health` 外的业务接口尚未实现（Phase 2.2 起陆续补齐）。
- 本地开发数据库的 PostgreSQL 二进制来自 `embedded-postgres` 的 beta 版本，
  仅用于开发；生产环境请使用托管数据库。

## 下一阶段

Phase 2.2 实现认证模块：注册、登录、JWT 签发与校验、鉴权中间件，
以及密码的 bcrypt 哈希存储。验收标准是弱密码与重复邮箱被拒、
数据库中不出现明文密码、无 token 访问受保护接口返回 401。
