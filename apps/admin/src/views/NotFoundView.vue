<script setup lang="ts">
import { AppIcon } from '@campus/ui'
</script>

<template>
  <div class="not-found">
    <AppIcon name="alert" :size="32" />
    <h1>页面不存在</h1>
    <p>后台没有这个页面，请从左侧导航进入。</p>
    <RouterLink class="btn btn--primary btn--md" :to="{ name: 'dashboard' }">
      返回数据概览
    </RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-16) var(--space-4);
  text-align: center;
  color: var(--text-tertiary);
}

.not-found h1 {
  font-size: var(--text-lg);
  color: var(--text-primary);
}
</style>
