import { AppError } from '@campus/shared'
import type { CurrentUser, Item as ItemDto, Paginated } from '@campus/shared'
import { prisma } from '../../lib/prisma.js'
import { resolvePageWindow } from '../../utils/pagination.js'
import { itemInclude } from '../items/item.mapper.js'
import { toItemDtos } from '../items/item.service.js'

/**
 * 收藏数在 items 表里是冗余字段。
 *
 * 两个实现细节：
 * 1. 用原生 SQL 增减而不是走 Prisma 的 update——后者会连带刷新 updated_at，
 *    让商品仅因为被收藏就看起来「刚更新过」。
 * 2. 插入与计数放在同一条语句里（CTE + ON CONFLICT）。
 *    先查再插的写法在并发下会两个请求都认为「还没收藏」，
 *    其中一个撞唯一约束直接报错；单条语句既幂等又没有竞态。
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

  await prisma.$executeRaw`
    WITH inserted AS (
      INSERT INTO favorites (id, user_id, item_id, created_at)
      VALUES (gen_random_uuid(), ${user.id}::uuid, ${itemId}::uuid, now())
      ON CONFLICT (user_id, item_id) DO NOTHING
      RETURNING 1
    )
    UPDATE items
    SET favorite_count = favorite_count + 1
    WHERE id = ${itemId}::uuid AND EXISTS (SELECT 1 FROM inserted)
  `
}

export async function removeFavorite(itemId: string, user: CurrentUser): Promise<void> {
  // 幂等：没收藏过也返回成功；GREATEST 保证计数不会被减成负数
  await prisma.$executeRaw`
    WITH deleted AS (
      DELETE FROM favorites
      WHERE user_id = ${user.id}::uuid AND item_id = ${itemId}::uuid
      RETURNING 1
    )
    UPDATE items
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = ${itemId}::uuid AND EXISTS (SELECT 1 FROM deleted)
  `
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
