import type { Response } from 'express'
import type { PaginationMeta } from '@campus/shared'

/**
 * 统一成功响应信封：{ data: ... }
 * 与 Phase 0 约定的接口格式一致，前端在 Phase 3 直接按这个结构解析。
 */
export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data })
}

/** 列表响应：数据与分页元信息分开，前端不需要自己推算总数 */
export function sendPage<T>(res: Response, items: T[], meta: PaginationMeta): void {
  res.status(200).json({ data: items, meta })
}
