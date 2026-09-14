<script setup lang="ts">
import type { Item, ItemStatus } from '@campus/shared'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteItem, fetchItems, updateItemStatus } from '@campus/api-client'
import ItemStatusTag from '@/components/business/ItemStatusTag.vue'
import PriceText from '@/components/business/PriceText.vue'
import { AppButton, AppEmpty, AppErrorState, AppIcon, AppPagination, useAsync } from '@campus/ui'
import AppImage from '@/components/ui/AppImage.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@campus/api-client'
import { formatRelativeTime } from '@campus/shared'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const PAGE_SIZE = 6

const FILTERS: { label: string; value: ItemStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '在售', value: 'on_sale' },
  { label: '已售', value: 'sold' },
  { label: '下架', value: 'off_shelf' }
]

function initialStatus(): ItemStatus | 'all' {
  const raw = route.query.status
  return FILTERS.some((filter) => filter.value === raw) ? (raw as ItemStatus) : 'all'
}

const activeStatus = ref<ItemStatus | 'all'>(initialStatus())
const page = ref(1)

const list = useAsync(() =>
  fetchItems({
    sellerId: auth.user?.id,
    status: activeStatus.value === 'all' ? undefined : activeStatus.value,
    page: page.value,
    pageSize: PAGE_SIZE
  })
)

const items = computed<Item[]>(() => list.data.value?.data ?? [])
const meta = computed(() => list.data.value?.meta ?? null)
const busyId = ref('')
const pendingDelete = ref<Item | null>(null)

function setStatus(value: ItemStatus | 'all'): void {
  activeStatus.value = value
  page.value = 1
  void router.replace({
    name: 'me-items',
    query: value === 'all' ? {} : { status: value }
  })
  void list.run()
}

function setPage(next: number): void {
  page.value = next
  void list.run()
}

async function changeStatus(item: Item, status: ItemStatus): Promise<void> {
  busyId.value = item.id
  try {
    await updateItemStatus(item.id, status)
    toast.success(
      status === 'sold' ? '已标记为已售' : status === 'off_shelf' ? '商品已下架' : '商品已重新上架'
    )
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  } finally {
    busyId.value = ''
  }
}

async function confirmDelete(): Promise<void> {
  const target = pendingDelete.value
  if (!target) return
  busyId.value = target.id
  try {
    await deleteItem(target.id)
    toast.success('商品已删除')
    pendingDelete.value = null
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '删除失败，请重试'))
  } finally {
    busyId.value = ''
  }
}

const emptyTitle = computed(() => {
  if (activeStatus.value === 'all') return '你还没有发布过闲置'
  if (activeStatus.value === 'on_sale') return '没有在售中的商品'
  if (activeStatus.value === 'sold') return '还没有已售出的商品'
  return '没有已下架的商品'
})
</script>

