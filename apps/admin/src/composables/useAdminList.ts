import { toErrorMessage } from '@campus/api-client'
import type { Paginated, PaginationMeta } from '@campus/shared'
import { ref, shallowRef } from 'vue'

/**
 * 后台列表的加载 / 分页 / 错误处理。
 * 四个管理页面都是「筛选 → 请求 → 表格 → 分页」这一套，抽出来避免各写一遍。
 * 内部用请求序号丢弃过期响应，避免快速切换筛选条件时旧数据覆盖新数据。
 */
export function useAdminList<T>(loader: (page: number) => Promise<Paginated<T>>) {
  const items = shallowRef<T[]>([])
  const meta = shallowRef<PaginationMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  let requestId = 0

  async function load(target: number = page.value): Promise<void> {
    const current = (requestId += 1)
    loading.value = true
    error.value = null

    try {
      const result = await loader(target)
      if (current !== requestId) return
      items.value = result.data
      meta.value = result.meta
      page.value = result.meta.page
    } catch (caught) {
      if (current !== requestId) return
      error.value = toErrorMessage(caught, '加载失败，请重试')
      items.value = []
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  return { items, meta, loading, error, page, load }
}
