<script setup lang="ts">
import { computed } from 'vue'
import { ITEM_STATUS_META } from '@campus/shared'
import type { ItemStatus } from '@campus/shared'
import AppTag from '@/components/ui/AppTag.vue'

const props = withDefaults(defineProps<{ status: ItemStatus; size?: 'sm' | 'lg' }>(), {
  size: 'sm'
})

const meta = computed(() => ITEM_STATUS_META[props.status])
</script>

<template>
  <AppTag :tone="meta.tone" :size="size">{{ meta.label }}</AppTag>
</template>
