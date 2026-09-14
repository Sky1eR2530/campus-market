import type {
  CreateItemPayload,
  Item,
  ItemQuery,
  ItemStatus,
  Paginated,
  UpdateItemPayload
} from '@campus/shared'
import { mockApi } from './mock'

export function fetchItems(query: ItemQuery = {}): Promise<Paginated<Item>> {
  return mockApi.fetchItems(query)
}

export function fetchItem(itemId: string): Promise<Item> {
  return mockApi.fetchItem(itemId)
}

export function createItem(payload: CreateItemPayload): Promise<Item> {
  return mockApi.createItem(payload)
}

export function updateItem(itemId: string, payload: UpdateItemPayload): Promise<Item> {
  return mockApi.updateItem(itemId, payload)
}

export function updateItemStatus(itemId: string, status: ItemStatus): Promise<Item> {
  return mockApi.updateItemStatus(itemId, status)
}

export function deleteItem(itemId: string): Promise<void> {
  return mockApi.deleteItem(itemId)
}
