<script setup lang="ts">
import { AppIcon } from '@campus/ui'
import { useAdminToastStore } from '@/stores/toast'

const toast = useAdminToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="admin-toasts" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="item in toast.toasts"
          :key="item.id"
          class="admin-toast"
          :class="`admin-toast--${item.tone}`"
        >
          <span class="admin-toast__icon">
            <AppIcon :name="item.tone === 'success' ? 'check' : 'alert'" :size="16" />
          </span>
          <span>{{ item.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
