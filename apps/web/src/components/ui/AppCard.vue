<script setup lang="ts">
withDefaults(defineProps<{ pad?: boolean; interactive?: boolean; tag?: string }>(), {
  pad: true,
  interactive: false,
  tag: 'div'
})
</script>

<template>
  <component :is="tag" class="card" :class="{ 'card--pad': pad, 'card--interactive': interactive }">
    <slot />
  </component>
</template>
