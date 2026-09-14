import { AppError } from '@campus/shared'
import type { ZodError, ZodType } from 'zod'

export interface FieldIssue {
  field: string
  message: string
}

/** 把 Zod 的错误列表转成前端可以直接按字段消费的结构 */
export function toFieldIssues(error: ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_',
    message: issue.message
  }))
}

/**
 * 校验并取出输入。
 * 用于查询参数这类不方便用中间件替换的场景（Express 5 的 req.query 是只读的）。
 */
export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new AppError('VALIDATION_FAILED', '请求参数校验失败', 422, toFieldIssues(result.error))
  }
  return result.data
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * 路径参数里的资源 id。
 * 格式不合法时按「资源不存在」处理：直接把非 uuid 字符串交给数据库会抛出
 * 数据层错误，最终变成 500，而这本质上只是一个无效链接。
 */
export function parseUuidParam(value: unknown, notFoundMessage: string): string {
  const raw = typeof value === 'string' ? value : ''
  if (!UUID_PATTERN.test(raw)) {
    throw new AppError('NOT_FOUND', notFoundMessage, 404)
  }
  return raw
}
