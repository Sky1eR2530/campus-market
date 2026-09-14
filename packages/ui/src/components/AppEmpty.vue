<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: IconName
    /** compact 用于列表内部，页面级空状态用默认尺寸 */
    size?: 'compact' | 'page'
  }>(),
  { description: '', icon: 'inbox', size: 'page' }
)
</script>

<template>
  <div class="empty" :class="`empty--${size}`">
    <span class="empty__icon"><AppIcon :name="icon" :size="size === 'page' ? 30 : 24" /></span>
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <div v-if="$slots.default" class="empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty--page {
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
}

.empty--compact {
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
}

.empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-neutral-100);
  color: var(--text-tertiary);
}

.empty--compact .empty__icon {
  width: 48px;
  height: 48px;
}

.empty__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.empty__desc {
  max-width: 34ch;
  font-size: var(--text-base);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
}

.empty__action {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
</style>
