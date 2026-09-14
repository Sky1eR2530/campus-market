import type { Category } from '@campus/shared'
import { mockApi } from './mock'

export function fetchCategories(): Promise<Category[]> {
  return mockApi.fetchCategories()
}
