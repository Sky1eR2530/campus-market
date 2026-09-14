import { AppError } from '@campus/shared'
import type { AuthResult, LoginPayload, RegisterPayload } from '@campus/shared'
import { signAccessToken } from '../../lib/jwt.js'
import { hashPassword, verifyPassword } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import type { User } from '../../generated/prisma/client.js'
import { toCurrentUser } from '../users/user.mapper.js'

/** 邮箱统一小写存储，保证大小写不敏感的唯一性 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Prisma 的唯一约束冲突。用 code 判断，避免依赖具体错误类 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

async function issueAuthResult(user: User): Promise<AuthResult> {
  const token = await signAccessToken({ sub: user.id, role: user.role })
  return { token, user: toCurrentUser(user) }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const email = normalizeEmail(payload.email)

  // 先查一次是为了给出友好的 409，而不是让用户等到 bcrypt 算完才报错
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    throw new AppError('EMAIL_TAKEN', '该邮箱已注册，请直接登录', 409)
  }

  const passwordHash = await hashPassword(payload.password)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: payload.nickname.trim(),
        role: 'user',
        status: 'active'
      }
    })
    return await issueAuthResult(user)
  } catch (error) {
    // 并发注册同一个邮箱时，上面的查询可能同时通过，
    // 最终由数据库唯一约束兜底，这里把它翻译成同样的业务错误
    if (isUniqueConstraintError(error)) {
      throw new AppError('EMAIL_TAKEN', '该邮箱已注册，请直接登录', 409)
    }
    throw error
  }
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const email = normalizeEmail(payload.email)
  const user = await prisma.user.findUnique({ where: { email } })

  // 「邮箱不存在」和「密码错误」返回完全相同的提示，
  // 避免攻击者借此枚举出平台上有哪些邮箱注册过
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    throw new AppError('INVALID_CREDENTIALS', '邮箱或密码不正确', 401)
  }

  if (user.status === 'banned') {
    throw new AppError('ACCOUNT_BANNED', '该账号已被封禁，如有疑问请联系管理员', 403)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  return await issueAuthResult(updated)
}
