<script setup lang="ts">
import type { CreateItemPayload } from '@campus/shared'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchItem, updateItem } from '@campus/api-client'
import ItemForm from '@/components/business/ItemForm.vue'
import { AppButton, AppEmpty, AppErrorState, AppSkeleton, useAsync } from '@campus/ui'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@campus/api-client'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const itemId = computed(() => String(route.params.id ?? ''))
const item = useAsync(() => fetchItem(itemId.value))
const submitting = ref(false)

const isOwner = computed(
  () => Boolean(item.data.value) && item.data.value?.sellerId === auth.user?.id
)

usePageMeta(computed(() => `编辑 ${item.data.value?.title ?? '商品'}`))

async function onSubmit(payload: CreateItemPayload): Promise<void> {
  submitting.value = true
  try {
    await updateItem(itemId.value, payload)
    toast.success('修改已保存')
    await router.push({ name: 'item-detail', params: { id: itemId.value } })
  } catch (error) {
    toast.error(toErrorMessage(error, '保存失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container page">
    <header class="edit-head">
      <h1 class="edit-head__title">编辑商品</h1>
      <p class="edit-head__desc">修改后商品信息会立即更新。已售或下架的商品不会出现在公开列表中。</p>
    </header>

    <div v-if="item.loading.value" class="edit-loading card card--pad">
      <AppSkeleton v-for="index in 5" :key="index" height="56px" radius="12px" />
    </div>

    <AppErrorState v-else-if="item.error.value" :message="item.error.value" @retry="item.run" />

    <AppEmpty
      v-else-if="!isOwner"
      title="无法编辑这件商品"
      description="只有发布者本人可以修改商品信息。"
    >
      <AppButton variant="secondary" @click="router.push({ name: 'home' })">返回首页</AppButton>
    </AppEmpty>

    <div v-else class="edit-body card card--pad">
      <ItemForm
        :initial="item.data.value"
        :submitting="submitting"
        submit-text="保存修改"
        cancel-text="取消"
        @submit="onSubmit"
        @cancel="router.back()"
      />
    </div>
  </div>
</template>

<style scoped>
.edit-head {
  margin-bottom: var(--space-5);
}

.edit-head__title {
  font-size: var(--text-xl);
}

.edit-head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.edit-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 760px;
}

.edit-body {
  max-width: 760px;
}

@media (min-width: 768px) {
  .edit-head__title {
    font-size: var(--text-2xl);
  }

  .edit-body {
    padding: var(--space-6);
  }
}
</style>
