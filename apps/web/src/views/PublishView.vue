<script setup lang="ts">
import type { CreateItemPayload } from '@campus/shared'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createItem } from '@/api/items'
import ItemForm from '@/components/business/ItemForm.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/composables/useToast'
import { toErrorMessage } from '@/utils/error'

const router = useRouter()
const toast = useToast()

const submitting = ref(false)

usePageMeta('发布闲置')

async function onSubmit(payload: CreateItemPayload): Promise<void> {
  submitting.value = true
  try {
    const item = await createItem(payload)
    toast.success('发布成功，商品已上架')
    await router.push({ name: 'item-detail', params: { id: item.id } })
  } catch (error) {
    toast.error(toErrorMessage(error, '发布失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container page">
    <header class="publish-head">
      <h1 class="publish-head__title">发布闲置</h1>
      <p class="publish-head__desc">
        <AppIcon name="info" :size="15" />
        <span>真实的照片和详细的描述能显著提高成交速度。发布后可随时修改状态或下架。</span>
      </p>
    </header>

    <div class="publish-body card card--pad">
      <ItemForm
        :submitting="submitting"
        submit-text="确认发布"
        cancel-text="返回"
        @submit="onSubmit"
        @cancel="router.back()"
      />
    </div>
  </div>
</template>

<style scoped>
.publish-head {
  margin-bottom: var(--space-5);
}

.publish-head__title {
  font-size: var(--text-xl);
}

.publish-head__desc {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.publish-body {
  max-width: 760px;
}

@media (min-width: 768px) {
  .publish-head__title {
    font-size: var(--text-2xl);
  }

  .publish-body {
    padding: var(--space-6);
  }
}
</style>
