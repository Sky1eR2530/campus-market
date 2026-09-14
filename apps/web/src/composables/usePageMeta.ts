import { APP_NAME } from '@campus/shared'
import type { MaybeRef } from 'vue'
import { unref, watchEffect } from 'vue'

/** 设置页面标题。商品详情这类标题是动态的页面用它覆盖路由 meta 中的默认标题 */
export function usePageMeta(title: MaybeRef<string>): void {
  watchEffect(() => {
    const value = unref(title)
    document.title = value ? `${value} · ${APP_NAME}` : APP_NAME
  })
}
