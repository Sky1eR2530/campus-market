<script setup lang="ts">
import type { Item } from '@campus/shared'
import { formatRelativeTime } from '@campus/shared'
import { computed } from 'vue'
import AppImage from '@/components/ui/AppImage.vue'
import FavoriteButton from './FavoriteButton.vue'
import ItemStatusTag from './ItemStatusTag.vue'
import PriceText from './PriceText.vue'

const props = withDefaults(
  defineProps<{
    item: Item
    /**
     * 卡片标题的标题级别。
     * 首页的卡片在 h2 区块之下用 h3；列表页的页面标题是 h1，
     * 卡片需要是 h2，否则会跳过一级。
     */
    headingLevel?: 2 | 3
  }>(),
  { headingLevel: 3 }
)

const cover = computed(() => props.item.images[0]?.url ?? '')
const isInactive = computed(() => props.item.status !== 'on_sale')
</script>

<template>
  <!--
    这里刻意不是一个「卡片」：没有边框、没有底色、没有阴影。
    整屏二十个一模一样的圆角盒子是模板站点的典型特征，
    而这个页面真正要突出的是照片和价格，不是容器。
  -->
  <article class="item-card">
    <RouterLink
      class="item-card__link"
      :to="{ name: 'item-detail', params: { id: item.id } }"
      :aria-label="`查看商品：${item.title}`"
    >
      <div class="item-card__media" :class="{ 'is-inactive': isInactive }">
        <AppImage :src="cover" :alt="item.title" ratio="4 / 3" />
        <span v-if="isInactive" class="item-card__status">
          <ItemStatusTag :status="item.status" />
        </span>
      </div>

      <!--
        价格紧贴照片，而不是压在标题下面。
        二手交易里价格是第一筛选条件，而且照片高度固定，
        价格因此能横向连成一条线——一眼扫过去就能比较贵贱。
      -->
      <PriceText class="item-card__price" :cents="item.priceCents" size="lg" :muted="isInactive" />

      <component :is="`h${headingLevel}`" class="item-card__title clamp-2">
        {{ item.title }}
      </component>

      <p class="item-card__meta">
        <span class="item-card__seller truncate">{{ item.seller?.nickname ?? '匿名用户' }}</span>
        <span class="item-card__time">{{ formatRelativeTime(item.publishedAt) }}</span>
      </p>
    </RouterLink>

    <div class="item-card__fav">
      <FavoriteButton :item="item" />
    </div>
  </article>
</template>

<style scoped>
.item-card {
  position: relative;
}

.item-card__link {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-card__media {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
}

/*
 * 用一圈内描边表达可点击，而不是位移 + 阴影。
 * 满屏的卡片一起上浮是模板感最重的一种做法；
 * 这里只让悬停的那一张的边界变清晰。
 */
.item-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px var(--color-primary-500);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.item-card:hover .item-card__media::after {
  opacity: 1;
}

.item-card__status {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  overflow: hidden;
  border-radius: var(--radius-sm);
  /* 状态标签有自己的浅色底，加一点阴影才能从照片上分离出来 */
  box-shadow: var(--shadow-xs);
}

.item-card__price {
  /* 收紧与照片的距离，让价格读起来像照片的价签 */
  margin-top: calc(var(--space-1) * -1);
}

.item-card__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.item-card:hover .item-card__title {
  color: var(--color-primary-700);
}

.item-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.item-card__seller {
  max-width: 62%;
}

.item-card__time {
  white-space: nowrap;
}

.item-card__fav {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

/*
 * 已售/下架的商品让照片退后，但状态标签要保持原样。
 * 之前给整个媒体区加 opacity，叠在上面的标签会被一起变淡，
 * 对比度掉到 4.23:1，低于 WCAG AA 的 4.5:1。
 */
.item-card__media.is-inactive :deep(.app-image) {
  opacity: 0.8;
}
</style>
