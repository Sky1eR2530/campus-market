<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  page: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

/** 页码列表，超过 7 页时折行显示省略号，避免页码撑满一行 */
const items = computed<(number | 'gap')[]>(() => {
  const { totalPages, page } = props
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const result: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) result.push('gap')
  for (let current = start; current <= end; current += 1) result.push(current)
  if (end < totalPages - 1) result.push('gap')
  result.push(totalPages)
  return result
})

function go(next: number): void {
  const target = Math.min(props.totalPages, Math.max(1, next))
  if (target !== props.page) emit('update:page', target)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pager" aria-label="分页导航">
    <button class="pager__nav" type="button" :disabled="page <= 1" @click="go(page - 1)">
      <AppIcon name="chevronLeft" :size="16" />
      <span class="pager__nav-text">上一页</span>
    </button>

    <div class="pager__pages">
      <template v-for="(item, index) in items" :key="`${item}-${index}`">
        <span v-if="item === 'gap'" class="pager__gap" aria-hidden="true">…</span>
        <button
          v-else
          class="pager__page"
          :class="{ 'pager__page--active': item === page }"
          type="button"
          :aria-current="item === page ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </template>
    </div>

    <span class="pager__summary">第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 件</span>

    <button class="pager__nav" type="button" :disabled="page >= totalPages" @click="go(page + 1)">
      <span class="pager__nav-text">下一页</span>
      <AppIcon name="chevronRight" :size="16" />
    </button>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.pager__nav {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.pager__nav:hover:not(:disabled) {
  border-color: var(--color-primary-300);
  color: var(--color-primary-700);
}

.pager__nav:disabled {
  opacity: 0.45;
}

.pager__pages {
  display: none;
  gap: var(--space-1);
}

.pager__page {
  min-width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.pager__page:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.pager__page--active,
.pager__page--active:hover {
  background: var(--color-primary-600);
  color: #fff;
  font-weight: var(--weight-semibold);
}

.pager__gap {
  display: flex;
  align-items: center;
  padding: 0 var(--space-1);
  color: var(--text-tertiary);
}

.pager__summary {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .pager {
    justify-content: flex-end;
  }

  .pager__pages {
    display: flex;
  }

  .pager__nav-text {
    display: none;
  }

  .pager__nav {
    padding: 0 var(--space-2);
  }

  .pager__summary {
    margin-left: var(--space-2);
    margin-right: var(--space-2);
  }
}
</style>
