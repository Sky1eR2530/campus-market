# 校园淘 · 校园闲置与生活信息服务平台

面向在校学生的闲置物品信息平台。第一阶段聚焦一条完整闭环：**发布 → 浏览 → 搜索 → 详情 → 收藏 → 状态管理**。

项目按阶段推进，每个阶段都要求「可运行、可验证」，而不是一次性堆完代码。

## 当前进度

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| Phase 0 | 项目规划（产品、数据模型、架构、阶段计划） | 已完成 |
| Phase 1 | 前端 UI / MVP 页面（Mock 数据） | 已完成 |
| Phase 2 | 后端 API 与数据库 | 已完成 |
| 2.1 | 工程骨架、环境变量校验、Prisma 模型、迁移、种子数据、健康检查 | 已完成 |
| 2.2 | 认证模块（注册 / 登录 / JWT / 鉴权中间件 / 接口测试） | 已完成 |
| 2.3 | 分类与商品接口、状态机、中文搜索 | 已完成 |
| 2.4 | 图片上传与存储抽象层 | 已完成 |
| 2.5 | 收藏与用户资料 | 已完成 |
| 2.6 | 接口层测试 | 已完成（88 个用例） |
| Phase 3 | 前后端联调（Mock 替换为真实接口） | 已完成 |
| Phase 4 | 管理后台（用户 / 商品 / 分类管理 + 操作日志） | 已完成 |
| Phase 5 | 测试与优化（边界用例 / 性能基线 / 可访问性 / 安全加固） | 已完成 |
| Phase 6 | 部署上线 | 待开始 |
| Phase 7 | 真实用户测试与迭代 | 待开始 |

完整的产品与架构设计见 [docs/phase-0-plan.md](docs/phase-0-plan.md)。

## 技术栈

- **前端**：Vue 3 + Vite + Vue Router + Pinia + Axios + TypeScript
- **后端**：Express 5 + TypeScript，分层结构（router → controller → service → repository）
- **数据库**：PostgreSQL + Prisma 7（driver adapter 直连）
- **校验**：Zod，规则定义在共享包中，前后端复用同一份 schema
- **样式**：原生 CSS + 设计令牌（CSS 变量），自研基础组件，不引入重型 UI 库
- **包管理**：pnpm workspace（monorepo）

仓库里有三个应用与三个共享包：

| 包 | 说明 |
| --- | --- |
| `apps/web` | 学生端 SPA |
| `apps/admin` | 管理后台 SPA |
| `apps/api` | 后端服务 |
| `packages/shared` | 前后端共享的类型、常量、校验规则与格式化函数 |
| `packages/api-client` | HTTP 客户端与接口封装，被两个前端共用 |
| `packages/ui` | 设计令牌、基础样式与基础组件，被两个前端共用 |

## 目录结构

```
.
├─ apps/
│  ├─ web/                     # 学生端 SPA
│  │  └─ src/
│  │     ├─ api/               # 接口层：HTTP 客户端、令牌存储、各模块接口封装
│  │     ├─ config/            # 前端常量（如演示账号提示）
│  │     ├─ components/        # ui（基础组件）/ business（业务组件）/ layout（布局）
│  │     ├─ composables/       # 可复用逻辑（异步状态、收藏交互、页面标题…）
│  │     ├─ layouts/           # 页面布局（默认布局、用户中心、登录注册）
│  │     ├─ router/            # 路由与访问守卫
│  │     ├─ stores/            # Pinia 状态（登录态、收藏、全局提示）
│  │     ├─ styles/            # 设计令牌与全局样式
│  │     ├─ utils/             # 格式化、校验、图片处理等
│  │     └─ views/             # 页面
│  ├─ admin/                   # 管理后台 SPA
│  │  └─ src/
│  │     ├─ components/        # 后台专用组件（提示条、分页）
│  │     ├─ composables/       # 列表加载与分页
│  │     ├─ layouts/           # 侧边栏布局
│  │     ├─ router/            # 路由与管理员守卫
│  │     ├─ stores/            # 登录态与提示
│  │     ├─ styles/            # 后台专属样式（表格、工具条）
│  │     └─ views/             # 概览 / 用户 / 商品 / 分类 / 日志
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
│  ├─ shared/                  # 共享类型、常量、校验规则与格式化（构建到 dist 后供各方消费）
│  ├─ api-client/              # 共享 HTTP 客户端与接口封装
│  └─ ui/                      # 共享设计令牌、基础样式与基础组件
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
pnpm dev:admin        # 管理后台：http://localhost:5174
```

