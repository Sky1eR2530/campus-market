import { AppError } from '@campus/shared'
import type { RequestHandler } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'
import { toCurrentUser } from '../modules/users/user.mapper.js'

/** 从 `Authorization: Bearer <token>` 中取出 token */
function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, ...rest] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null
  const token = rest.join(' ').trim()
  return token || null
}

/**
 * 鉴权中间件。
 * 除了校验 token 本身，还会回查数据库确认账号仍然存在且未被封禁——
 * 否则一个已被封禁的用户在 token 过期前仍然可以正常操作。
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization)

  if (!token) {
    throw new AppError('UNAUTHORIZED', '请先登录后再进行该操作', 401)
  }

  const payload = await verifyAccessToken(token)
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })

  if (!user) {
    throw new AppError('UNAUTHORIZED', '登录状态已失效，请重新登录', 401)
  }

  if (user.status === 'banned') {
    throw new AppError('ACCOUNT_BANNED', '该账号已被封禁，如有疑问请联系管理员', 403)
  }

  req.user = toCurrentUser(user)
  next()
}
