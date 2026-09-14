<script setup lang="ts">
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import AppToaster from '@/components/ui/AppToaster.vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorites'

const auth = useAuthStore()
const favorites = useFavoriteStore()

// 登录态变化时同步收藏，保证「我的收藏」和按钮状态永远和当前账号一致
watch(
  () => auth.user?.id ?? null,
  async (userId) => {
    if (userId) {
      await favorites.load().catch(() => favorites.reset())
    } else {
      favorites.reset()
    }
  },
  { immediate: true }
)
</script>

<template>
  <RouterView />
  <AppToaster />
</template>