三个命令分别在不同终端里运行。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动前端开发服务器（5173） |
| `pnpm dev:admin` | 启动管理后台开发服务器（5174） |
| `pnpm dev:api` | 启动后端开发服务器（3000，带热重载） |
| `pnpm build` | 构建共享包 + 前端 + 后端 |
| `pnpm typecheck` | 全部包类型检查 |
| `pnpm db:local` | 启动本地 PostgreSQL（5433） |
| `pnpm db:migrate` | 创建并应用迁移 |
| `pnpm db:deploy` | 仅应用已有迁移（生产环境用） |
| `pnpm db:seed` | 写入种子数据 |
| `pnpm db:reset` | 清空并重建数据库（会丢数据） |
| `pnpm db:studio` | 打开 Prisma Studio 可视化查看数据 |
| `pnpm verify:api` | 对运行中的 API 做完整链路冒烟（需先启动后端） |
| `pnpm smoke:web` | 学生端端到端冒烟（需先启动前端与后端） |
| `pnpm smoke:admin` | 管理后台端到端冒烟（需先启动管理端与后端） |
| `pnpm bench` | 接口耗时基准与索引命中检查（需先启动后端） |
| `pnpm a11y` | 可访问性审计（axe-core 扫描两端主要页面） |
| `pnpm db:cleanup-demo` | 清理测试痕迹，把开发库恢复到种子状态 |

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
| POST | `/api/auth/register` | 注册并直接登录，返回 token |
| POST | `/api/auth/login` | 登录，返回 token |
| GET | `/api/auth/me` | 获取当前登录用户（需要 `Authorization: Bearer <token>`） |
| POST | `/api/auth/logout` | 登出，返回 204 |
| GET | `/api/categories` | 分类列表，含各分类的在售数量 |
| GET | `/api/items` | 商品列表，支持 `q`、`category`、`sort`、`status`、`sellerId`、`page`、`pageSize` |
| GET | `/api/items/:id` | 商品详情，浏览量自增 |
| POST | `/api/items` | 发布商品 |
| PATCH | `/api/items/:id` | 编辑商品（仅发布者本人） |
| PATCH | `/api/items/:id/status` | 修改商品状态：在售 / 已售 / 下架（仅本人） |
| DELETE | `/api/items/:id` | 软删除商品（仅本人） |
| POST | `/api/uploads/images` | 上传商品图片（multipart，字段名 `file`） |
| POST | `/api/favorites/:itemId` | 收藏商品（幂等） |
| DELETE | `/api/favorites/:itemId` | 取消收藏（幂等） |
| GET | `/api/favorites` | 我的收藏列表 |
| GET | `/api/favorites/ids` | 我的收藏 id 列表，供前端标记爱心状态 |
| PATCH | `/api/users/me` | 编辑个人资料 |
| GET | `/api/users/:id` | 卖家主页信息与商品统计 |
| GET | `/api/users/me/stats` | 当前用户的发布与收藏概览 |

### 管理后台接口

