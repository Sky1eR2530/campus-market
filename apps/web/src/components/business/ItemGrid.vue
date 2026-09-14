<script setup lang="ts">
import type { Item } from '@campus/shared'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import ItemCard from './ItemCard.vue'
import ItemCardSkeleton from './ItemCardSkeleton.vue'

withDefaults(
  defineProps<{
    items: Item[]
    loading?: boolean
    error?: string | null
    skeletonCount?: number
    /** 空状态文案，不同页面语境不同 */
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    loading: false,
    error: null,
    skeletonCount: 8,
    emptyTitle: '这里还没有闲置',
    emptyDescription: '换个筛选条件试试，或者成为第一个发布的人。'
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <AppErrorState v-if="error" :message="error" @retry="emit('retry')" />

  <div v-else-if="loading" class="item-grid">
    <ItemCardSkeleton v-for="index in skeletonCount" :key="index" />
  </div>

  <AppEmpty
    v-else-if="items.length === 0"
    :title="emptyTitle"
    :description="emptyDescription"
    icon="inbox"
  >
    <slot name="empty" />
  </AppEmpty>

  <div v-else class="item-grid">
    <ItemCard v-for="item in items" :key="item.id" :item="item" />
  </div>
</template>

<style scoped>
.item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .item-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .item-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
