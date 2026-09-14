import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

/**
 * 环境变量是应用启动的第一道防线：配置不对就应该立刻退出，
 * 而不是带着半截配置跑起来、在某个请求上才崩掉。
 */

function loadDotEnv(): void {
  /*
   * 按模块位置而不是当前工作目录去找 .env。
   *
   * 开发环境 `pnpm --filter @campus/api dev` 的 cwd 是 apps/api，
   * 但生产环境启动命令是 `node apps/api/dist/index.js`，cwd 是仓库根，
   * 用 cwd 会找不到文件、误以为「生产环境没有 .env」。
   * src/config 与 dist/config 相对 apps/api 的层级相同，所以两种模式都能命中。
   *
   * 已存在的进程环境变量优先级更高，不会被文件覆盖——
   * 生产环境由部署平台注入变量，这里的 .env 只服务于本地。
   */
  const packageEnvPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '.env'
  )

  try {
    process.loadEnvFile(existsSync(packageEnvPath) ? packageEnvPath : undefined)
  } catch {
    /* 没有 .env 文件时忽略 */
  }
}

loadDotEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z
    .string({ error: '缺少 JWT_SECRET（未在环境变量或 apps/api/.env 中找到）' })
    .min(32, 'JWT_SECRET 至少需要 32 个字符，可用 openssl rand -base64 48 生成'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // ---------- 图片存储 ----------
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  /** 本地驱动的落盘目录，相对 apps/api */
  STORAGE_LOCAL_DIR: z.string().default('uploads'),
  /** 静态资源对外前缀，必须与本地驱动写入位置一致 */
  STORAGE_PUBLIC_PATH: z.string().startsWith('/', '必须以 / 开头').default('/uploads'),
  /** 对外可访问的站点地址。留空则返回相对路径，适合同源部署 */
  PUBLIC_BASE_URL: z.string().default(''),
  /** 单张图片大小上限（字节） */
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),

  // ---------- 生产环境静态资源托管 ----------
  /** 前端产物目录，相对仓库根。生产环境由后端同源托管 */
  WEB_DIST_DIR: z.string().default('apps/web/dist'),
  ADMIN_DIST_DIR: z.string().default('apps/admin/dist'),

  // ---------- S3 兼容对象存储（STORAGE_DRIVER=s3 时必填） ----------
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** 图片公开访问前缀，例如 https://xxx.supabase.co/storage/v1/object/public/campus-market */
  S3_PUBLIC_BASE_URL: z.string().optional(),

  DATABASE_URL: z
    .string({ error: '缺少 DATABASE_URL（未在环境变量或 apps/api/.env 中找到）' })
    .min(1, 'DATABASE_URL 不能为空')
    .refine((value) => value.startsWith('postgres'), 'DATABASE_URL 必须是 PostgreSQL 连接串'),
  /** 数据库连接池上限。部署到小规格实例时需要调小 */
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10)
})

/**
 * 选了 s3 驱动就必须把凭据配全。
 * 与其等到用户上传第一张图时才报错，不如启动时直接失败——
 * 部署阶段发现总比上线之后发现好。
 */
const S3_REQUIRED_KEYS = [
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_PUBLIC_BASE_URL'
] as const

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`
  )
  console.error(
    `\n[config] 环境变量校验失败：\n${lines.join('\n')}\n\n` +
      '请复制 apps/api/.env.example 为 apps/api/.env 并补全配置后重试。\n'
  )
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'

if (env.STORAGE_DRIVER === 's3') {
  const missing = S3_REQUIRED_KEYS.filter((key) => !env[key])
  if (missing.length > 0) {
    console.error(
      `\n[config] STORAGE_DRIVER=s3 时以下变量必须配置：\n${missing
        .map((key) => `  - ${key}`)
        .join('\n')}\n\n请参考 apps/api/.env.example 补全后重试。\n`
    )
    process.exit(1)
  }
}
