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
import { http, requestData, requestList } from '../http.js'

export function fetchAdminStats(): Promise<AdminStats> {
  return requestData<AdminStats>({ url: '/admin/stats' })
}

export function fetchAdminUsers(query: AdminUserQuery = {}): Promise<Paginated<AdminUser>> {
  return requestList<AdminUser>({ url: '/admin/users', params: query })
}

export async function updateAdminUserStatus(
  userId: string,
  status: UserStatus,
  reason?: string
): Promise<void> {
  await http.patch(`/admin/users/${userId}/status`, { status, reason })
}

export function fetchAdminItems(query: AdminItemQuery = {}): Promise<Paginated<AdminItem>> {
  return requestList<AdminItem>({ url: '/admin/items', params: query })
}

export async function updateAdminItemStatus(
  itemId: string,
  status: ItemStatus,
  reason?: string
): Promise<void> {
  await http.patch(`/admin/items/${itemId}/status`, { status, reason })
}

export async function deleteAdminItem(itemId: string, reason?: string): Promise<void> {
  await http.delete(`/admin/items/${itemId}`, { data: { reason } })
}

export function fetchAdminCategories(): Promise<AdminCategory[]> {
  return requestData<AdminCategory[]>({ url: '/admin/categories' })
}

export function createAdminCategory(payload: CreateCategoryValues): Promise<AdminCategory> {
  return requestData<AdminCategory>({ url: '/admin/categories', method: 'POST', data: payload })
}

export function updateAdminCategory(
  categoryId: number,
  payload: UpdateCategoryValues
): Promise<AdminCategory> {
  return requestData<AdminCategory>({
    url: `/admin/categories/${categoryId}`,
    method: 'PATCH',
    data: payload
  })
}

export async function deleteAdminCategory(categoryId: number): Promise<void> {
  await http.delete(`/admin/categories/${categoryId}`)
}

export function fetchAdminActions(
  query: { page?: number; pageSize?: number } = {}
): Promise<Paginated<AdminActionLog>> {
  return requestList<AdminActionLog>({ url: '/admin/actions', params: query })
}
