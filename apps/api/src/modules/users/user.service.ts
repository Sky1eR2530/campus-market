import { AppError } from '@campus/shared'
import type {
  CurrentUser,
  MyStats,
  SellerProfile,
  UpdateProfilePayloadValues
} from '@campus/shared'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import { toCurrentUser, toSellerProfile } from './user.mapper.js'

export interface SellerStats {
  itemCount: number
  onSaleCount: number
}

/**
 * 卖家维度的商品统计。
 * 用一次聚合查询覆盖多个卖家，避免逐条统计造成 N+1。
 */
export async function loadSellerStats(
  sellerIds: string[]
): Promise<Map<string, SellerStats>> {
  const stats = new Map<string, SellerStats>()
  if (sellerIds.length === 0) return stats

  const rows = await prisma.item.groupBy({
    by: ['sellerId', 'status'],
    where: { sellerId: { in: sellerIds }, deletedAt: null },
    _count: { _all: true }
  })

  for (const row of rows) {
    const current = stats.get(row.sellerId) ?? { itemCount: 0, onSaleCount: 0 }
    current.itemCount += row._count._all
    if (row.status === 'on_sale') current.onSaleCount += row._count._all
    stats.set(row.sellerId, current)
  }

  return stats
}

/** 空字符串按「清空该字段」处理，避免库里出现 '' 与 null 两种空值 */
function normalizeOptional(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export async function updateMyProfile(
  userId: string,
  payload: UpdateProfilePayloadValues
): Promise<CurrentUser> {
  const data: Prisma.UserUpdateInput = {}

  if (payload.nickname !== undefined) data.nickname = payload.nickname

  const school = normalizeOptional(payload.school)
  const campus = normalizeOptional(payload.campus)
  const contact = normalizeOptional(payload.contact)
  const bio = normalizeOptional(payload.bio)

  if (school !== undefined) data.school = school
  if (campus !== undefined) data.campus = campus
  if (contact !== undefined) data.contact = contact
  if (bio !== undefined) data.bio = bio

  const updated = await prisma.user.update({ where: { id: userId }, data })

  // 商品的学校/校区是发布时从卖家复制的快照，卖家改了资料要同步过去，
  // 否则「同校筛选」会用到过期的信息
  if (school !== undefined || campus !== undefined) {
    await prisma.item.updateMany({
      where: { sellerId: userId, deletedAt: null },
      data: {
        ...(school !== undefined ? { school } : {}),
        ...(campus !== undefined ? { campus } : {})
      }
    })
  }

  return toCurrentUser(updated)
}

export async function getSellerProfile(
  userId: string,
  viewerId: string | null
): Promise<SellerProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  // 被封禁的账号等同于不存在，不对外暴露其状态
  if (!user || user.status === 'banned') {
    throw new AppError('NOT_FOUND', '该用户不存在', 404)
  }

  const stats = await loadSellerStats([userId])
  return toSellerProfile(
    user,
    stats.get(userId) ?? { itemCount: 0, onSaleCount: 0 },
    // 联系方式只对已登录用户返回
    Boolean(viewerId)
  )
}

/**
 * 当前用户的发布与收藏概览，供用户中心展示。
 * 用一次 groupBy 拿到各状态数量，避免为每个状态单独发一次 count 查询。
 */
export async function getMyStats(userId: string): Promise<MyStats> {
  const [grouped, favorites] = await Promise.all([
    prisma.item.groupBy({
      by: ['status'],
      where: { sellerId: userId, deletedAt: null },
      _count: { _all: true }
    }),
    prisma.favorite.count({ where: { userId } })
  ])

  const countByStatus = new Map(grouped.map((row) => [row.status, row._count._all]))
  const onSale = countByStatus.get('on_sale') ?? 0
  const sold = countByStatus.get('sold') ?? 0
  const offShelf = countByStatus.get('off_shelf') ?? 0

  return {
    published: onSale + sold + offShelf,
    onSale,
    sold,
    offShelf,
    favorites
  }
}
