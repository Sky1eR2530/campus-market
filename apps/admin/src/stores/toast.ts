import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AdminToast {
  id: number
  message: string
  tone: 'success' | 'error'
}

const DURATION = 3200

/** 后台的操作反馈。写操作较多，统一的提示能显著减少「点了没反应」的困惑 */
export const useAdminToastStore = defineStore('admin-toast', () => {
  const toasts = ref<AdminToast[]>([])
  let sequence = 0

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(message: string, tone: AdminToast['tone']): void {
    const id = (sequence += 1)
    toasts.value = [...toasts.value, { id, message, tone }]
    window.setTimeout(() => dismiss(id), DURATION)
  }

  return {
    toasts,
    dismiss,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error')
  }
})
