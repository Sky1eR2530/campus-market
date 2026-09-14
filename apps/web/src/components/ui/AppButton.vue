<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'primary', size: 'md', block: false, loading: false, disabled: false, type: 'button' }
)

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  { 'btn--block': props.block }
])
</script>

<template>
  <button :class="classes" :type="type" :disabled="isDisabled" :aria-busy="loading || undefined">
    <AppSpinner v-if="loading" :size="size === 'lg' ? 18 : 15" />
    <slot />
  </button>
</template>
