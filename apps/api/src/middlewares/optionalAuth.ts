import type { RequestHandler } from 'express'
import { extractBearerToken, verifyAccessToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'
import { toCurrentUser } from '../modules/users/user.mapper.js'

/**
 * 可选鉴权。
 *
 * 公开接口（商品列表、商品详情）需要在已登录时额外返回「我是否收藏了它」、
 * 卖家联系方式等信息，但未登录时也应该正常返回内容。
 * 因此这里识别身份但不强制要求，token 无效时按未登录处理。
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    next()
    return
  }

  try {
    const payload = await verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (user && user.status === 'active') {
      req.user = toCurrentUser(user)
    }
  } catch {
    /* 无效 token 按未登录处理，不阻断公开接口 */
  }

  next()
}
