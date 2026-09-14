<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    circle?: boolean
  }>(),
  { width: '100%', height: '16px', radius: 'var(--radius-sm)', circle: false }
)

const style = computed(() => ({
  display: 'block',
  width: props.width,
  height: props.height,
  borderRadius: props.circle ? 'var(--radius-full)' : props.radius
}))
</script>

<template>
  <span class="skeleton" :style="style" aria-hidden="true" />
</template>
