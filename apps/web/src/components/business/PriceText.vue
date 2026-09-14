<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    cents: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** 已售商品价格弱化显示 */
    muted?: boolean
  }>(),
  { size: 'md', muted: false }
)

const text = computed(() => formatPrice(props.cents))
</script>

<template>
  <p class="price" :class="[`price--${size}`, { 'price--muted': muted }]">
    <span class="price__symbol" aria-hidden="true">¥</span>
    <span class="price__value">{{ text }}</span>
    <span class="sr-only">元</span>
  </p>
</template>

<style scoped>
.price {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  color: var(--color-accent-600);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.price--muted {
  color: var(--text-secondary);
}

.price--sm .price__symbol {
  font-size: var(--text-xs);
}
.price--sm .price__value {
  font-size: var(--text-base);
}

.price--md .price__symbol {
  font-size: var(--text-sm);
}
.price--md .price__value {
  font-size: var(--text-lg);
}

.price--lg .price__symbol {
  font-size: var(--text-md);
}
.price--lg .price__value {
  font-size: var(--text-xl);
}

.price--xl .price__symbol {
  font-size: var(--text-lg);
}
.price--xl .price__value {
  font-size: var(--text-2xl);
}
</style>
