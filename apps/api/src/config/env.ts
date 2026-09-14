import { z } from 'zod'

/**
 * 环境变量是应用启动的第一道防线：配置不对就应该立刻退出，
 * 而不是带着半截配置跑起来、在某个请求上才崩掉。
 */

function loadDotEnv(): void {
  // 开发环境需要读取 apps/api/.env；生产环境由部署平台注入环境变量，
  // 此时没有 .env 文件，loadEnvFile 会抛错，忽略即可。
  // 已存在的进程环境变量优先级更高，不会被文件覆盖。
  try {
    process.loadEnvFile()
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
  DATABASE_URL: z
    .string({ error: '缺少 DATABASE_URL（未在环境变量或 apps/api/.env 中找到）' })
    .min(1, 'DATABASE_URL 不能为空')
    .refine((value) => value.startsWith('postgres'), 'DATABASE_URL 必须是 PostgreSQL 连接串'),
  /** 数据库连接池上限。部署到小规格实例时需要调小 */
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10)
})

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
