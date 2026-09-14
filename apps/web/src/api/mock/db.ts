import { AppError } from '@campus/shared'
import { DEFAULT_SORT, PAGE_SIZE } from '@campus/shared'
import type {
  AuthResult,
  Category,
  CreateItemPayload,
  CurrentUser,
  Item,
  ItemQuery,
  ItemStatus,
  LoginPayload,
  MyStats,
  Paginated,
  PublicUser,
  RegisterPayload,
  SellerProfile,
  UpdateItemPayload,
  UpdateProfilePayload,
  UserRole,
  UserStatus
} from '@campus/shared'
import { itemImage } from '@/utils/placeholder'
import { SEED_CATEGORIES, SEED_ITEMS, SEED_USERS } from './data'

/**
 * Phase 1 的本地「服务端」。
 *
 * 它模拟了真实后端的行为边界：权限校验、状态机、分页、校验失败与未找到错误，
 * 因此 Phase 3 把同一批函数换成真实 HTTP 请求后，页面层的逻辑不需要改动。
 *
 * ⚠️ 这里的密码是明文比较的，仅因为它是浏览器内的演示数据。
 *    真实后端（Phase 2）使用 bcrypt 加盐哈希，数据库中不会出现明文密码。
 */

const HOUR = 3_600_000
const STORAGE_PREFIX = 'campus-mock:v1:'

export interface MockUserRecord {
  id: string
  email: string
  password: string
  nickname: string
  avatarUrl: string | null
  school: string | null
  campus: string | null
  contact: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLoginAt: string | null
}

interface StoredItem {
  id: string
  title: string
  description: string
  priceCents: number
  status: ItemStatus
  categorySlug: string
  sellerId: string
  images: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
  viewCount: number
  favoriteCount: number
  deletedAt: string | null
}

interface MockState {
  /** 注册用户（种子用户是常量，不写入存储） */
  users: MockUserRecord[]
  /** 用户自己发布的商品 */
  items: StoredItem[]
  /** 对种子商品的修改（编辑、改状态），使演示数据保持新鲜的同时支持持久化改动 */
  overrides: Record<string, Partial<StoredItem>>
  /** userId → 收藏的商品 id */
  favorites: Record<string, string[]>
  /** 种子用户资料的修改。种子用户是常量，改动写在这里 */
  userOverrides: Record<string, Partial<MockUserRecord>>
  sessionUserId: string | null
}

// ---------------------------------------------------------------------------
// 存储
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    throw new AppError(
      'INTERNAL_ERROR',
      '浏览器本地存储空间不足，请删除部分自建商品后重试',
      507
    )
  }
}

function iso(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// 状态
// ---------------------------------------------------------------------------

const BASE_USERS: MockUserRecord[] = SEED_USERS.map((user) => ({
  id: user.id,
  email: user.email,
  password: user.password,
  nickname: user.nickname,
  avatarUrl: null,
  school: user.school,
  campus: user.campus,
  contact: user.contact,
  bio: user.bio,
  role: user.role,
  status: 'active',
  createdAt: iso(Date.now() - user.createdDaysAgo * 24 * HOUR),
  lastLoginAt: null
}))

const state: MockState = {
  users: readJson<MockUserRecord[]>('users', []),
  items: readJson<StoredItem[]>('items', []),
  overrides: readJson<Record<string, Partial<StoredItem>>>('overrides', {}),
  favorites: readJson<Record<string, string[]>>('favorites', {}),
  userOverrides: readJson<Record<string, Partial<MockUserRecord>>>('userOverrides', {}),
  sessionUserId: readJson<string | null>('session', null)
}

/** 详情页浏览量：只影响本次浏览的展示，不写存储，避免读操作产生写放大 */
const viewBoost = new Map<string, number>()

// ---------------------------------------------------------------------------
// 组装
// ---------------------------------------------------------------------------

function buildBaseItems(): StoredItem[] {
  const now = Date.now()
  return SEED_ITEMS.map((def, index) => {
    const publishedAt = iso(now - def.hoursAgo * HOUR)
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      priceCents: def.yuan * 100,
      status: def.status ?? 'on_sale',
      categorySlug: def.categorySlug,
      sellerId: def.sellerId,
      images: Array.from({ length: def.imageCount }, (_, i) =>
        itemImage(def.categorySlug, index * 7 + i + 1)
      ),
      publishedAt,
      createdAt: publishedAt,
      updatedAt: publishedAt,
      viewCount: def.views,
      favoriteCount: def.favorites,
      deletedAt: null
    }
  })
}

