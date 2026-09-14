/**
 * 前后端共享的领域类型。
 * 后端 Phase 2 会直接复用这些定义，保证 API 契约只有一处来源。
 */

/** 商品状态：在售 / 已售 / 下架 */
export type ItemStatus = 'on_sale' | 'sold' | 'off_shelf'

export type UserRole = 'user' | 'admin'

export type UserStatus = 'active' | 'banned'

/** 列表排序方式 */
export type SortOption = 'latest' | 'price_asc' | 'price_desc'

/** 对外暴露的用户信息（不含邮箱、密码等敏感字段） */
export interface PublicUser {
  id: string
  nickname: string
  avatarUrl: string | null
  school: string | null
  campus: string | null
  bio: string | null
  createdAt: string
}

/** 卖家详情页展示用，包含联系方式 */
export interface SellerProfile extends PublicUser {
  contact: string | null
  itemCount: number
  onSaleCount: number
}

/** 当前登录用户（仅本人在 /auth/me 拿到） */
export interface CurrentUser extends PublicUser {
  email: string
  role: UserRole
  status: UserStatus
  contact: string | null
}

export interface Category {
  id: number
  slug: string
  name: string
  icon: string
  sortOrder: number
  /** 该分类下在售商品数量，列表页用于展示 */
  itemCount: number
}

export interface ItemImage {
  id: string
  url: string
  sortOrder: number
}

export interface Item {
  id: string
  title: string
  description: string
  /** 价格以「分」为单位的整数存储，避免浮点误差 */
  priceCents: number
  status: ItemStatus
  categoryId: number
  categorySlug: string
  categoryName: string
  sellerId: string
  /** 卖家公开信息。联系方式只对已登录用户返回，未登录时为 null */
  seller: SellerProfile | null
  images: ItemImage[]
  school: string | null
  campus: string | null
  viewCount: number
  favoriteCount: number
  publishedAt: string
  createdAt: string
  updatedAt: string
  /** 当前登录用户是否已收藏，未登录时为 false */
  isFavorited: boolean
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

/** 商品列表查询条件，与 URL query 一一对应 */
export interface ItemQuery {
  q?: string
  category?: string
  sort?: SortOption
  status?: ItemStatus
  sellerId?: string
  page?: number
  pageSize?: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  nickname: string
  password: string
}

export interface AuthResult {
  token: string
  user: CurrentUser
}

export interface CreateItemPayload {
  title: string
  description: string
  priceCents: number
  categorySlug: string
  images: string[]
}

export type UpdateItemPayload = Partial<CreateItemPayload>

export interface UpdateProfilePayload {
  nickname?: string
  school?: string | null
  campus?: string | null
  contact?: string | null
  bio?: string | null
}

/** 用户中心的数据概览 */
export interface MyStats {
  published: number
  onSale: number
  sold: number
  offShelf: number
  favorites: number
}
