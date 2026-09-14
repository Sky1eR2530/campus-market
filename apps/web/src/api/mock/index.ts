import { AppError } from '@campus/shared'
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
  RegisterPayload,
  SellerProfile,
  UpdateItemPayload,
  UpdateProfilePayload
} from '@campus/shared'
import * as db from './db'

/**
 * Mock API 门面。
 *
 * 每个方法都刻意延迟 160~420ms，并可能在失败时抛出 AppError，
 * 目的是让加载态、错误态、重试按钮在 Phase 1 就能被真实验证，
 * 而不是等到接上后端才发现「原来这些状态根本没做」。
 */

const MIN_DELAY = 160
const MAX_DELAY = 420

/**
 * 在地址栏加上 ?mockError=1 打开页面，可以让首屏的接口请求失败一次，
 * 用来检查错误提示与「重试」按钮是否正常工作。参数会自动清除，刷新即恢复。
 */
let failUntil = 0

function initFailureFlag(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get('mockError') !== '1') return
    failUntil = Date.now() + 600
    url.searchParams.delete('mockError')
    window.history.replaceState({}, '', url.toString())
  } catch {
    /* 地址栏不可用时忽略即可 */
  }
}

initFailureFlag()

function wait(scale = 1): Promise<void> {
  const ms = (MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)) * scale
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function respond<T>(handler: () => T, delayScale = 1): Promise<T> {
  await wait(delayScale)
  if (Date.now() < failUntil) {
    throw new AppError('NETWORK_ERROR', '网络连接不稳定，请检查网络后重试', 503)
  }
  return handler()
}

function viewerId(): string | null {
  return db.sessionUser()?.id ?? null
}

export const mockApi = {
  // ---------------- 认证 ----------------
  login: (payload: LoginPayload): Promise<AuthResult> => respond(() => db.login(payload)),

  register: (payload: RegisterPayload): Promise<AuthResult> => respond(() => db.register(payload)),

  logout: (): Promise<void> =>
    respond(() => {
      db.logout()
    }),

  fetchCurrentUser: (): Promise<CurrentUser | null> =>
    respond(() => db.currentUser(), 0.4),

  // ---------------- 分类 ----------------
  fetchCategories: (): Promise<Category[]> => respond(() => db.listCategories(), 0.7),

  // ---------------- 商品 ----------------
  fetchItems: (query: ItemQuery): Promise<Paginated<Item>> =>
    respond(() => db.queryItems(query, viewerId())),

  fetchItem: (itemId: string): Promise<Item> => respond(() => db.getItem(itemId, viewerId())),

  createItem: (payload: CreateItemPayload): Promise<Item> =>
    respond(() => db.createItem(payload, db.requireSession()), 1.2),

  updateItem: (itemId: string, payload: UpdateItemPayload): Promise<Item> =>
    respond(() => db.updateItem(itemId, payload, db.requireSession())),

  updateItemStatus: (itemId: string, status: ItemStatus): Promise<Item> =>
    respond(() => db.updateItemStatus(itemId, status, db.requireSession())),

  deleteItem: (itemId: string): Promise<void> =>
    respond(() => {
      db.deleteItem(itemId, db.requireSession())
    }),

  // ---------------- 收藏 ----------------
  fetchFavoriteIds: (): Promise<string[]> =>
    respond(() => (db.sessionUser() ? db.favoriteIds(db.requireSession()) : []), 0.5),

  fetchFavorites: (page = 1): Promise<Paginated<Item>> =>
    respond(() => db.listFavorites(db.requireSession(), { page })),

  addFavorite: (itemId: string): Promise<{ favorited: boolean }> =>
    respond(() => db.addFavorite(itemId, db.requireSession()), 0.6),

  removeFavorite: (itemId: string): Promise<{ favorited: boolean }> =>
    respond(() => db.removeFavorite(itemId, db.requireSession()), 0.6),

  // ---------------- 用户 ----------------
  fetchSellerProfile: (userId: string): Promise<SellerProfile> =>
    respond(() => db.getSellerProfile(userId, viewerId())),

  updateProfile: (payload: UpdateProfilePayload): Promise<CurrentUser> =>
    respond(() => db.updateProfile(db.requireSession().id, payload)),

  fetchMyStats: (): Promise<MyStats> => respond(() => db.getMyStats(db.requireSession().id), 0.5)
}

export { resetMockData } from './db'
