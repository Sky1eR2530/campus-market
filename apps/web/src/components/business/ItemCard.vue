<script setup lang="ts">
import type { Item } from '@campus/shared'
import { computed } from 'vue'
import AppImage from '@/components/ui/AppImage.vue'
import FavoriteButton from './FavoriteButton.vue'
import ItemStatusTag from './ItemStatusTag.vue'
import PriceText from './PriceText.vue'
import { formatRelativeTime } from '@/utils/format'

const props = defineProps<{ item: Item }>()

const cover = computed(() => props.item.images[0]?.url ?? '')
const isInactive = computed(() => props.item.status !== 'on_sale')
</script>

<template>
  <article class="item-card" :class="{ 'item-card--inactive': isInactive }">
    <RouterLink
      class="item-card__link"
      :to="{ name: 'item-detail', params: { id: item.id } }"
      :aria-label="`查看商品：${item.title}`"
    >
      <div class="item-card__media">
        <AppImage :src="cover" :alt="item.title" ratio="4 / 3" />
        <span v-if="isInactive" class="item-card__status">
          <ItemStatusTag :status="item.status" />
        </span>
      </div>

      <div class="item-card__body">
        <h3 class="item-card__title clamp-2">{{ item.title }}</h3>

        <PriceText :cents="item.priceCents" size="md" :muted="isInactive" />

        <div class="item-card__meta">
          <span class="item-card__seller truncate">{{ item.seller?.nickname ?? '匿名用户' }}</span>
          <span class="item-card__time">{{ formatRelativeTime(item.publishedAt) }}</span>
        </div>
      </div>
    </RouterLink>

    <div class="item-card__fav">
      <FavoriteButton :item="item" />
    </div>
  </article>
</template>

<style scoped>
.item-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-base),
    transform var(--transition-base);
}

.item-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.item-card--inactive .item-card__title,
.item-card--inactive .item-card__meta {
  color: var(--text-tertiary);
}

.item-card--inactive .item-card__media {
  opacity: 0.72;
}

.item-card__link {
  display: block;
}

.item-card__media {
  position: relative;
}

.item-card__status {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: 2px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
}

.item-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

.item-card__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  min-height: calc(var(--text-base) * var(--leading-normal) * 2);
}

.item-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-neutral-100);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.item-card__seller {
  max-width: 60%;
}

.item-card__time {
  white-space: nowrap;
}

.item-card__fav {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}
</style>