以下接口都要求登录且角色为 `admin`。前端隐藏入口只是体验层，权限判断在服务端。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/stats` | 平台概览 |
| GET | `/api/admin/users` | 用户列表（搜索、状态筛选、分页） |
| PATCH | `/api/admin/users/:id/status` | 封禁 / 解封，可带原因 |
| GET | `/api/admin/items` | 商品列表（搜索、状态与分类筛选、可查看已删除） |
| PATCH | `/api/admin/items/:id/status` | 下架 / 恢复，可带原因 |
| DELETE | `/api/admin/items/:id` | 软删除商品 |
| GET | `/api/admin/categories` | 全部分类（含已停用） |
| POST | `/api/admin/categories` | 新增分类 |
| PATCH | `/api/admin/categories/:id` | 修改分类 |
| DELETE | `/api/admin/categories/:id` | 删除分类（分类下有商品时拒绝） |
| GET | `/api/admin/actions` | 操作日志 |

所有写操作都会写入 `admin_actions` 表，记录操作人、对象、动作与原因，可追溯。

标注「可选」的公开接口使用可选鉴权：未登录正常返回内容，已登录时额外返回
「我是否收藏了它」以及卖家联系方式。

成功响应统一为 `{ "data": ... }`，错误响应统一为
`{ "error": { "code": "...", "message": "...", "details": [] } }`。

`GET /api/health` 响应示例：

```json
{
  "status": "ok",
  "environment": "development",
  "uptimeSeconds": 12,
  "timestamp": "2026-09-14T07:49:56.611Z",
  "checks": { "database": { "status": "up", "latencyMs": 4 } }
}
```

`POST /api/auth/register` 请求示例：

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@campus.edu","nickname":"你的昵称","password":"campus1234"}'
```

### 认证状态码约定

| 状态码 | 场景 |
| --- | --- |
| 200 / 201 | 成功 |
| 401 | 未登录、token 无效或过期、邮箱或密码错误 |
| 403 | 账号被封禁 |
| 409 | 邮箱已被注册 |
| 422 | 请求参数校验失败，`details` 中给出具体字段 |

出于安全考虑，「邮箱不存在」与「密码错误」返回完全相同的状态码与消息，
避免攻击者借此枚举平台上注册过哪些邮箱。

## 演示账号

由 `pnpm db:seed` 写入：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 学生用户 | `demo@campus.edu` | `demo1234` |
| 管理员 | `admin@campus.edu` | `admin1234`（用于登录管理后台 5174） |

前端登录页提供「一键填入演示账号」，Phase 3 接入真实接口后即可用它们登录。
管理后台的登录页同样提供一键填入。

## 本地验证

**前端**：用一个 Playwright 脚本走完整流程并检查控制台错误（需要先启动 `pnpm dev`）。

```bash
node work/smoke.mjs
```

打的是真实前后端，因此需要后端与数据库都已启动、并执行过 `pnpm db:seed`。

脚本会依次验证首页、列表筛选、搜索、空状态、接口不可用时的错误态与重试、
商品不存在的空状态、详情页、未登录拦截、登录回跳、收藏、发布（含真实图片上传与
表单校验）、状态管理、用户中心、资料编辑、404，并在 375px 宽度下复查移动端。
截图输出在 `work/shots/`；重复执行不会污染种子数据（结束时自动复原）。

**后端**：

```bash
curl http://localhost:3000/api/health
```

数据库不可用时该接口返回 503，并在 `checks.database.error` 中给出原因（例如 `ECONNREFUSED`）。

**管理后台**：另一个 Playwright 脚本，覆盖登录拦截、权限拒绝、用户封禁 / 解封、
商品下架 / 恢复、分类增删与操作日志（需要先启动 `pnpm dev:admin`）。

```bash
node work/smoke-admin.mjs
```

另外，`pnpm verify:api` 会针对运行中的后端做一次完整链路冒烟，
覆盖静态资源托管等前端测试碰不到的环节。

## 设计约定

- **颜色、间距、圆角、阴影只在 `styles/tokens.css` 中定义**，组件内通过 `var()` 引用，不写死具体数值。
- **每个数据页面都必须实现四种状态**：加载中、空数据、请求失败、有数据。
- **接口层与页面解耦**：页面只调用 `src/api/` 里的函数，Phase 3 替换实现时页面代码不需要改动。
- **错误处理集中在一处**：Express 5 会自动把 async 处理函数中抛出的异常转发到统一的错误中间件，
  因此业务代码里不需要写 try/catch 包裹。
- **价格一律以「分」为单位的整数存储**，避免浮点误差。
- **迁移文件纳入版本控制**：数据库结构的每一次变更都有可回滚的记录。
- **中文搜索用 `pg_trgm` + GIN 索引**：PostgreSQL 默认的全文检索分词器对中文基本无效，
  因此改用三元组索引加速 `ILIKE '%关键词%'`（见 `migrations/*_add_trgm_search_index`）。
