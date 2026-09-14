import type {
  CreateItemPayload,
  Item,
  ItemQuery,
  ItemStatus,
  Paginated,
  UpdateItemPayload
} from '@campus/shared'
import { http, requestData, requestList } from '../http.js'

export function fetchItems(query: ItemQuery = {}): Promise<Paginated<Item>> {
  // axios 会自动忽略值为 undefined 的查询参数
  return requestList<Item>({ url: '/items', params: query })
}

export function fetchItem(itemId: string): Promise<Item> {
  return requestData<Item>({ url: `/items/${itemId}` })
}

export function createItem(payload: CreateItemPayload): Promise<Item> {
  return requestData<Item>({ url: '/items', method: 'POST', data: payload })
}

export function updateItem(itemId: string, payload: UpdateItemPayload): Promise<Item> {
  return requestData<Item>({ url: `/items/${itemId}`, method: 'PATCH', data: payload })
}

export function updateItemStatus(itemId: string, status: ItemStatus): Promise<Item> {
  return requestData<Item>({
    url: `/items/${itemId}/status`,
    method: 'PATCH',
    data: { status }
  })
}

export async function deleteItem(itemId: string): Promise<void> {
  await http.delete(`/items/${itemId}`)
}
