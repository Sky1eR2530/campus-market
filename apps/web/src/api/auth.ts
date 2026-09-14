import type { AuthResult, CurrentUser, LoginPayload, RegisterPayload } from '@campus/shared'
import { mockApi } from './mock'

/**
 * 认证接口。
 * Phase 1 由本地 Mock 实现；Phase 3 把函数体换成真实的 HTTP 调用即可，
 * 签名保持不变，stores 与页面无需改动。
 */

export function login(payload: LoginPayload): Promise<AuthResult> {
  return mockApi.login(payload)
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return mockApi.register(payload)
}

export function logout(): Promise<void> {
  return mockApi.logout()
}

export function fetchCurrentUser(): Promise<CurrentUser | null> {
  return mockApi.fetchCurrentUser()
}
