<script setup lang="ts">
import type { Category } from '@campus/shared'
import { computed } from 'vue'
import { AppIcon, CATEGORY_ICON_NAMES } from '@campus/ui'

const props = defineProps<{ category: Category; showCount?: boolean }>()

const icon = computed(() => CATEGORY_ICON_NAMES[props.category.icon] ?? 'box')
</script>

<template>
  <!--
    分类是导航，不是内容。
    给六个导航项各套一个带边框和箭头的卡片会让首页看起来全是框，
    这里改用图标宫格：一眼扫完，也不需要箭头提示「可点击」。
  -->
  <RouterLink
    class="category-tile"
    :to="{ name: 'items', query: { category: category.slug } }"
    :aria-label="`查看${category.name}分类`"
  >
    <span class="category-tile__icon"><AppIcon :name="icon" :size="24" /></span>
    <span class="category-tile__name">{{ category.name }}</span>
    <span v-if="showCount !== false" class="category-tile__count">
      {{ category.itemCount }} 件
    </span>
  </RouterLink>
</template>

<style scoped>
.category-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.category-tile:hover {
  background: var(--color-primary-50);
}

.category-tile__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: var(--space-1);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--color-primary-600);
  border: 1px solid var(--border-default);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.category-tile:hover .category-tile__icon {
  border-color: var(--color-primary-300);
  color: var(--color-primary-700);
}

.category-tile__name {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.category-tile__count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>
