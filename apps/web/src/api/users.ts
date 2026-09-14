import type { CurrentUser, MyStats, SellerProfile, UpdateProfilePayload } from '@campus/shared'
import { requestData } from './http'

export function fetchSellerProfile(userId: string): Promise<SellerProfile> {
  return requestData<SellerProfile>({ url: `/users/${userId}` })
}

export function updateProfile(payload: UpdateProfilePayload): Promise<CurrentUser> {
  return requestData<CurrentUser>({ url: '/users/me', method: 'PATCH', data: payload })
}

export function fetchMyStats(): Promise<MyStats> {
  return requestData<MyStats>({ url: '/users/me/stats' })
}
