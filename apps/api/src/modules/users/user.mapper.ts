import type { CurrentUser, PublicUser, SellerProfile } from '@campus/shared'
import type { User } from '../../generated/prisma/client.js'

/**
 * 数据库记录 → 对外返回的结构。
 * 集中在一处，确保 passwordHash、status 这些内部字段永远不会被顺手返回出去。
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    school: user.school,
    campus: user.campus,
    bio: user.bio,
    createdAt: user.createdAt.toISOString()
  }
}

/** 当前登录用户本人可见的信息（含邮箱与联系方式） */
export function toCurrentUser(user: User): CurrentUser {
  return {
    ...toPublicUser(user),
    email: user.email,
    role: user.role,
    status: user.status,
    contact: user.contact
  }
}

/**
 * 他人可见的卖家信息。
 * 联系方式只对已登录用户返回：未登录时后端不返回该字段，而不是靠前端隐藏。
 */
export function toSellerProfile(
  user: User,
  counts: { itemCount: number; onSaleCount: number },
  includeContact: boolean
): SellerProfile {
  return {
    ...toPublicUser(user),
    contact: includeContact ? user.contact : null,
    itemCount: counts.itemCount,
    onSaleCount: counts.onSaleCount
  }
}
