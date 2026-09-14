import type { CurrentUser, LoginPayload, RegisterPayload } from '@campus/shared'
import {
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister
} from '@campus/api-client'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  /** 应用启动时恢复登录态。失败按未登录处理，不阻塞页面渲染 */
  async function restore(): Promise<void> {
    if (ready.value) return
    try {
      user.value = await fetchCurrentUser()
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  async function login(payload: LoginPayload): Promise<CurrentUser> {
    const result = await apiLogin(payload)
    user.value = result.user
    return result.user
  }

  async function register(payload: RegisterPayload): Promise<CurrentUser> {
    const result = await apiRegister(payload)
    user.value = result.user
    return result.user
  }

  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } finally {
      user.value = null
    }
  }

  function setUser(next: CurrentUser | null): void {
    user.value = next
  }

  return { user, ready, isAuthenticated, isAdmin, restore, login, register, logout, setUser }
})
