import { AppError } from '@campus/shared'

/** 判断异常是否是后端返回的业务错误 */

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/** 把任意异常转换成可以直接展示给用户的中文文案 */
export function toErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (isAppError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
