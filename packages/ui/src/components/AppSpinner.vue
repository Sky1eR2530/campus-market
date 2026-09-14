<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ size?: number; label?: string }>(), {
  size: 16,
  label: ''
})

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderWidth: `${Math.max(2, props.size / 8)}px`
}))
</script>

<template>
  <span class="spinner" :style="style" role="status" :aria-label="label || '加载中'" />
</template>
