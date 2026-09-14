<script setup lang="ts">
import type { Item } from '@campus/shared'
import { computed, ref } from 'vue'
import { fetchFavorites } from '@/api/favorites'
import ItemGrid from '@/components/business/ItemGrid.vue'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useFavoriteStore } from '@/stores/favorites'
import { toErrorMessage } from '@/utils/error'

const favorites = useFavoriteStore()
const toast = useToast()

const page = ref(1)
const list = useAsync(() => fetchFavorites(page.value))

const items = computed<Item[]>(() => list.data.value?.data ?? [])
const meta = computed(() => list.data.value?.meta ?? null)

function setPage(next: number): void {
  page.value = next
  void list.run()
}

/**
 * 取消收藏统一走 store，保证底部标签栏的收藏角标和这里同步。
 * 取消后重新拉取列表，避免被取消的商品还留在页面上。
 */
async function remove(item: Item): Promise<void> {
  try {
    await favorites.toggle(item.id)
    toast.success('已取消收藏')
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  }
}
</script>

<template>
  <section class="favorites">
    <header class="head">
      <h1 class="head__title">我的收藏</h1>
      <p class="head__desc">
        共 {{ meta?.total ?? favorites.count }} 件商品。商品被卖家下架后仍会留在这里，方便你回看。
      </p>
    </header>

    <AppErrorState
      v-if="list.error.value"
      :message="list.error.value"
      size="compact"
      @retry="list.run"
    />

    <div v-else-if="list.loading.value" class="grid">
      <span v-for="index in 4" :key="index" class="skeleton grid__skeleton" />
    </div>

    <AppEmpty
      v-else-if="items.length === 0"
      title="收藏夹还是空的"
      description="在商品详情页点一下爱心，就能把它收进这里，之后慢慢比较。"
      icon="heart"
      size="compact"
    >
      <RouterLink class="btn btn--primary btn--md" :to="{ name: 'items' }">
        <AppIcon name="grid" :size="16" />
        <span>去逛逛闲置</span>
      </RouterLink>
    </AppEmpty>

    <template v-else>
      <ItemGrid :items="items" />

      <ul class="remove-row">
        <li v-for="item in items" :key="item.id" class="remove-row__item">
          <span class="remove-row__title truncate">{{ item.title }}</span>
          <button class="remove-row__btn" type="button" @click="remove(item)">
            <AppIcon name="close" :size="14" />
            <span>取消收藏</span>
          </button>
        </li>
      </ul>
    </template>

    <AppPagination
      v-if="meta && !list.loading.value && !list.error.value"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      @update:page="setPage"
    />
  </section>
</template>

<style scoped>
.favorites {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.head__title {
  font-size: var(--text-lg);
}

.head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.grid__skeleton {
  height: 200px;
  border-radius: var(--radius-lg);
}

.remove-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
}

.remove-row__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.remove-row__title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.remove-row__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 4px var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.remove-row__btn:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-500);
}

@media (min-width: 768px) {
  .head__title {
    font-size: var(--text-xl);
  }

  .remove-row {
    display: none;
  }
}
</style>
