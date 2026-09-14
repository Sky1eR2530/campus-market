import type { ItemStatus, SortOption } from './types.js'

/** 平台名称与标语，多处复用，避免散落硬编码 */
export const APP_NAME = '校园淘'
export const APP_TAGLINE = '同校闲置，快速流转'
export const APP_DESCRIPTION =
  '面向在校学生的闲置物品信息平台。发布你不再需要的，找到你正需要的，一切都在同一个校园里完成。'

/**
 * 商品分类。分类在数据库中是数据表而非枚举，这里提供的是初始种子数据，
 * 新增分类只需在后台添加，无需改动前端代码。
 */
export const CATEGORY_SEED = [
  { slug: 'digital', name: '数码产品', icon: 'device', sortOrder: 1 },
  { slug: 'books', name: '书籍资料', icon: 'book', sortOrder: 2 },
  { slug: 'living', name: '生活用品', icon: 'mug', sortOrder: 3 },
  { slug: 'fashion', name: '服饰鞋包', icon: 'shirt', sortOrder: 4 },
  { slug: 'study', name: '学习用品', icon: 'pencil', sortOrder: 5 },
  { slug: 'other', name: '其他', icon: 'box', sortOrder: 6 }
] as const

export type CategorySlug = (typeof CATEGORY_SEED)[number]['slug']

export const CATEGORY_SLUGS: readonly string[] = CATEGORY_SEED.map((c) => c.slug)

/** 商品状态的展示文案与语义色板 */
export const ITEM_STATUS_META: Record<ItemStatus, { label: string; tone: 'success' | 'neutral' | 'warning' }> = {
  on_sale: { label: '在售', tone: 'success' },
  sold: { label: '已售', tone: 'neutral' },
  off_shelf: { label: '下架', tone: 'warning' }
}

export const ITEM_STATUS_ORDER: ItemStatus[] = ['on_sale', 'sold', 'off_shelf']

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '最新发布' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' }
]

export const DEFAULT_SORT: SortOption = 'latest'

/** 列表每页条数 */
export const PAGE_SIZE = 12

/** 单个商品最多上传图片数量，与后端校验保持一致 */
export const MAX_ITEM_IMAGES = 9

export const TITLE_MIN = 2
export const TITLE_MAX = 60
export const DESCRIPTION_MIN = 5
export const DESCRIPTION_MAX = 1000
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 20
export const PASSWORD_MIN = 6
/**
 * bcrypt 只使用前 72 个字节，超出部分会被静默忽略。
 * 与其让用户以为长密码更安全，不如在入口处直接拒绝。
 */
export const PASSWORD_MAX = 64
export const BIO_MAX = 200

/** 价格上限：99999.99 元 */
export const PRICE_MAX_CENTS = 9_999_999

/** 图片上传限制 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
