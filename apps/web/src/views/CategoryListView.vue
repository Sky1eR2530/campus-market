<script setup lang="ts">
import type { Category } from '@campus/shared'
import { computed } from 'vue'
import { fetchCategories } from '@/api/categories'
import CategoryCard from '@/components/business/CategoryCard.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'

const categories = useAsync<Category[]>(fetchCategories)
const list = computed<Category[]>(() => categories.data.value ?? [])

usePageMeta('全部分类')
</script>

<template>
  <div class="container page">
    <header class="head">
      <h1 class="head__title">全部分类</h1>
      <p class="head__desc">按类别浏览校园里的闲置物品，找到需要的更快。</p>
    </header>

    <AppErrorState
      v-if="categories.error.value"
      :message="categories.error.value"
      @retry="categories.run"
    />

    <div v-else-if="categories.loading.value" class="grid">
      <span v-for="index in 6" :key="index" class="skeleton item" />
    </div>

    <div v-else class="grid">
      <CategoryCard v-for="category in list" :key="category.slug" :category="category" />
    </div>

    <footer class="foot">
      <RouterLink class="btn btn--secondary btn--md" :to="{ name: 'items' }">
        浏览全部闲置
      </RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-5);
}

.head__title {
  font-size: var(--text-xl);
}

.head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.item {
  height: 72px;
  border-radius: var(--radius-lg);
}

.foot {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
}

@media (min-width: 768px) {
  .head__title {
    font-size: var(--text-2xl);
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
