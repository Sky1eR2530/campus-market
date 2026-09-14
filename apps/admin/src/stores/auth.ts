import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '@campus/api-client'
import { AppError } from '@campus/shared'
import type { CurrentUser, LoginPayload } from '@campus/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const user = ref<CurrentUser | null>(null)
  const ready = ref(false)

  const isAdmin = computed(() => user.value?.role === 'admin')

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

  /**
   * 管理员登录。
   * 非管理员在这里就被挡住并立刻登出——后台不应该出现「能登录但什么都看不到」
   * 这种含糊状态，服务端还有一层 403 兜底。
   */
  async function login(payload: LoginPayload): Promise<CurrentUser> {
    const result = await apiLogin(payload)
    if (result.user.role !== 'admin') {
      await apiLogout()
      throw new AppError('FORBIDDEN', '该账号不是管理员，无法登录后台', 403)
    }
    user.value = result.user
    return result.user
  }

  async function logout(): Promise<void> {
    await apiLogout()
    user.value = null
  }

  function clear(): void {
    user.value = null
  }

  return { user, ready, isAdmin, restore, login, logout, clear }
})
