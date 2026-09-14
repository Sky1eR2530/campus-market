<script setup lang="ts">
import { AppIcon } from '@campus/ui'
import type { IconName } from '@campus/ui'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const ICON_BY_TONE: Record<string, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info'
}
</script>

<template>
  <Teleport to="body">
    <div class="toaster" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.tone}`"
        >
          <span class="toast__icon"><AppIcon :name="ICON_BY_TONE[toast.tone] ?? 'info'" :size="16" /></span>
          <span class="toast__text">{{ toast.message }}</span>
          <button class="toast__close" type="button" aria-label="关闭提示" @click="ui.dismiss(toast.id)">
            <AppIcon name="close" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toaster {
  position: fixed;
  top: calc(var(--space-4) + env(safe-area-inset-top, 0px));
  left: 50%;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: calc(100% - var(--space-8));
  max-width: 420px;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  flex: none;
}

.toast--success .toast__icon {
  background: var(--color-success-50);
  color: var(--color-success-500);
}

.toast--error .toast__icon {
  background: var(--color-danger-50);
  color: var(--color-danger-500);
}

.toast--info .toast__icon {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.toast__text {
  flex: 1;
  font-size: var(--text-base);
  color: var(--text-primary);
}

.toast__close {
  flex: none;
  color: var(--text-tertiary);
  padding: 2px;
}

.toast__close:hover {
  color: var(--text-primary);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
