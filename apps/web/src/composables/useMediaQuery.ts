import type { Ref } from 'vue'
import { onUnmounted, ref } from 'vue'

/** 响应式媒体查询。用于「桌面显示侧边栏 / 移动显示底部 Tab」这类结构性差异 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mediaQueryList = window.matchMedia(query)
    matches.value = mediaQueryList.matches
    const handler = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }
    mediaQueryList.addEventListener('change', handler)
    onUnmounted(() => mediaQueryList.removeEventListener('change', handler))
  }

  return matches
}

/** 常用断点，与 tokens.css 中的媒体查询保持一致 */
export const BREAKPOINT_DESKTOP = '(min-width: 1024px)'
export const BREAKPOINT_TABLET = '(min-width: 768px)'
