import { AppError } from '@campus/shared'
import type { CurrentUser, Item as ItemDto, Paginated } from '@campus/shared'
import { prisma } from '../../lib/prisma.js'
import { resolvePageWindow } from '../../utils/pagination.js'
import { itemInclude } from '../items/item.mapper.js'
import { toItemDtos } from '../items/item.service.js'

/**
 * 收藏数在 items 表里是冗余字段。
 * 这里用原生 SQL 增减而不是走 Prisma 的 update：
 * Prisma 的 update 会连带刷新 updated_at，让商品仅因为被收藏就看起来「刚更新过」。
 */

export async function addFavorite(itemId: string, user: CurrentUser): Promise<void> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, deletedAt: null },
    select: { id: true, sellerId: true }
  })
  if (!item) throw new AppError('ITEM_NOT_FOUND', '商品不存在或已被删除', 404)
  if (item.sellerId === user.id) {
    throw new AppError('VALIDATION_FAILED', '不能收藏自己发布的商品', 422)
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.favorite.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
      select: { id: true }
    })
    // 幂等：重复收藏不报错，也不会把计数加两次
    if (existing) return

    await tx.favorite.create({ data: { userId: user.id, itemId } })
    await tx.$executeRaw`UPDATE items SET favorite_count = favorite_count + 1 WHERE id = ${itemId}::uuid`
  })
}

export async function removeFavorite(itemId: string, user: CurrentUser): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.favorite.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
      select: { id: true }
    })
    // 幂等：没收藏过也返回成功，计数不会被减成负数
    if (!existing) return

    await tx.favorite.delete({ where: { id: existing.id } })
    await tx.$executeRaw`UPDATE items SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = ${itemId}::uuid`
  })
}

export async function listFavoriteIds(user: CurrentUser): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { itemId: true }
  })
  return rows.map((row) => row.itemId)
}

export async function listFavorites(
  user: CurrentUser,
  page: number,
  pageSize: number
): Promise<Paginated<ItemDto>> {
  // 已下架的商品仍然出现在收藏列表里（方便回看），只有被删除的才隐藏
  const where = { userId: user.id, item: { deletedAt: null } }

  const total = await prisma.favorite.count({ where })
  const window = resolvePageWindow(page, pageSize, total)

  const rows = await prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: window.skip,
    take: window.take,
    include: { item: { include: itemInclude } }
  })

  return {
    data: await toItemDtos(
      rows.map((row) => row.item),
      user.id,
      false
    ),
    meta: {
      page: window.page,
      pageSize: window.pageSize,
      total,
      totalPages: window.totalPages
    }
  }
}
