import type { CurrentUser, MyStats, SellerProfile, UpdateProfilePayload } from '@campus/shared'
import { mockApi } from './mock'

export function fetchSellerProfile(userId: string): Promise<SellerProfile> {
  return mockApi.fetchSellerProfile(userId)
}

export function updateProfile(payload: UpdateProfilePayload): Promise<CurrentUser> {
  return mockApi.updateProfile(payload)
}

export function fetchMyStats(): Promise<MyStats> {
  return mockApi.fetchMyStats()
}
