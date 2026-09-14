import { AppError } from '@campus/shared'
import type {
  CreateItemPayloadValues,
  CurrentUser,
  Item as ItemDto,
  ItemQueryValues,
  ItemStatus,
  Paginated,
  SellerProfile,
  UpdateItemPayloadValues
} from '@campus/shared'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import { storage } from '../../lib/storage/index.js'
import { logger } from '../../lib/logger.js'
import { resolvePageWindow } from '../../utils/pagination.js'
import { toSellerProfile } from '../users/user.mapper.js'
import { loadSellerStats } from '../users/user.service.js'
import { toItemDto } from './item.mapper.js'
import { itemInclude } from './item.mapper.js'
import type { ItemWithRelations } from './item.mapper.js'

const DEFAULT_SORT: ItemQueryValues['sort'] = 'latest'

async function loadFavoritedIds(
  viewerId: string | null,
  itemIds: string[]
): Promise<Set<string>> {
  if (!viewerId || itemIds.length === 0) return new Set()

  const rows = await prisma.favorite.findMany({
    where: { userId: viewerId, itemId: { in: itemIds } },
    select: { itemId: true }
  })
  return new Set(rows.map((row) => row.itemId))
}

/**
 * 把数据库记录转换成对外结构。
 * 联系方式默认不返回：列表页完全不需要，详情页也只在已登录时才带。
 */
async function toDtos(
  items: ItemWithRelations[],
  viewerId: string | null,
  includeContact: boolean
): Promise<ItemDto[]> {
  if (items.length === 0) return []

  const [stats, favorited] = await Promise.all([
    loadSellerStats([...new Set(items.map((item) => item.sellerId))]),
    loadFavoritedIds(
      viewerId,
      items.map((item) => item.id)
    )
  ])

  const sellerCache = new Map<string, SellerProfile>()
  for (const item of items) {
    if (sellerCache.has(item.sellerId)) continue
    sellerCache.set(
      item.sellerId,
      toSellerProfile(
        item.seller,
        stats.get(item.sellerId) ?? { itemCount: 0, onSaleCount: 0 },
        includeContact
      )
    )
  }

  return items.map((item) =>
    toItemDto(item, {
      seller: sellerCache.get(item.sellerId) ?? null,
      isFavorited: favorited.has(item.id)
    })
  )
}

export async function listItems(
  query: ItemQueryValues,
  viewerId: string | null
): Promise<Paginated<ItemDto>> {
  const where: Prisma.ItemWhereInput = { deletedAt: null }

  if (query.sellerId) where.sellerId = query.sellerId

  if (query.status) {
    where.status = query.status
  } else if (query.sellerId !== viewerId) {
    // 公开列表隐藏已下架商品；卖家查看自己的发布时可以看到全部状态
    where.status = { not: 'off_shelf' }
  }

  if (query.category) {
    where.category = { slug: query.category }
  }

  if (query.q) {
    // 中文没有词边界，用 ILIKE 子串匹配配合 pg_trgm 索引，
    // 比 PostgreSQL 默认的全文检索分词器更可靠
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } }
    ]
  }

  const orderBy: Prisma.ItemOrderByWithRelationInput[] =
    query.sort === 'price_asc'
      ? [{ priceCents: 'asc' }, { publishedAt: 'desc' }]
      : query.sort === 'price_desc'
        ? [{ priceCents: 'desc' }, { publishedAt: 'desc' }]
        : [{ publishedAt: 'desc' }]

  const total = await prisma.item.count({ where })
  const window = resolvePageWindow(query.page, query.pageSize, total)

  const rows = await prisma.item.findMany({
    where,
    orderBy,
    skip: window.skip,
    take: window.take,
    include: itemInclude
  })

  return {
    data: await toDtos(rows, viewerId, false),
    meta: {
      page: window.page,
      pageSize: window.pageSize,
      total,
      totalPages: window.totalPages
    }
  }
}

async function findItemOrThrow(itemId: string): Promise<ItemWithRelations> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, deletedAt: null },
    include: itemInclude
  })
  if (!item) throw new AppError('ITEM_NOT_FOUND', '商品不存在或已被删除', 404)
  return item
}

async function findOwnedItem(itemId: string, user: CurrentUser): Promise<ItemWithRelations> {
  const item = await findItemOrThrow(itemId)
  if (item.sellerId !== user.id) {
    throw new AppError('FORBIDDEN', '只能操作自己发布的商品', 403)
  }
  return item
}

