<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    message?: string
    retryText?: string
    size?: 'compact' | 'page'
  }>(),
  { message: '加载失败，请检查网络后重试', retryText: '重新加载', size: 'page' }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-state" :class="`error-state--${size}`" role="alert">
    <span class="error-state__icon"><AppIcon name="alert" :size="size === 'page' ? 28 : 22" /></span>
    <p class="error-state__message">{{ message }}</p>
    <AppButton variant="secondary" size="sm" @click="emit('retry')">
      <AppIcon name="refresh" :size="15" />
      {{ retryText }}
    </AppButton>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}

.error-state--page {
  padding: var(--space-12) var(--space-4);
}

.error-state--compact {
  padding: var(--space-8) var(--space-4);
}

.error-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-danger-50);
  color: var(--color-danger-500);
}

.error-state__message {
  max-width: 36ch;
  color: var(--text-secondary);
}
</style>
