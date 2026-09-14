<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'success' | 'warning' | 'neutral' | 'primary' | 'danger' | 'outline'
    size?: 'sm' | 'lg'
  }>(),
  { tone: 'neutral', size: 'sm' }
)

const classes = computed(() => ['tag', `tag--${props.tone}`, { 'tag--lg': props.size === 'lg' }])
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
