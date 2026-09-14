import { AppError } from '@campus/shared'
import type { RequestHandler } from 'express'
import { requireUser } from './authenticate.js'

/**
 * 管理员权限校验。
 * 必须挂在 authenticate 之后使用——authenticate 负责确认身份，
 * 这里只负责判断这个身份有没有管理权限。
 *
 * 前端也会做一层路由守卫隐藏后台入口，但真正的权限判断只在服务端，
 * 否则任何人只要直接调用接口就能绕过。
 */
export const requireAdminRole: RequestHandler = (req, _res, next) => {
  const user = requireUser(req)

  if (user.role !== 'admin') {
    throw new AppError('FORBIDDEN', '需要管理员权限才能访问', 403)
  }

  next()
}
