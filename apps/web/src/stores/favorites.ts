import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { addFavorite, fetchFavoriteIds, removeFavorite } from '@campus/api-client'

/**
 * 收藏状态。
 * 列表页、详情页、用户中心都要判断「这件商品有没有被收藏」，
 * 集中在这里可以保证三处状态一致，并且点击后无需等待接口返回。
 */
export const useFavoriteStore = defineStore('favorites', () => {
  const ids = ref<string[]>([])
  const loaded = ref(false)
  const pendingIds = ref<string[]>([])

  const count = computed(() => ids.value.length)

  function has(itemId: string): boolean {
    return ids.value.includes(itemId)
  }

  function isPending(itemId: string): boolean {
    return pendingIds.value.includes(itemId)
  }

  async function load(): Promise<void> {
    ids.value = await fetchFavoriteIds()
    loaded.value = true
  }

  function reset(): void {
    ids.value = []
    loaded.value = false
    pendingIds.value = []
  }

  /** 切换收藏，返回切换后的状态。先更新界面，失败再回滚 */
  async function toggle(itemId: string): Promise<boolean> {
    if (isPending(itemId)) return has(itemId)

    const previous = ids.value
    const next = !has(itemId)
    ids.value = next ? [itemId, ...previous] : previous.filter((id) => id !== itemId)
    pendingIds.value = [...pendingIds.value, itemId]

    try {
      if (next) {
        await addFavorite(itemId)
      } else {
        await removeFavorite(itemId)
      }
      return next
    } catch (error) {
      ids.value = previous
      throw error
    } finally {
      pendingIds.value = pendingIds.value.filter((id) => id !== itemId)
    }
  }

  return { ids, loaded, pendingIds, count, has, isPending, load, reset, toggle }
})