- **计数器用原生 SQL 维护**：浏览量和收藏数的自增走 `$executeRaw`，
  避免 Prisma 的 `update` 连带刷新 `updated_at`，让商品仅因为被浏览就看起来「刚更新过」。

## 图片存储

上传逻辑只依赖 `src/lib/storage/types.ts` 里的 `StorageAdapter` 接口，
当前提供本地磁盘驱动（`STORAGE_DRIVER=local`），文件落在 `apps/api/uploads/`，
通过 `/uploads/*` 以静态资源方式提供。

已经提供两个驱动，通过 `STORAGE_DRIVER` 切换：

| 值 | 存储位置 | 适用场景 |
| --- | --- | --- |
| `local` | `apps/api/uploads/`，由本服务经 `/uploads/*` 提供 | 本地开发 |
| `s3` | S3 兼容对象存储（Supabase Storage / Cloudflare R2 / OSS） | 生产环境 |

两个驱动实现同一个 `StorageAdapter` 接口（`save` / `remove` / `resolveKey`），
业务代码只依赖接口，切换存储不需要改动商品与上传模块。

> `STORAGE_DRIVER=s3` 时，缺少任意一项 S3 配置都会**在启动阶段直接失败并列出缺哪几项**，
> 而不是等到用户上传第一张图才报错。

商品提交的图片地址会被校验必须来自本平台存储，避免把服务当成任意外链的图床。

## 部署

生产环境采用**同源单服务**：同一个 Node 服务同时提供学生端、管理端与 API。
这样没有跨域预检、没有 Cookie 的 `SameSite` 限制，开发与生产行为一致，
对外也只有一个访问地址。

```
                    ┌──────────────────────────────────────────┐
   浏览器  ───────▶ │  Node 服务（Render）                      │
                    │  /api/*     → Express API                 │
                    │  /admin/*   → 管理端产物 + SPA fallback    │
                    │  /*         → 学生端产物 + SPA fallback    │
                    └──────────┬───────────────────┬───────────┘
                               │                   │
                    ┌──────────┴────────┐  ┌───────┴──────────┐
                    │ Neon PostgreSQL   │  │ 对象存储          │
                    └───────────────────┘  └──────────────────┘
```

### 平台与成本

| 用途 | 服务 | 免费额度（参考，以官网为准） | 费用 |
| --- | --- | --- | --- |
| 后端托管 | Render Web Service | 512MB / 750 实例小时每月 | ¥0 |
| 数据库 | Neon PostgreSQL | 0.5GB / 190 计算小时每月 | ¥0 |
| 图片存储 | Supabase Storage | 1GB / 5GB 出站 | ¥0 |
| 保活监控（可选） | UptimeRobot | 50 个监控项 | ¥0 |

选这三家的共同理由是**都不需要绑定信用卡**。
（Cloudflare R2 额度更大且出站免费，但开通要求绑定支付方式。）

⚠️ Render 免费实例闲置 15 分钟后休眠，下次访问需要 30–60 秒唤醒。
用 UptimeRobot 每 5 分钟访问一次 `/api/health` 可以保持常驻：
24 小时约消耗 730 实例小时，正好在 750 的免费额度内。

### 部署步骤

```bash
# 1. 本地构建并验证
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck

# 2. 生产环境执行数据库迁移与种子数据（DATABASE_URL 指向托管数据库）
pnpm db:deploy
pnpm db:seed

# 3. 平台侧配置
#    Build Command:  pnpm install --frozen-lockfile && pnpm build
#    Start Command:  pnpm start
#    Health Check:   /api/health
```

生产构建会自动把管理端打到 `/admin/` 子路径（见 `apps/admin/vite.config.ts`），
后端在 `NODE_ENV=production` 时接手托管两个前端产物。

### 生产环境变量