export async function getItemById(itemId: string, viewerId: string | null): Promise<ItemDto> {
  const item = await findItemOrThrow(itemId)

  // 浏览量自增用原生 SQL：走 Prisma 的 update 会连带刷新 updated_at，
  // 让商品仅仅因为被浏览就看起来「刚更新过」
  await prisma
    .$executeRaw`UPDATE items SET view_count = view_count + 1 WHERE id = ${itemId}::uuid`
    .catch((error: unknown) => {
      logger.warn('浏览量自增失败', {
        itemId,
        message: error instanceof Error ? error.message : String(error)
      })
    })

  const [dto] = await toDtos([item], viewerId, Boolean(viewerId))
  return dto
}

/**
 * 只接受本平台存储返回的图片地址。
 * 否则用户可以提交任意外链，把本服务当成图床。
 */
function resolveImages(urls: string[]): { url: string; key: string }[] {
  return urls.map((url) => {
    const key = storage.resolveKey(url)
    if (!key) {
      throw new AppError('VALIDATION_FAILED', '包含无效的图片地址，请重新上传图片', 422, [
        { field: 'images', message: '图片地址不是本平台上传的图片' }
      ])
    }
    return { url, key }
  })
}

export async function createItem(
  payload: CreateItemPayloadValues,
  user: CurrentUser
): Promise<ItemDto> {
  const category = await prisma.category.findUnique({
    where: { slug: payload.categorySlug },
    select: { id: true }
  })
  if (!category) {
    throw new AppError('VALIDATION_FAILED', '所选分类不存在', 422, [
      { field: 'categorySlug', message: '所选分类不存在' }
    ])
  }

  const images = resolveImages(payload.images)
  const seller = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { school: true, campus: true }
  })

  const created = await prisma.item.create({
    data: {
      sellerId: user.id,
      categoryId: category.id,
      title: payload.title,
      description: payload.description,
      priceCents: payload.priceCents,
      status: 'on_sale',
      // 从卖家继承学校/校区，后续可以支持同校筛选
      school: seller.school,
      campus: seller.campus,
      images: {
        create: images.map((image, index) => ({
          url: image.url,
          storageKey: image.key,
          sortOrder: index
        }))
      }
    },
    include: itemInclude
  })

  const [dto] = await toDtos([created], user.id, false)
  return dto
}

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayloadValues,
  user: CurrentUser
): Promise<ItemDto> {
  const existing = await findOwnedItem(itemId, user)

  const data: Prisma.ItemUpdateInput = {}
  if (payload.title !== undefined) data.title = payload.title
  if (payload.description !== undefined) data.description = payload.description
  if (payload.priceCents !== undefined) data.priceCents = payload.priceCents

  if (payload.categorySlug !== undefined) {
    const category = await prisma.category.findUnique({
      where: { slug: payload.categorySlug },
      select: { id: true }
    })
    if (!category) {
      throw new AppError('VALIDATION_FAILED', '所选分类不存在', 422, [
        { field: 'categorySlug', message: '所选分类不存在' }
      ])
    }
    data.category = { connect: { id: category.id } }
  }

  let orphanKeys: string[] = []
  if (payload.images !== undefined) {
    const images = resolveImages(payload.images)
    // 保留仍然在用的文件，其余的等更新成功后再删
    orphanKeys = existing.images
      .map((image) => image.storageKey)
      .filter((key) => !images.some((image) => image.key === key))

    data.images = {
      deleteMany: {},
      create: images.map((image, index) => ({
        url: image.url,
        storageKey: image.key,
        sortOrder: index
      }))
    }
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data,
    include: itemInclude
  })

  // 清理不再引用的文件。失败只记日志：图片已经换好了，
  // 残留文件的清理不该让用户的编辑操作报错
  if (orphanKeys.length > 0) {
    const results = await Promise.allSettled(orphanKeys.map((key) => storage.remove(key)))
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.warn('清理旧图片失败', {
          itemId,
          message: result.reason instanceof Error ? result.reason.message : String(result.reason)
        })
      }
    }
  }

  const [dto] = await toDtos([updated], user.id, false)
  return dto
}

export async function updateItemStatus(
  itemId: string,
  status: ItemStatus,
  user: CurrentUser
): Promise<ItemDto> {
  const existing = await findOwnedItem(itemId, user)

  const data: Prisma.ItemUpdateInput = { status }
  // 重新上架视为一次新的发布：刷新排序时间，否则商品会沉在列表最底部
  if (status === 'on_sale' && existing.status !== 'on_sale') {
    data.publishedAt = new Date()
  }

  const updated = await prisma.item.update({ where: { id: itemId }, data, include: itemInclude })
  const [dto] = await toDtos([updated], user.id, false)
  return dto
}

export async function deleteItem(itemId: string, user: CurrentUser): Promise<void> {
  await findOwnedItem(itemId, user)
  // 软删除：后台的异常信息处理需要保留可追溯记录
  await prisma.item.update({
    where: { id: itemId },
    data: { deletedAt: new Date(), status: 'off_shelf' }
  })
}

export { DEFAULT_SORT, toDtos as toItemDtos }
