import { AppError, ERROR_CODES } from '@campus/shared'
import type { ErrorCode, Paginated } from '@campus/shared'
import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios'
import { clearToken, getToken } from './token'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { Accept: 'application/json' }
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 令牌失效时的回调。
 * 通过注册而不是直接 import store，避免 http ↔ store ↔ api 形成循环依赖。
 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
}

/**
 * 把各种失败统一转换成 AppError。
 * 页面层只需要处理一种错误类型，不用区分是网络问题还是后端返回的业务错误。
 */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status
    const body = error.response?.data

    if (status === 401) {
      // 令牌已失效：清掉本地登录态，并通知上层跳转登录
      clearToken()
      onUnauthorized?.()
    }

    if (body?.error) {
      return Promise.reject(
        new AppError(
          (body.error.code as ErrorCode) ?? ERROR_CODES.INTERNAL_ERROR,
          body.error.message ?? '请求失败',
          status ?? 400,
          body.error.details ?? null
        )
      )
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new AppError(ERROR_CODES.NETWORK_ERROR, '请求超时，请稍后重试', 408))
    }

    if (!error.response) {
      return Promise.reject(
        new AppError(ERROR_CODES.NETWORK_ERROR, '网络连接失败，请检查网络后重试', 0)
      )
    }

    return Promise.reject(
      new AppError(ERROR_CODES.INTERNAL_ERROR, error.message, status ?? 500)
    )
  }
)

/** 取出成功响应 `{ data: ... }` 里的内容 */
export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<{ data: T }>(config)
  return response.data.data
}

/** 列表响应本身就是一个 `{ data, meta }` 信封 */
export async function requestList<T>(config: AxiosRequestConfig): Promise<Paginated<T>> {
  const response = await http.request<Paginated<T>>(config)
  return response.data
}