function findUserRecord(userId: string): MockUserRecord | null {
  const base =
    state.users.find((user) => user.id === userId) ??
    BASE_USERS.find((user) => user.id === userId) ??
    null
  if (!base) return null
  return { ...base, ...(state.userOverrides[userId] ?? {}) }
}

function toPublicUser(record: MockUserRecord): PublicUser {
  return {
    id: record.id,
    nickname: record.nickname,
    avatarUrl: record.avatarUrl,
    school: record.school,
    campus: record.campus,
    bio: record.bio,
    createdAt: record.createdAt
  }
}

function toCurrentUser(record: MockUserRecord): CurrentUser {
  return {
    ...toPublicUser(record),
    email: record.email,
    role: record.role,
    status: record.status,
    contact: record.contact
  }
}

function allStoredItems(): StoredItem[] {
  const applyOverride = (item: StoredItem): StoredItem => ({
    ...item,
    ...(state.overrides[item.id] ?? {})
  })
  return [...buildBaseItems().map(applyOverride), ...state.items.map(applyOverride)]
}

function liveFavoriteCount(itemId: string, base: number): number {
  let count = base
  for (const ids of Object.values(state.favorites)) {
    if (ids.includes(itemId)) count += 1
  }
  return count
}

/** 卖家发布数量与在售数量。详情页的卖家卡片需要展示，避免出现「发布 0 件」这类失真数据。 */
function sellerItemCounts(sellerId: string): { itemCount: number; onSaleCount: number } {
  const items = allStoredItems().filter((item) => item.sellerId === sellerId && !item.deletedAt)
  return {
    itemCount: items.length,
    onSaleCount: items.filter((item) => item.status === 'on_sale').length
  }
}

function hydrateItem(stored: StoredItem, viewerId: string | null): Item {
  const category = SEED_CATEGORIES.find((c) => c.slug === stored.categorySlug)
  const sellerRecord = findUserRecord(stored.sellerId)
  const counts = sellerRecord ? sellerItemCounts(stored.sellerId) : null
  const seller: SellerProfile | null = sellerRecord
    ? {
        ...toPublicUser(sellerRecord),
        // 联系方式只对已登录用户开放，未登录时后端不返回该字段
        contact: viewerId ? sellerRecord.contact : null,
        itemCount: counts?.itemCount ?? 0,
        onSaleCount: counts?.onSaleCount ?? 0
      }
    : null

  const isFavorited = viewerId ? (state.favorites[viewerId]?.includes(stored.id) ?? false) : false

  return {
    id: stored.id,
    title: stored.title,
    description: stored.description,
    priceCents: stored.priceCents,
    status: stored.status,
    categoryId: category?.id ?? 0,
    categorySlug: stored.categorySlug,
    categoryName: category?.name ?? '其他',
    sellerId: stored.sellerId,
    seller,
    images: stored.images.map((url, index) => ({
      id: `${stored.id}-img-${index}`,
      url,
      sortOrder: index
    })),
    school: sellerRecord?.school ?? null,
    campus: sellerRecord?.campus ?? null,
    viewCount: stored.viewCount + (viewBoost.get(stored.id) ?? 0),
    favoriteCount: liveFavoriteCount(stored.id, stored.favoriteCount),
    publishedAt: stored.publishedAt,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    isFavorited
  }
}

// ---------------------------------------------------------------------------
// 权限辅助
// ---------------------------------------------------------------------------

export function requireSession(): MockUserRecord {
  const user = state.sessionUserId ? findUserRecord(state.sessionUserId) : null
  if (!user) throw new AppError('UNAUTHORIZED', '登录状态已失效，请重新登录', 401)
  if (user.status === 'banned') throw new AppError('ACCOUNT_BANNED', '账号已被封禁，无法执行该操作', 403)
  return user
}

export function sessionUser(): MockUserRecord | null {
  if (!state.sessionUserId) return null
  return findUserRecord(state.sessionUserId)
}

