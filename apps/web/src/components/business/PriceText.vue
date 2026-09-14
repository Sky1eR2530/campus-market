<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@campus/shared'

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
  line-height: 1.15;
}

.price__symbol {
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
}

/*
 * 价格是整个界面里最需要被一眼扫到的信息。
 * 用衬线数字而不是粗黑体：它读起来像价签，而不是促销牌，
 * 也更符合一个校园二手平台该有的语气。
 * lining-nums 是必须的——Georgia 默认输出旧式数字，会和 ¥ 对不齐。
 */
.price__value {
  font-family: var(--font-numeric);
  font-weight: var(--weight-semibold);
  font-variant-numeric: lining-nums tabular-nums;
  letter-spacing: -0.01em;
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
