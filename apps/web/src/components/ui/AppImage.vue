<script setup lang="ts">
import { ref, watch } from 'vue'
import { AppIcon } from '@campus/ui'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    /** CSS aspect-ratio，用于固定占位高度，避免图片加载时页面跳动 */
    ratio?: string
    fit?: 'cover' | 'contain'
    eager?: boolean
  }>(),
  { ratio: '1 / 1', fit: 'cover', eager: false }
)

const status = ref<'loading' | 'loaded' | 'error'>('loading')

watch(
  () => props.src,
  () => {
    status.value = 'loading'
  }
)
</script>

<template>
  <div class="app-image" :style="{ aspectRatio: ratio }">
    <span v-if="status === 'loading'" class="skeleton app-image__placeholder" />
    <span v-else-if="status === 'error'" class="app-image__fallback">
      <AppIcon name="image" :size="24" />
      <span class="app-image__fallback-text">图片无法显示</span>
    </span>

    <img
      v-if="status !== 'error'"
      class="app-image__el"
      :class="{ 'is-ready': status === 'loaded' }"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      :style="{ objectFit: fit }"
      @load="status = 'loaded'"
      @error="status = 'error'"
    />
  </div>
</template>

<style scoped>
.app-image {
  position: relative;
  overflow: hidden;
  background: var(--bg-subtle);
}

.app-image__placeholder,
.app-image__fallback {
  position: absolute;
  inset: 0;
}

.app-image__fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  color: var(--color-neutral-400);
}

.app-image__fallback-text {
  font-size: var(--text-xs);
}

.app-image__el {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.app-image__el.is-ready {
  opacity: 1;
}
</style>