function findStoredItem(itemId: string): StoredItem {
  const found = allStoredItems().find((item) => item.id === itemId && !item.deletedAt)
  if (!found) throw new AppError('ITEM_NOT_FOUND', '商品不存在或已被删除', 404)
  return found
}

function assertOwner(item: StoredItem, user: MockUserRecord): void {
  if (item.sellerId !== user.id) {
    throw new AppError('FORBIDDEN', '只能操作自己发布的商品', 403)
  }
}

function patchItem(itemId: string, patch: Partial<StoredItem>): void {
  const isUserItem = state.items.some((item) => item.id === itemId)
  if (isUserItem) {
    state.items = state.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    writeJson('items', state.items)
    return
  }
  state.overrides[itemId] = { ...(state.overrides[itemId] ?? {}), ...patch }
  writeJson('overrides', state.overrides)
}

// ---------------------------------------------------------------------------
// 分类
// ---------------------------------------------------------------------------

export function listCategories(): Category[] {
  const items = allStoredItems().filter((item) => !item.deletedAt && item.status !== 'off_shelf')
  return SEED_CATEGORIES.map((category) => ({
    ...category,
    itemCount: items.filter((item) => item.categorySlug === category.slug).length
  })).sort((a, b) => a.sortOrder - b.sortOrder)
}

// ---------------------------------------------------------------------------
// 商品
// ---------------------------------------------------------------------------

const CATEGORY_NAME_BY_SLUG = new Map(SEED_CATEGORIES.map((c) => [c.slug, c.name]))

