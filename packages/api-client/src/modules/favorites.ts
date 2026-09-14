import type { Item, Paginated } from '@campus/shared'
import { requestData, requestList } from '../http.js'

interface FavoriteState {
  favorited: boolean
}

export function fetchFavoriteIds(): Promise<string[]> {
  return requestData<string[]>({ url: '/favorites/ids' })
}

export function fetchFavorites(page = 1): Promise<Paginated<Item>> {
  return requestList<Item>({ url: '/favorites', params: { page } })
}

export function addFavorite(itemId: string): Promise<FavoriteState> {
  return requestData<FavoriteState>({ url: `/favorites/${itemId}`, method: 'POST' })
}

export function removeFavorite(itemId: string): Promise<FavoriteState> {
  return requestData<FavoriteState>({ url: `/favorites/${itemId}`, method: 'DELETE' })
}
