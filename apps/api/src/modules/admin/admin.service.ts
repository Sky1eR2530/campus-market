import { AppError } from '@campus/shared'
import type {
  AdminActionLog,
  AdminCategory,
  AdminItem,
  AdminItemQuery,
  AdminStats,
  AdminUser,
  AdminUserQuery,
  CreateCategoryValues,
  ItemStatus,
  Paginated,
  UpdateCategoryValues,
  UserStatus
} from '@campus/shared'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import { resolvePageWindow } from '../../utils/pagination.js'

const DEFAULT_PAGE_SIZE = 20

// ---------------------------------------------------------------------------
// 概览
// ---------------------------------------------------------------------------

export async function getStats(): Promise<AdminStats> {
  const [userGroups, itemGroups, categories, favorites, deletedItems] = await Promise.all([
    prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.item.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true }
    }),
    prisma.category.count(),
    prisma.favorite.count(),
    prisma.item.count({ where: { deletedAt: { not: null } } })
  ])

  const userCount = (status: string) =>
    userGroups.find((group) => group.status === status)?._count._all ?? 0
  const itemCount = (status: string) =>
    itemGroups.find((group) => group.status === status)?._count._all ?? 0

  const banned = userCount('banned')
  const active = userCount('active')
  const onSale = itemCount('on_sale')
  const sold = itemCount('sold')
  const offShelf = itemCount('off_shelf')

  return {
    users: { total: banned + active, banned, active },
    items: { total: onSale + sold + offShelf, onSale, sold, offShelf, deleted: deletedItems },
    categories,
    favorites
  }
}

// ---------------------------------------------------------------------------
// 用户管理
// ---------------------------------------------------------------------------

export async function listUsers(query: AdminUserQuery): Promise<Paginated<AdminUser>> {
  const where: Prisma.UserWhereInput = {}

  if (query.q) {
    where.OR = [
      { email: { contains: query.q, mode: 'insensitive' } },
      { nickname: { contains: query.q, mode: 'insensitive' } }
    ]
  }
  if (query.status) where.status = query.status
  if (query.role) where.role = query.role

  const total = await prisma.user.count({ where })
  const window = resolvePageWindow(query.page ?? 1, query.pageSize ?? DEFAULT_PAGE_SIZE, total)

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: window.skip,
    take: window.take
  })

  // 一次聚合拿到整页用户的发布数量，避免逐条统计
  const counts = await prisma.item.groupBy({
    by: ['sellerId'],
    where: { sellerId: { in: rows.map((row) => row.id) }, deletedAt: null },
    _count: { _all: true }
  })
  const countByUser = new Map(counts.map((row) => [row.sellerId, row._count._all]))

  return {
    data: rows.map((row) => ({
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      role: row.role,
      status: row.status,
      school: row.school,
      campus: row.campus,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      itemCount: countByUser.get(row.id) ?? 0
    })),
    meta: {
      page: window.page,
      pageSize: window.pageSize,
      total,
      totalPages: window.totalPages
    }
  }
}

export async function updateUserStatus(
  adminId: string,
  userId: string,
  status: UserStatus,
  reason?: string
): Promise<void> {
  // 防止管理员把自己锁在门外
  if (userId === adminId) {
    throw new AppError('VALIDATION_FAILED', '不能修改自己的账号状态', 422)
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new AppError('NOT_FOUND', '用户不存在', 404)

  if (target.role === 'admin' && status === 'banned') {
    const remainingAdmins = await prisma.user.count({
      where: { role: 'admin', status: 'active' }
    })
    if (remainingAdmins <= 1) {
      throw new AppError('VALIDATION_FAILED', '不能封禁唯一的管理员账号', 422)
    }
  }

  // 状态变更与操作日志必须一起成功或一起失败
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    prisma.adminAction.create({
      data: {
        adminId,
        targetType: 'user',
        targetId: userId,
        action: status === 'banned' ? 'ban' : 'unban',
        reason: reason ?? null
      }
    })
  ])
}

// ---------------------------------------------------------------------------
// 商品管理
// ---------------------------------------------------------------------------

export async function listItems(query: AdminItemQuery): Promise<Paginated<AdminItem>> {
  const where: Prisma.ItemWhereInput = {}

  // 默认不展示已删除的商品，但可以显式查看
  if (!query.includeDeleted) where.deletedAt = null
  if (query.status) where.status = query.status
  if (query.category) where.category = { slug: query.category }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { seller: { nickname: { contains: query.q, mode: 'insensitive' } } }
    ]
  }

  const total = await prisma.item.count({ where })
  const window = resolvePageWindow(query.page ?? 1, query.pageSize ?? DEFAULT_PAGE_SIZE, total)

  const rows = await prisma.item.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: window.skip,
    take: window.take,
    include: {
      category: true,
      seller: { select: { id: true, nickname: true } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1 }
    }
  })

  return {
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      priceCents: row.priceCents,
      status: row.status,
      categoryName: row.category.name,
      sellerId: row.seller.id,
      sellerNickname: row.seller.nickname,
      coverUrl: row.images[0]?.url ?? null,
      favoriteCount: row.favoriteCount,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null
    })),
    meta: {
      page: window.page,
      pageSize: window.pageSize,
      total,
      totalPages: window.totalPages
    }
  }
}

