import type { Category } from '@campus/shared'
import { requestData } from '../http.js'

export function fetchCategories(): Promise<Category[]> {
  return requestData<Category[]>({ url: '/categories' })
}
