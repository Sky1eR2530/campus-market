import type { Item, Paginated } from '@campus/shared'
import { mockApi } from './mock'

export function fetchFavoriteIds(): Promise<string[]> {
  return mockApi.fetchFavoriteIds()
}

export function fetchFavorites(page = 1): Promise<Paginated<Item>> {
  return mockApi.fetchFavorites(page)
}

export function addFavorite(itemId: string): Promise<{ favorited: boolean }> {
  return mockApi.addFavorite(itemId)
}

export function removeFavorite(itemId: string): Promise<{ favorited: boolean }> {
  return mockApi.removeFavorite(itemId)
}
