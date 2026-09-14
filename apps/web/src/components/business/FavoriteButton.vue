<script setup lang="ts">
import type { Item } from '@campus/shared'
import { computed } from 'vue'
import { AppIcon, AppSpinner } from '@campus/ui'
import { useFavoriteAction } from '@/composables/useFavoriteAction'

const props = withDefaults(
  defineProps<{
    item: Pick<Item, 'id' | 'isFavorited'>
    /** icon：卡片右上角的圆形按钮；button：详情页的宽按钮 */
    variant?: 'icon' | 'button'
  }>(),
  { variant: 'icon' }
)

const { toggle, isFavorited, isPending } = useFavoriteAction()

const active = computed(() => isFavorited(props.item))
const pending = computed(() => isPending(props.item.id))

async function onClick(): Promise<void> {
  await toggle(props.item)
}
</script>

<template>
  <button
    v-if="variant === 'icon'"
    class="fav-icon"
    :class="{ 'fav-icon--active': active }"
    type="button"
    :aria-pressed="active"
    :aria-label="active ? '取消收藏' : '收藏商品'"
    @click.prevent.stop="onClick"
  >
    <AppSpinner v-if="pending" :size="14" />
    <AppIcon v-else :name="active ? 'heartFilled' : 'heart'" :size="17" />
  </button>

  <button
    v-else
    class="btn btn--secondary btn--lg"
    :class="{ 'fav-button--active': active }"
    type="button"
    :aria-pressed="active"
    @click="onClick"
  >
    <AppSpinner v-if="pending" :size="16" />
    <AppIcon v-else :name="active ? 'heartFilled' : 'heart'" :size="18" />
    {{ active ? '已收藏' : '收藏' }}
  </button>
</template>

<style scoped>
.fav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.93);
  color: var(--text-secondary);
  box-shadow: var(--shadow-xs);
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.fav-icon:hover {
  transform: scale(1.06);
}

.fav-icon--active {
  color: var(--color-accent-500);
}

.fav-button--active {
  border-color: var(--color-accent-500);
  color: var(--color-accent-600);
}

.fav-button--active:hover:not(:disabled) {
  background: var(--color-accent-50);
  border-color: var(--color-accent-500);
  color: var(--color-accent-600);
}
</style>
