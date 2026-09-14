import { useUiStore } from '@/stores/ui'

/** useUiStore 的便捷包装，让组件里只关心「提示什么」 */
export function useToast() {
  const ui = useUiStore()

  return {
    success: (message: string) => ui.success(message),
    error: (message: string) => ui.error(message),
    info: (message: string) => ui.info(message),
    dismiss: (id: number) => ui.dismiss(id)
  }
}
