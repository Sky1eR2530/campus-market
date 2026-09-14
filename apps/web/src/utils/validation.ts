import type { ZodType } from 'zod'

export interface ValidationResult {
  ok: boolean
  /** 字段名 → 第一条错误文案，与表单字段一一对应 */
  errors: Record<string, string>
}

/**
 * 用共享 schema 校验表单。
 * 只返回每个字段的第一条错误，避免一次抛出多条把用户淹没。
 */
export function validate<S extends ZodType>(schema: S, values: unknown): ValidationResult {
  const result = schema.safeParse(values)
  if (result.success) return { ok: true, errors: {} }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_'
    if (!errors[field]) errors[field] = issue.message
  }
  return { ok: false, errors }
}

/** 表单字段的通用错误展示状态：未触碰且未提交时不显示错误 */
export function shouldShowError(touched: boolean, submitted: boolean, message?: string): boolean {
  return Boolean(message) && (touched || submitted)
}
