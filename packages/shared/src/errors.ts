/** 统一错误码。后端返回 code，前端据此展示文案或做特殊处理。 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/** 业务异常：携带错误码，方便前端区分处理 */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  /** 附加信息，例如字段级校验失败清单 */
  readonly details: unknown

  constructor(code: ErrorCode, message: string, status = 400, details: unknown = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
  }
}
