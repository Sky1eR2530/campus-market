import { AppError } from '@campus/shared'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env.js'

const ISSUER = 'campus-market'
const AUDIENCE = 'campus-market-web'
const ALGORITHM = 'HS256'

const secretKey = new TextEncoder().encode(env.JWT_SECRET)

export interface AccessTokenPayload {
  /** 用户 id */
  sub: string
  role: 'user' | 'admin'
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(payload.sub)
    // 校验签发方与受众，避免同一个密钥被别的服务复用时 token 互相通用
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey)
}

/**
 * 校验 token。
 * 任何失败原因（过期、签名不对、格式错误）都统一抛 401，
 * 不向客户端区分具体原因，避免给攻击者提供额外信息。
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALGORITHM]
    })

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('token 缺少 subject')
    }

    return {
      sub: payload.sub,
      role: payload.role === 'admin' ? 'admin' : 'user'
    }
  } catch {
    throw new AppError('UNAUTHORIZED', '登录状态已失效，请重新登录', 401)
  }
}
