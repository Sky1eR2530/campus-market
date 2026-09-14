import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 读取 apps/api/.env。
 * Node 的 loadEnvFile 不会覆盖已存在的环境变量，因此测试进程里
 * 由 vitest 注入的配置（指向测试库）始终优先于 .env 中的开发配置。
 */
export function loadDotEnvFile(): void {
  const envPath = path.join(apiDir, '.env')
  if (!existsSync(envPath)) return
  try {
    process.loadEnvFile(envPath)
  } catch {
    /* 没有 .env 时忽略，依赖外部注入 */
  }
}

interface ParsedDatabaseUrl {
  prefix: string
  database: string
  suffix: string
}

/** 不依赖 URL 解析器，避免它对非标准协议的处理差异 */
function parseDatabaseUrl(url: string): ParsedDatabaseUrl {
  const match = /^([^?]*\/)([^/?]+)(\?.*)?$/.exec(url)
  if (!match) {
    throw new Error(`无法解析数据库连接串（应形如 postgresql://user:pass@host:5432/dbname）：${url}`)
  }
  return { prefix: match[1], database: match[2], suffix: match[3] ?? '' }
}

function withDatabase(url: string, database: string): string {
  const { prefix, suffix } = parseDatabaseUrl(url)
  return `${prefix}${database}${suffix}`
}

export interface TestDatabaseConfig {
  /** 测试库连接串 */
  url: string
  /** 维护库（postgres）连接串，用于创建测试库 */
  maintenanceUrl: string
  databaseName: string
}

/**
 * 测试库默认由 DATABASE_URL 派生（campus_market → campus_market_test），
 * 避免测试把开发数据清空。也可以用 TEST_DATABASE_URL 显式指定一个库。
 */
export function resolveTestDatabase(): TestDatabaseConfig {
  loadDotEnvFile()

  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  if (!base) {
    throw new Error('未找到 DATABASE_URL，无法准备测试数据库。请先按 apps/api/.env.example 配置')
  }

  const databaseName = process.env.TEST_DATABASE_URL
    ? parseDatabaseUrl(base).database
    : `${parseDatabaseUrl(base).database}_test`

  return {
    url: process.env.TEST_DATABASE_URL ? base : withDatabase(base, databaseName),
    maintenanceUrl: withDatabase(base, 'postgres'),
    databaseName
  }
}
