import type { Response } from 'express'

/**
 * 统一成功响应信封：{ data: ... }
 * 与 Phase 0 约定的接口格式一致，前端在 Phase 3 直接按这个结构解析。
 */
export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data })
}
