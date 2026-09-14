import { AppError } from '@campus/shared'
import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { toFieldIssues } from '../utils/validation.js'

/**
 * 用 Zod schema 校验请求体。
 * schema 来自共享包，与前端表单用的是同一份规则，
 * 不会出现「前端通过、后端拒绝」这类不一致。
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      next(new AppError('VALIDATION_FAILED', '请求参数校验失败', 422, toFieldIssues(result.error)))
      return
    }

    req.body = result.data
    next()
  }
}