function matchesKeyword(item: StoredItem, keyword: string): boolean {
  const haystack = [
    item.title,
    item.description,
    CATEGORY_NAME_BY_SLUG.get(item.categorySlug) ?? ''
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

function sortItems(items: StoredItem[], sort: ItemQuery['sort']): StoredItem[] {
  const byLatest = (a: StoredItem, b: StoredItem) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()

  switch (sort ?? DEFAULT_SORT) {
    case 'price_asc':
      return [...items].sort((a, b) => a.priceCents - b.priceCents || byLatest(a, b))
    case 'price_desc':
      return [...items].sort((a, b) => b.priceCents - a.priceCents || byLatest(a, b))
    default:
      return [...items].sort(byLatest)
  }
}

export function queryItems(query: ItemQuery, viewerId: string | null): Paginated<Item> {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(60, Math.max(1, query.pageSize ?? PAGE_SIZE))

  let list = allStoredItems().filter((item) => !item.deletedAt)

  if (query.sellerId) {
    list = list.filter((item) => item.sellerId === query.sellerId)
  }

  if (query.status) {
    list = list.filter((item) => item.status === query.status)
  } else if (query.sellerId !== viewerId) {
    // 公开列表隐藏下架商品；卖家查看自己的发布时可以看到全部状态
    list = list.filter((item) => item.status !== 'off_shelf')
  }

  if (query.category) {
    list = list.filter((item) => item.categorySlug === query.category)
  }

  const keyword = query.q?.trim().toLowerCase()
  if (keyword) {
    list = list.filter((item) => matchesKeyword(item, keyword))
  }

  const sorted = sortItems(list, query.sort)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const data = sorted
    .slice((safePage - 1) * pageSize, safePage * pageSize)
    .map((item) => hydrateItem(item, viewerId))

  return { data, meta: { page: safePage, pageSize, total, totalPages } }
}

export function getItem(itemId: string, viewerId: string | null): Item {
  const stored = findStoredItem(itemId)
  viewBoost.set(itemId, (viewBoost.get(itemId) ?? 0) + 1)
  return hydrateItem(stored, viewerId)
}

export function createItem(payload: CreateItemPayload, user: MockUserRecord): Item {
  const category = SEED_CATEGORIES.find((c) => c.slug === payload.categorySlug)
  if (!category) throw new AppError('VALIDATION_FAILED', '所选分类不存在', 422)

  const now = iso(Date.now())
  const created: StoredItem = {
    id: randomId('item'),
    title: payload.title.trim(),
    description: payload.description.trim(),
    priceCents: Math.round(payload.priceCents),
    status: 'on_sale',
    categorySlug: category.slug,
    sellerId: user.id,
    images: payload.images.slice(0, 9),
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    favoriteCount: 0,
    deletedAt: null
  }

  state.items = [created, ...state.items]
  writeJson('items', state.items)
  return hydrateItem(created, user.id)
}

export function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
  user: MockUserRecord
): Item {
  const stored = findStoredItem(itemId)
  assertOwner(stored, user)

  if (payload.categorySlug && !SEED_CATEGORIES.some((c) => c.slug === payload.categorySlug)) {
    throw new AppError('VALIDATION_FAILED', '所选分类不存在', 422)
  }

  const patch: Partial<StoredItem> = { updatedAt: iso(Date.now()) }
  if (payload.title !== undefined) patch.title = payload.title.trim()
  if (payload.description !== undefined) patch.description = payload.description.trim()
  if (payload.priceCents !== undefined) patch.priceCents = Math.round(payload.priceCents)
  if (payload.categorySlug !== undefined) patch.categorySlug = payload.categorySlug
  if (payload.images !== undefined) patch.images = payload.images.slice(0, 9)

  patchItem(itemId, patch)
  return hydrateItem(findStoredItem(itemId), user.id)
}

export function updateItemStatus(itemId: string, status: ItemStatus, user: MockUserRecord): Item {
  const stored = findStoredItem(itemId)
  assertOwner(stored, user)

  const patch: Partial<StoredItem> = { status, updatedAt: iso(Date.now()) }
  // 重新上架视为一次新的发布，刷新排序时间，否则商品会沉在列表最底部
  if (status === 'on_sale' && stored.status !== 'on_sale') {
    patch.publishedAt = iso(Date.now())
  }

  patchItem(itemId, patch)
  return hydrateItem(findStoredItem(itemId), user.id)
}

export function deleteItem(itemId: string, user: MockUserRecord): void {
  const stored = findStoredItem(itemId)
  assertOwner(stored, user)
  // 软删除：后台的异常信息处理需要保留可追溯记录
  patchItem(itemId, { deletedAt: iso(Date.now()), status: 'off_shelf' })
}

// ---------------------------------------------------------------------------
// 收藏
// ---------------------------------------------------------------------------

function favoriteIdsOf(userId: string): string[] {
  return state.favorites[userId] ?? []
}

export function addFavorite(itemId: string, user: MockUserRecord): { favorited: true } {
  const stored = findStoredItem(itemId)
  if (stored.sellerId === user.id) {
    throw new AppError('VALIDATION_FAILED', '不能收藏自己发布的商品', 422)
  }
  const current = favoriteIdsOf(user.id)
  // 幂等：重复收藏不报错，也不产生重复数据
  if (!current.includes(itemId)) {
    state.favorites[user.id] = [itemId, ...current]
    writeJson('favorites', state.favorites)
  }
  return { favorited: true }
}

export function removeFavorite(itemId: string, user: MockUserRecord): { favorited: false } {
  const current = favoriteIdsOf(user.id)
  if (current.includes(itemId)) {
    state.favorites[user.id] = current.filter((id) => id !== itemId)
    writeJson('favorites', state.favorites)
  }
  return { favorited: false }
}

export function listFavorites(
  user: MockUserRecord,
  query: { page?: number; pageSize?: number } = {}
): Paginated<Item> {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(60, Math.max(1, query.pageSize ?? PAGE_SIZE))
  const ids = favoriteIdsOf(user.id)
  const items = allStoredItems().filter((item) => ids.includes(item.id) && !item.deletedAt)
  // 保持「最近收藏在前」的顺序
  const ordered = ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is StoredItem => Boolean(item))

  const total = ordered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  return {
    data: ordered
      .slice((safePage - 1) * pageSize, safePage * pageSize)
      .map((item) => hydrateItem(item, user.id)),
    meta: { page: safePage, pageSize, total, totalPages }
  }
}

export function favoriteIds(user: MockUserRecord): string[] {
  return favoriteIdsOf(user.id)
}

// ---------------------------------------------------------------------------
// 用户
// ---------------------------------------------------------------------------

export function getSellerProfile(userId: string, viewerId: string | null): SellerProfile {
  const record = findUserRecord(userId)
  if (!record) throw new AppError('NOT_FOUND', '该用户不存在', 404)

  const items = allStoredItems().filter((item) => item.sellerId === userId && !item.deletedAt)
  return {
    ...toPublicUser(record),
    contact: viewerId ? record.contact : null,
    itemCount: items.length,
    onSaleCount: items.filter((item) => item.status === 'on_sale').length
  }
}

