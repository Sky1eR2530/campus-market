import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'info' | 'success' | 'error'

export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

const DEFAULT_DURATION = 2600
const ERROR_DURATION = 3800

/** 全局提示条。所有操作反馈统一走这里，避免每个页面各写一套弹窗 */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  let sequence = 0

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(message: string, tone: ToastTone = 'info', duration = DEFAULT_DURATION): number {
    const id = (sequence += 1)
    toasts.value = [...toasts.value, { id, message, tone }]
    window.setTimeout(() => dismiss(id), duration)
    return id
  }

  const success = (message: string): number => push(message, 'success')
  const error = (message: string): number => push(message, 'error', ERROR_DURATION)
  const info = (message: string): number => push(message, 'info')

  return { toasts, push, dismiss, success, error, info }
})