<template>
  <section class="my-items">
    <header class="head">
      <div>
        <h1 class="head__title">我的发布</h1>
        <p class="head__desc">共 {{ meta?.total ?? 0 }} 件商品，可以随时修改状态、编辑或删除。</p>
      </div>
      <RouterLink class="btn btn--primary btn--md" :to="{ name: 'publish' }">
        <AppIcon name="plus" :size="16" />
        <span>发布闲置</span>
      </RouterLink>
    </header>

    <div class="chip-row head__filters">
      <button
        v-for="filter in FILTERS"
        :key="filter.value"
        class="chip"
        :class="{ 'chip--active': activeStatus === filter.value }"
        type="button"
        @click="setStatus(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <AppErrorState
      v-if="list.error.value"
      :message="list.error.value"
      size="compact"
      @retry="list.run"
    />

    <div v-else-if="list.loading.value" class="rows">
      <span v-for="index in 3" :key="index" class="skeleton row-skeleton" />
    </div>

    <AppEmpty
      v-else-if="items.length === 0"
      :title="emptyTitle"
      description="发布一件闲置，让它在同学手里继续发挥价值。"
      icon="inbox"
      size="compact"
    >
      <RouterLink class="btn btn--primary btn--md" :to="{ name: 'publish' }">
        <AppIcon name="plus" :size="16" />
        <span>发布闲置</span>
      </RouterLink>
    </AppEmpty>

    <ul v-else class="rows">
      <li v-for="item in items" :key="item.id" class="row card">
        <RouterLink
          class="row__media"
          :to="{ name: 'item-detail', params: { id: item.id } }"
          :aria-label="`查看 ${item.title}`"
        >
          <AppImage :src="item.images[0]?.url ?? ''" :alt="item.title" ratio="1 / 1" />
        </RouterLink>

        <div class="row__body">
          <div class="row__top">
            <RouterLink class="row__title clamp-2" :to="{ name: 'item-detail', params: { id: item.id } }">
              {{ item.title }}
            </RouterLink>
            <ItemStatusTag :status="item.status" />
          </div>

          <div class="row__meta">
            <PriceText :cents="item.priceCents" size="sm" :muted="item.status !== 'on_sale'" />
            <span class="row__dot">·</span>
            <span>{{ item.categoryName }}</span>
            <span class="row__dot">·</span>
            <span>{{ formatRelativeTime(item.publishedAt) }}</span>
            <span class="row__dot">·</span>
            <span>{{ item.viewCount }} 次浏览</span>
          </div>

          <div class="row__actions">
            <RouterLink
              class="btn btn--secondary btn--sm"
              :to="{ name: 'item-edit', params: { id: item.id } }"
            >
              <AppIcon name="edit" :size="14" />
              <span>编辑</span>
            </RouterLink>

            <AppButton
              v-if="item.status !== 'sold'"
              variant="secondary"
              size="sm"
              :loading="busyId === item.id"
              @click="changeStatus(item, 'sold')"
            >
              <AppIcon name="check" :size="14" />
              <span>标记已售</span>
            </AppButton>

            <AppButton
              v-if="item.status === 'on_sale'"
              variant="secondary"
              size="sm"
              :loading="busyId === item.id"
              @click="changeStatus(item, 'off_shelf')"
            >
              <AppIcon name="eye" :size="14" />
              <span>下架</span>
            </AppButton>

            <AppButton
              v-else
              variant="secondary"
              size="sm"
              :loading="busyId === item.id"
              @click="changeStatus(item, 'on_sale')"
            >
              <AppIcon name="refresh" :size="14" />
              <span>重新上架</span>
            </AppButton>

            <AppButton variant="text" size="sm" @click="pendingDelete = item">
              <AppIcon name="trash" :size="14" />
              <span>删除</span>
            </AppButton>
          </div>
        </div>
      </li>
    </ul>

    <AppPagination
      v-if="meta && !list.loading.value && !list.error.value"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      @update:page="setPage"
    />

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      title="删除这件商品？"
      :message="`「${pendingDelete?.title ?? ''}」将从你的发布列表中移除，且无法恢复。`"
      confirm-text="删除"
      tone="danger"
      :loading="Boolean(pendingDelete) && busyId === pendingDelete?.id"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </section>
</template>

<style scoped>
.my-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.head__title {
  font-size: var(--text-lg);
}

.head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.head__filters {
  padding-bottom: 2px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.row-skeleton {
  height: 132px;
  border-radius: var(--radius-lg);
}

.row {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
}

.row__media {
  flex: none;
  width: 88px;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.row__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
}

.row__top {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.row__title {
  flex: 1;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-normal);
}

.row__title:hover {
  color: var(--color-primary-700);
}

.row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.row__dot {
  color: var(--color-neutral-300);
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: auto;
}

@media (min-width: 768px) {
  .head__title {
    font-size: var(--text-xl);
  }

  .row__media {
    width: 108px;
  }
}
</style>