export function updateProfile(userId: string, payload: UpdateProfilePayload): CurrentUser {
  const record = findUserRecord(userId)
  if (!record) throw new AppError('NOT_FOUND', '用户不存在', 404)

  const patch: Partial<MockUserRecord> = {
    nickname: payload.nickname?.trim() || record.nickname,
    school: payload.school === undefined ? record.school : payload.school || null,
    campus: payload.campus === undefined ? record.campus : payload.campus || null,
    contact: payload.contact === undefined ? record.contact : payload.contact || null,
    bio: payload.bio === undefined ? record.bio : payload.bio || null
  }

  const isRegistered = state.users.some((user) => user.id === userId)
  if (isRegistered) {
    state.users = state.users.map((user) => (user.id === userId ? { ...user, ...patch } : user))
    writeJson('users', state.users)
  } else {
    state.userOverrides[userId] = { ...(state.userOverrides[userId] ?? {}), ...patch }
    writeJson('userOverrides', state.userOverrides)
  }

  return toCurrentUser({ ...record, ...patch })
}

export function getMyStats(userId: string): MyStats {
  const items = allStoredItems().filter((item) => item.sellerId === userId && !item.deletedAt)
  return {
    published: items.length,
    onSale: items.filter((item) => item.status === 'on_sale').length,
    sold: items.filter((item) => item.status === 'sold').length,
    offShelf: items.filter((item) => item.status === 'off_shelf').length,
    favorites: favoriteIdsOf(userId).length
  }
}

// ---------------------------------------------------------------------------
// 认证
// ---------------------------------------------------------------------------

function emailTaken(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return [...state.users, ...BASE_USERS].some((user) => user.email.toLowerCase() === normalized)
}

export function register(payload: RegisterPayload): AuthResult {
  if (emailTaken(payload.email)) {
    throw new AppError('EMAIL_TAKEN', '该邮箱已注册，请直接登录', 409)
  }

  const record: MockUserRecord = {
    id: randomId('u'),
    email: payload.email.trim(),
    password: payload.password,
    nickname: payload.nickname.trim(),
    avatarUrl: null,
    school: null,
    campus: null,
    contact: null,
    bio: null,
    role: 'user',
    status: 'active',
    createdAt: iso(Date.now()),
    lastLoginAt: iso(Date.now())
  }

  state.users = [...state.users, record]
  writeJson('users', state.users)
  state.sessionUserId = record.id
  writeJson('session', record.id)

  return { token: `mock.${record.id}`, user: toCurrentUser(record) }
}

export function login(payload: LoginPayload): AuthResult {
  const normalized = payload.email.trim().toLowerCase()
  const record = [...state.users, ...BASE_USERS].find(
    (user) => user.email.toLowerCase() === normalized
  )

  if (!record || record.password !== payload.password) {
    throw new AppError('INVALID_CREDENTIALS', '邮箱或密码不正确', 401)
  }
  if (record.status === 'banned') {
    throw new AppError('ACCOUNT_BANNED', '该账号已被封禁，如有疑问请联系管理员', 403)
  }

  record.lastLoginAt = iso(Date.now())
  state.sessionUserId = record.id
  writeJson('session', record.id)

  return { token: `mock.${record.id}`, user: toCurrentUser(record) }
}

export function logout(): void {
  state.sessionUserId = null
  writeJson('session', null)
}

export function currentUser(): CurrentUser | null {
  const record = sessionUser()
  return record ? toCurrentUser(record) : null
}

// ---------------------------------------------------------------------------
// 维护
// ---------------------------------------------------------------------------

/** 清空本地演示数据，恢复到初始状态。用于演示前重置或测试异常流程。 */
export function resetMockData(): void {
  const keys = ['users', 'items', 'overrides', 'favorites', 'userOverrides', 'session']
  for (const key of keys) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {
      /* 忽略：存储不可用时本来就无需清理 */
    }
  }
  state.users = []
  state.items = []
  state.overrides = {}
  state.favorites = {}
  state.userOverrides = {}
  state.sessionUserId = null
  viewBoost.clear()
}
