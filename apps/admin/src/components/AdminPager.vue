<script setup lang="ts">
import { AppButton } from '@campus/ui'

const props = defineProps<{
  page: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

function go(next: number): void {
  const target = Math.min(Math.max(1, next), props.totalPages)
  if (target !== props.page) emit('update:page', target)
}
</script>

<template>
  <div class="admin-pager">
    <span>共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</span>
    <div class="admin-pager__buttons">
      <AppButton variant="secondary" size="sm" :disabled="page <= 1" @click="go(page - 1)">
        上一页
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        下一页
      </AppButton>
    </div>
  </div>
</template>
