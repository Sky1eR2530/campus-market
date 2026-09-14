import type { Item as ItemDto, SellerProfile } from '@campus/shared'
import type { Category, Item, ItemImage, User } from '../../generated/prisma/client.js'
import { Prisma } from '../../generated/prisma/client.js'

export interface ItemWithRelations extends Item {
  images: ItemImage[]
  seller: User
  category: Category
}

/** 列表与详情都要带上的关联，集中定义避免各查各的 */
export const itemInclude = {
  images: { orderBy: { sortOrder: 'asc' } },
  seller: true,
  category: true
} satisfies Prisma.ItemInclude

/**
 * 数据库记录 → 对外结构。
 * 集中处理字段映射，确保 storageKey、deletedAt 这类内部字段不会泄露出去。
 */
export function toItemDto(
  item: ItemWithRelations,
  options: { seller: SellerProfile | null; isFavorited: boolean }
): ItemDto {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    priceCents: item.priceCents,
    status: item.status,
    categoryId: item.categoryId,
    categorySlug: item.category.slug,
    categoryName: item.category.name,
    sellerId: item.sellerId,
    seller: options.seller,
    images: item.images.map((image) => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sortOrder
    })),
    school: item.school,
    campus: item.campus,
    viewCount: item.viewCount,
    favoriteCount: item.favoriteCount,
    publishedAt: item.publishedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    isFavorited: options.isFavorited
  }
}
