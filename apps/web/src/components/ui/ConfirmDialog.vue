<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import AppModal from './AppModal.vue'
import type { IconName } from './icons'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    tone?: 'danger' | 'primary'
    icon?: IconName
    loading?: boolean
  }>(),
  { confirmText: '确认', cancelText: '取消', tone: 'primary', icon: 'alert', loading: false }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal :open="open" :close-on-backdrop="false" @close="emit('cancel')">
    <div class="confirm">
      <span class="confirm__icon" :class="`confirm__icon--${tone}`">
        <AppIcon :name="icon" :size="22" />
      </span>
      <h2 class="confirm__title">{{ title }}</h2>
      <p class="confirm__message">{{ message }}</p>
    </div>

    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">
        {{ cancelText }}
      </AppButton>
      <AppButton :variant="tone === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmText }}
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-2);
  text-align: center;
}

.confirm__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}

.confirm__icon--danger {
  background: var(--color-danger-50);
  color: var(--color-danger-500);
}

.confirm__icon--primary {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.confirm__title {
  font-size: var(--text-md);
}

.confirm__message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}
</style>
