<script setup lang="ts">
import { APP_NAME } from '@campus/shared'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <RouterLink class="logo" :to="{ name: 'home' }" :aria-label="`${APP_NAME} 首页`">
    <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M10 21 20.5 10.5M12.5 9.5h7.9c.6 0 1.1.5 1.1 1.1v7.9"
        fill="none"
        stroke="#fff"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="11" cy="21" r="2.4" fill="none" stroke="#fff" stroke-width="2" />
    </svg>
    <!-- 品牌名不应该被浏览器自动翻译 -->
    <span v-if="!compact" class="logo__text" translate="no">{{ APP_NAME }}</span>
  </RouterLink>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary-600);
}

.logo__mark {
  width: 30px;
  height: 30px;
  flex: none;
}

.logo__text {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  letter-spacing: -0.01em;
  color: var(--text-primary);
  white-space: nowrap;
}

@media (min-width: 768px) {
  .logo__mark {
    width: 32px;
    height: 32px;
  }

  .logo__text {
    font-size: var(--text-xl);
  }
}
</style>
