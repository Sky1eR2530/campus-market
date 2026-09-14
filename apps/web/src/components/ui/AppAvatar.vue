<script setup lang="ts">
import { computed } from 'vue'
import { hashHue, initialsOf } from '@campus/shared'

const props = withDefaults(
  defineProps<{
    name: string
    src?: string | null
    /** 用于派生底色的稳定标识，不传则用昵称 */
    seed?: string
    size?: number
  }>(),
  { src: null, seed: '', size: 40 }
)

/** 无头像时用首字 + 派生色，比统一灰色占位更自然，也更方便区分不同卖家 */
const style = computed(() => {
  const hue = hashHue(props.seed || props.name)
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.42)}px`,
    background: `hsl(${hue} 68% 93%)`,
    color: `hsl(${hue} 45% 36%)`
  }
})

const initial = computed(() => initialsOf(props.name))
</script>

<template>
  <span class="avatar" :style="style" :aria-label="name" role="img">
    <img v-if="src" :src="src" :alt="name" loading="lazy" />
    <template v-else>{{ initial }}</template>
  </span>
</template>
