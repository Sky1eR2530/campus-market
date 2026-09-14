import type { Category } from '@campus/shared'
import { prisma } from '../../lib/prisma.js'

/**
 * 启用中的分类列表。
 * 分类是数据表而非枚举，新增分类只需在后台添加，前端无需改动。
 */
export async function listCategories(): Promise<Category[]> {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    }),
    // 一次聚合查询拿到所有分类的在售数量，避免每个分类查一次
    prisma.item.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'on_sale' },
      _count: { _all: true }
    })
  ])

  const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]))

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    sortOrder: category.sortOrder,
    itemCount: countByCategory.get(category.id) ?? 0
  }))
}