async function findItemOrThrow(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } })
  if (!item) throw new AppError('ITEM_NOT_FOUND', '商品不存在', 404)
  return item
}

export async function updateItemStatus(
  adminId: string,
  itemId: string,
  status: ItemStatus,
  reason?: string
): Promise<void> {
  await findItemOrThrow(itemId)

  const action =
    status === 'off_shelf' ? 'take_down' : status === 'on_sale' ? 'restore' : 'mark_sold'

  // 注意：这里不动 published_at。管理员恢复商品是为了让它重新可见，
  // 不该顺带把它顶到列表最前面——那是卖家自己重新上架才有的语义。
  await prisma.$transaction([
    prisma.item.update({ where: { id: itemId }, data: { status } }),
    prisma.adminAction.create({
      data: {
        adminId,
        targetType: 'item',
        targetId: itemId,
        action,
        reason: reason ?? null
      }
    })
  ])
}

export async function deleteItem(
  adminId: string,
  itemId: string,
  reason?: string
): Promise<void> {
  await findItemOrThrow(itemId)

  await prisma.$transaction([
    prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date(), status: 'off_shelf' }
    }),
    prisma.adminAction.create({
      data: {
        adminId,
        targetType: 'item',
        targetId: itemId,
        action: 'delete',
        reason: reason ?? null
      }
    })
  ])
}

// ---------------------------------------------------------------------------
// 分类管理
// ---------------------------------------------------------------------------

/** 后台需要看到全部分类（含已停用的），因此不复用前台那份只返回启用分类的实现 */
type CategoryRow = {
  id: number
  slug: string
  name: string
  icon: string
  sortOrder: number
  isActive: boolean
}

/** 显式映射，避免把 createdAt 这类内部字段顺带返回出去 */
function toCategoryDto(row: CategoryRow, itemCount: number): AdminCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    itemCount
  }
}

async function listCategoriesWithCounts(): Promise<AdminCategory[]> {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.item.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null },
      _count: { _all: true }
    })
  ])

  const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]))

  return categories.map((category) => toCategoryDto(category, countByCategory.get(category.id) ?? 0))
}

export { listCategoriesWithCounts as listCategories }

export async function createCategory(payload: CreateCategoryValues): Promise<AdminCategory> {
  const existing = await prisma.category.findUnique({
    where: { slug: payload.slug },
    select: { id: true }
  })
  if (existing) {
    throw new AppError('VALIDATION_FAILED', '该分类标识已存在', 409, [
      { field: 'slug', message: '该分类标识已存在' }
    ])
  }

  const created = await prisma.category.create({
    data: {
      slug: payload.slug,
      name: payload.name,
      icon: payload.icon,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive
    }
  })

  return toCategoryDto(created, 0)
}

export async function updateCategory(
  categoryId: number,
  payload: UpdateCategoryValues
): Promise<AdminCategory> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!existing) throw new AppError('NOT_FOUND', '分类不存在', 404)

  if (payload.slug && payload.slug !== existing.slug) {
    const duplicated = await prisma.category.findUnique({
      where: { slug: payload.slug },
      select: { id: true }
    })
    if (duplicated) {
      throw new AppError('VALIDATION_FAILED', '该分类标识已存在', 409, [
        { field: 'slug', message: '该分类标识已存在' }
      ])
    }
  }

  const data: Prisma.CategoryUpdateInput = {}
  if (payload.slug !== undefined) data.slug = payload.slug
  if (payload.name !== undefined) data.name = payload.name
  if (payload.icon !== undefined) data.icon = payload.icon
  if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder
  if (payload.isActive !== undefined) data.isActive = payload.isActive

  const updated = await prisma.category.update({ where: { id: categoryId }, data })
  const itemCount = await prisma.item.count({
    where: { categoryId, deletedAt: null }
  })

  return toCategoryDto(updated, itemCount)
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!existing) throw new AppError('NOT_FOUND', '分类不存在', 404)

  // 分类被商品引用时不能删除：外键约束会直接报数据库错误，
  // 与其把原始错误抛给调用方，不如提前给出可执行的处理建议
  const itemCount = await prisma.item.count({ where: { categoryId } })
  if (itemCount > 0) {
    throw new AppError(
      'VALIDATION_FAILED',
      `该分类下还有 ${itemCount} 件商品，请先转移或删除这些商品，或改为停用该分类`,
      422
    )
  }

  await prisma.category.delete({ where: { id: categoryId } })
}

// ---------------------------------------------------------------------------
// 操作日志
// ---------------------------------------------------------------------------

export async function listActions(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<AdminActionLog>> {
  const total = await prisma.adminAction.count()
  const window = resolvePageWindow(page, pageSize, total)

  const rows = await prisma.adminAction.findMany({
    orderBy: { createdAt: 'desc' },
    skip: window.skip,
    take: window.take,
    include: { admin: { select: { nickname: true } } }
  })

  return {
    data: rows.map((row) => ({
      id: row.id,
      adminId: row.adminId,
      adminNickname: row.admin.nickname,
      targetType: row.targetType,
      targetId: row.targetId,
      action: row.action,
      reason: row.reason,
      createdAt: row.createdAt.toISOString()
    })),
    meta: {
      page: window.page,
      pageSize: window.pageSize,
      total,
      totalPages: window.totalPages
    }
  }
}
