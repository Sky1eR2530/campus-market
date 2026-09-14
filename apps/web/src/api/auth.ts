import type { AuthResult, CurrentUser, LoginPayload, RegisterPayload } from '@campus/shared'
import { isAppError } from '@/utils/error'
import { http, requestData } from './http'
import { clearToken, getToken, setToken } from './token'

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const result = await requestData<AuthResult>({ url: '/auth/login', method: 'POST', data: payload })
  setToken(result.token)
  return result
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const result = await requestData<AuthResult>({
    url: '/auth/register',
    method: 'POST',
    data: payload
  })
  setToken(result.token)
  return result
}

export async function logout(): Promise<void> {
  try {
    await http.post('/auth/logout')
  } finally {
    // 无状态 token：无论服务端是否响应，本地都要清干净
    clearToken()
  }
}

/**
 * 恢复登录态。
 * 没有本地令牌时直接返回 null，不发无意义的请求；
 * 令牌失效时 interceptor 已经清理过，这里按未登录处理而不是把错误抛给页面。
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (!getToken()) return null

  try {
    return await requestData<CurrentUser>({ url: '/auth/me' })
  } catch (error) {
    if (isAppError(error) && (error.status === 401 || error.status === 403)) return null
    throw error
  }
}