| 变量 | 说明 |
| --- | --- |
| `NODE_ENV` | 固定 `production` |
| `DATABASE_URL` | Neon 的连接串 |
| `JWT_SECRET` | 至少 32 字符的随机串 |
| `STORAGE_DRIVER` | 固定 `s3` |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | 对象存储凭据 |
| `S3_PUBLIC_BASE_URL` | 图片公开访问前缀 |
| `WEB_DIST_DIR` / `ADMIN_DIST_DIR` | 前端产物目录，默认即为构建输出路径 |

缺少必需项时服务会**启动失败并列出缺哪几项**，而不是带着半截配置跑起来。
完整清单见 `apps/api/.env.example`。

### 部署后验证

```bash
VERIFY_BASE_URL=https://你的域名/api pnpm verify:api
```

会走一遍注册、登录、上传图片、发布商品、搜索、收藏、改状态、删除的完整链路。

## 已知限制（当前阶段）

- 商品图片的宽高字段尚未写入（前端用固定宽高比占位，暂不需要）。
- **中文搜索的索引效果与关键词长度有关**：pg_trgm 三元组索引在关键词达到 3 个字符时才比较高效，
  「键盘」这类 2 字词会退化成顺序扫描。校园规模（数千件商品）下实测约 1.6ms，可以接受；
  数据量到十万级时需要重新评估（换 pg_bigm 或引入外部搜索）。
- 登录限流按「IP + 邮箱」计数，反复执行端到端测试可能把自己挡住，重启后端即可清零。
- 访问令牌存在 `localStorage`：实现简单、刷新不丢登录态，代价是 XSS 一旦发生令牌可被读取。
  彻底消除需要改成 httpOnly Cookie + 刷新令牌，依赖后端配合，安排在 Phase 5。
- 本地开发数据库的 PostgreSQL 二进制来自 `embedded-postgres` 的 beta 版本，
  仅用于开发；生产环境请使用托管数据库。

## 下一阶段

Phase 6 部署上线：把前端构建产物与 API 由同一个服务托管（同源部署），
数据库换成托管 PostgreSQL，图片接入对象存储，并在公网上完成一次完整的冒烟验证。

## 质量与安全

这一阶段的收口都在可重复执行的脚本里，不用靠记忆：

| 关注点 | 做法 | 结果 |
| --- | --- | --- |
| 边界与异常 | `pnpm --filter @campus/api test` | 150 个用例，覆盖超长输入、非法标识、空数据、并发、越权 |
| 接口性能 | `pnpm bench` | 全部接口 p95 < 20ms |
| 索引有效性 | `pnpm bench`（合成数据 + EXPLAIN） | 卖家维度查询命中索引；三元组索引配置正确 |
| 可访问性 | `pnpm a11y` | 18 个页面零 axe-core 违规 |
| 安全响应头 | helmet | CSP、nosniff、frame-ancestors 等 |
| 接口限流 | express-rate-limit | 登录按「IP + 邮箱」计 20 次/15 分钟；上传 300 次/小时；全局 3000 次/15 分钟 |

限流额度定得偏宽松是刻意的：校园网普遍是 NAT 共享出口 IP，
按 IP 收得太紧会让一个同学跑脚本把整栋楼的人一起挡住。

除自动化扫描外，还按 Web 界面规范逐条复核过一遍，修正了其中确实存在的问题：

| 问题 | 处理 |
| --- | --- |
| 顶部栏是 sticky，键盘 Tab 时焦点会被盖住 | `html` 上设置 `scroll-padding-top` 预留高度 |
| 后台行内输入框去掉了默认轮廓，却没有等价的焦点样式 | 补上焦点描边 |
| 发布表单填了一半误点返回会全部丢失 | 增加离开确认（路由守卫 + `beforeunload`） |
| 日期手工拼接，跨时区/跨语言行为不可控 | 改用 `Intl.DateTimeFormat`，formatter 缓存复用 |
| 移动端双击有缩放延迟 | 交互元素设置 `touch-action: manipulation` |
| 弹窗内滚动会带动背后页面 | `overscroll-behavior: contain` |
| 邮箱/密码输入框触发拼写检查 | 关闭 `spellcheck` |
| 品牌名可能被浏览器自动翻译 | `translate="no"` |
| 标题末行容易只剩一个字 | `text-wrap: balance` |
