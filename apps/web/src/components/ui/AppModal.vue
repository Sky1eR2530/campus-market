<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { AppIcon } from '@campus/ui'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    size?: 'sm' | 'md'
    /** 点击遮罩是否关闭。确认类弹窗应设为 false，避免误触丢失输入 */
    closeOnBackdrop?: boolean
  }>(),
  { title: '', description: '', size: 'sm', closeOnBackdrop: true }
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
let previousOverflow = ''
let lastFocused: HTMLElement | null = null

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

function lockScroll(): void {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockScroll(): void {
  document.body.style.overflow = previousOverflow
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null
      lockScroll()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      panel.value?.focus()
    } else {
      unlockScroll()
      document.removeEventListener('keydown', onKeydown)
      // 关闭后把焦点还给触发按钮，键盘用户不会「迷路」
      lastFocused?.focus?.()
    }
  }
)

onUnmounted(() => {
  unlockScroll()
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop"
        @click.self="closeOnBackdrop && emit('close')"
      >
        <div
          ref="panel"
          class="modal-panel"
          :class="`modal-panel--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title || undefined"
          tabindex="-1"
        >
          <header v-if="title" class="modal-head">
            <div>
              <h2 class="modal-title">{{ title }}</h2>
              <p v-if="description" class="modal-desc">{{ description }}</p>
            </div>
            <button class="modal-close" type="button" aria-label="关闭" @click="emit('close')">
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(20, 26, 34, 0.45);
  backdrop-filter: blur(2px);
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 88vh;
  background: var(--bg-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-lg);
  outline: none;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.modal-title {
  font-size: var(--text-lg);
}

.modal-desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 0 var(--space-5) var(--space-5);
  overflow-y: auto;
}

.modal-foot {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5) calc(var(--space-5) + var(--safe-bottom));
  border-top: 1px solid var(--border-default);
}

.modal-foot > :deep(*) {
  flex: 1;
}

@media (min-width: 768px) {
  .modal-backdrop {
    align-items: center;
    padding: var(--space-6);
  }

  .modal-panel {
    border-radius: var(--radius-xl);
  }

  .modal-panel--sm {
    max-width: 420px;
  }

  .modal-panel--md {
    max-width: 560px;
  }

  .modal-foot {
    justify-content: flex-end;
  }

  .modal-foot > :deep(*) {
    flex: none;
    min-width: 96px;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(16px);
}
</style>
