<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
</script>

<template>
  <div class="card-skeleton" aria-hidden="true">
    <AppSkeleton height="auto" radius="0" class="card-skeleton__media" />
    <div class="card-skeleton__body">
      <AppSkeleton height="14px" />
      <AppSkeleton height="14px" width="70%" />
      <AppSkeleton height="20px" width="42%" />
      <AppSkeleton height="12px" width="55%" />
    </div>
  </div>
</template>

<style scoped>
.card-skeleton {
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.card-skeleton__media {
  aspect-ratio: 4 / 3;
}

.card-skeleton__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}
</style>
