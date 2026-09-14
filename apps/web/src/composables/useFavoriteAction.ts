import type { Item } from '@campus/shared'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorites'
import { toErrorMessage } from '@/utils/error'
import { useToast } from './useToast'

/**
 * 收藏交互。
 * 未登录时不是简单报错，而是提示后跳转登录页，登录成功再回到原页面，
 * 列表页和详情页都需要这套行为，所以抽在这里而不是各写一遍。
 */
export function useFavoriteAction() {
  const auth = useAuthStore()
  const favorites = useFavoriteStore()
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()

  function isFavorited(item: Pick<Item, 'id' | 'isFavorited'>): boolean {
    return auth.isAuthenticated ? favorites.has(item.id) : item.isFavorited
  }

  function isPending(itemId: string): boolean {
    return favorites.isPending(itemId)
  }

  async function toggle(item: Pick<Item, 'id'>): Promise<void> {
    if (!auth.isAuthenticated) {
      toast.info('登录后即可收藏商品')
      await router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }

    try {
      const favorited = await favorites.toggle(item.id)
      toast.success(favorited ? '已加入收藏' : '已取消收藏')
    } catch (error) {
      toast.error(toErrorMessage(error, '收藏操作失败，请重试'))
    }
  }

  return { toggle, isFavorited, isPending }
}
