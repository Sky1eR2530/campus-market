import { PrismaPg } from '@prisma/adapter-pg'
import { env, isDevelopment } from '../config/env.js'
import { PrismaClient } from '../generated/prisma/client.js'

/**
 * Prisma 7 的直连方式：连接串不写在 schema 里，而是交给 driver adapter。
 * 换数据库或接入连接池（如 Neon 的 pooler）时只需要在这里调整。
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: isDevelopment ? ['warn', 'error'] : ['error']
})

export interface DatabaseStatus {
  status: 'up' | 'down'
  latencyMs: number
  error?: string
}

/**
 * 健康检查必须有超时兜底。
 * 如果数据库主机不响应（而不是明确拒绝），没有超时的探测会一直挂着，
 * 探针超时反而比探测失败更难排查。
 */
const DB_CHECK_TIMEOUT_MS = 3000

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`数据库响应超时（${timeoutMs}ms）`)),
      timeoutMs
    )
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    )
  })
}

/**
 * 提取对排查真正有用的信息。
 * Prisma 在驱动适配器出错时会把底层原因放在 error.code（例如 ECONNREFUSED），
 * 而 message 只剩一句没有信息量的「Invalid prisma.$queryRaw() invocation」。
 * 健康检查里报 ECONNREFUSED 远比报那句话有用。
 */
const GENERIC_PRISMA_MESSAGE = /^Invalid `prisma\.[\w$]+\(\)` invocation:?$/

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  const record = error as Error & { code?: unknown; meta?: unknown; cause?: unknown }
  const parts: string[] = []

  if (typeof record.code === 'string' && record.code) parts.push(record.code)

  const message = record.message.replace(/\s+/g, ' ').trim()
  if (message && !GENERIC_PRISMA_MESSAGE.test(message)) parts.push(message)

  // 驱动适配器有时把底层错误挂在 meta 上
  if (record.meta && typeof record.meta === 'object') {
    const meta = record.meta as Record<string, unknown>
    const detail = typeof meta.message === 'string' ? meta.message : ''
    if (detail && !message.includes(detail)) parts.push(detail)
  }

  let cause: unknown = record.cause
  for (let depth = 0; cause instanceof Error && depth < 3; depth += 1) {
    const causeMessage = cause.message.replace(/\s+/g, ' ').trim()
    if (causeMessage && !parts.includes(causeMessage)) parts.push(causeMessage)
    cause = (cause as Error & { cause?: unknown }).cause
  }

  return parts.join(' | ') || error.name
}

/** 健康检查用的连通性探测。失败不抛异常，而是把结果交给调用方决定如何响应 */
export async function checkDatabase(): Promise<DatabaseStatus> {
  const startedAt = performance.now()
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_CHECK_TIMEOUT_MS)
    return { status: 'up', latencyMs: Math.round(performance.now() - startedAt) }
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Math.round(performance.now() - startedAt),
      error: describeError(error)
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
