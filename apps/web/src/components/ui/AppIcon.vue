<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from './icons'
import type { IconName } from './icons'

/**
 * 图标组件。
 * 使用内联 SVG 而非图标字体：体积更小、颜色跟随 currentColor、
 * 不会因为字体文件缺失而出现方块，也不需要引入额外依赖。
 */
const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
  }>(),
  { size: 20, strokeWidth: 1.7 }
)

const markup = computed(() => ICONS[props.name] ?? '')
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="markup"
  />
</template>

<style scoped>
.app-icon {
  display: block;
  flex: none;
}
</style>
