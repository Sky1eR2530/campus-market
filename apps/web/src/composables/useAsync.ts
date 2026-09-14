import type { Ref } from 'vue'
import { ref, shallowRef } from 'vue'
import { toErrorMessage } from '@/utils/error'

export interface UseAsyncResult<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  /** 重新执行，用于「重试」按钮 */
  run: () => Promise<void>
  reset: () => void
}

/**
 * 统一处理异步请求的加载 / 成功 / 失败三态。
 * 内部用请求序号丢弃过期响应，避免快速切换筛选条件时旧数据覆盖新数据。
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  options: { immediate?: boolean } = {}
): UseAsyncResult<T> {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  async function run(): Promise<void> {
    const current = (requestId += 1)
    loading.value = true
    error.value = null

    try {
      const result = await loader()
      if (current !== requestId) return
      data.value = result
    } catch (caught) {
      if (current !== requestId) return
      error.value = toErrorMessage(caught)
      data.value = null
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  function reset(): void {
    requestId += 1
    data.value = null
    error.value = null
    loading.value = false
  }

  if (options.immediate !== false) void run()

  return { data, loading, error, run, reset }
}
