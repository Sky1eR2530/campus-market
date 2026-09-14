<script setup lang="ts">
import type { Category } from '@campus/shared'
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { CATEGORY_ICON_NAMES } from '@/components/ui/icons'

const props = defineProps<{ category: Category; showCount?: boolean }>()

const icon = computed(() => CATEGORY_ICON_NAMES[props.category.icon] ?? 'box')
</script>

<template>
  <RouterLink
    class="category-card"
    :to="{ name: 'items', query: { category: category.slug } }"
    :aria-label="`查看${category.name}分类`"
  >
    <span class="category-card__icon"><AppIcon :name="icon" :size="22" /></span>
    <span class="category-card__body">
      <span class="category-card__name">{{ category.name }}</span>
      <span v-if="showCount !== false" class="category-card__count">{{ category.itemCount }} 件在售</span>
    </span>
    <AppIcon class="category-card__arrow" name="chevronRight" :size="16" />
  </RouterLink>
</template>

<style scoped>
.category-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-base),
    transform var(--transition-base);
}

.category-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.category-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.category-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.category-card__name {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.category-card__count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.category-card__arrow {
  margin-left: auto;
  color: var(--color-neutral-300);
}
</style>
