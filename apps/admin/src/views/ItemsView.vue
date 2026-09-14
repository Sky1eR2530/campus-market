<script setup lang="ts">
import { fetchAdminCategories, fetchAdminItems, toErrorMessage, updateAdminItemStatus, deleteAdminItem } from '@campus/api-client'
import type { AdminItem, Category, ItemStatus } from '@campus/shared'
import { formatDateTime, formatPrice } from '@campus/shared'
import { AppButton, AppErrorState, AppIcon, AppSkeleton, AppTag } from '@campus/ui'
import { computed, ref, watch } from 'vue'
import AdminPager from '@/components/AdminPager.vue'
import { useAdminList } from '@/composables/useAdminList'
import { useAdminToastStore } from '@/stores/toast'
import { useAsync } from '@campus/ui'

type PendingAction = { id: string; kind: 'take_down' | 'restore' | 'delete'; title: string }

const toast = useAdminToastStore()

const keyword = ref('')
const statusFilter = ref<'' | ItemStatus>('')
const categoryFilter = ref('')
const includeDeleted = ref(false)

const categories = useAsync<Category[]>(fetchAdminCategories)

const list = useAdminList<AdminItem>((page) =>
  fetchAdminItems({
    q: keyword.value.trim() || undefined,
    status: statusFilter.value || undefined,
    category: categoryFilter.value || undefined,
    includeDeleted: includeDeleted.value,
    page,
    pageSize: 20
  })
)
void list.load()

watch([keyword, statusFilter, categoryFilter, includeDeleted], () => {
  void list.load(1)
})

const pending = ref<PendingAction | null>(null)
const reason = ref('')
const submitting = ref(false)

const rows = computed(() => list.items.value)

const STATUS_LABEL: Record<ItemStatus, string> = {
  on_sale: '在售',
  sold: '已售',
  off_shelf: '下架'
}

function statusTone(status: ItemStatus): 'success' | 'neutral' | 'warning' {
  if (status === 'on_sale') return 'success'
  if (status === 'sold') return 'neutral'
  return 'warning'
}

function ask(item: AdminItem, kind: PendingAction['kind']): void {
  pending.value = { id: item.id, kind, title: item.title }
  reason.value = ''
}

async function confirm(): Promise<void> {
  const target = pending.value
  if (!target) return

  submitting.value = true
  try {
    const trimmed = reason.value.trim() || undefined
    if (target.kind === 'delete') {
      await deleteAdminItem(target.id, trimmed)
      toast.success(`已删除「${target.title}」`)
    } else {
      await updateAdminItemStatus(target.id, target.kind === 'take_down' ? 'off_shelf' : 'on_sale', trimmed)
      toast.success(target.kind === 'take_down' ? `已下架「${target.title}」` : `已恢复「${target.title}」`)
    }
    pending.value = null
    await list.load()
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  } finally {
    submitting.value = false
  }
}

function actionText(kind: PendingAction['kind']): string {
  if (kind === 'take_down') return '下架'
  if (kind === 'restore') return '恢复上架'
  return '删除'
}
</script>

<template>
  <header class="admin-page-head">
    <div>
      <h1 class="admin-page-head__title">商品管理</h1>
      <p class="admin-page-head__desc">浏览全平台商品，对违规内容执行下架、恢复或删除。</p>
    </div>
  </header>

  <div class="admin-toolbar">
    <label class="admin-toolbar__search">
      <AppIcon name="search" :size="17" />
      <input
        v-model="keyword"
        type="search"
        placeholder="搜索商品标题、描述或卖家昵称"
        aria-label="搜索商品"
      />
    </label>

    <label>
      <span class="sr-only">商品状态</span>
      <select v-model="statusFilter" class="admin-toolbar__select">
        <option value="">全部状态</option>
        <option value="on_sale">在售</option>
        <option value="sold">已售</option>
        <option value="off_shelf">下架</option>
      </select>
    </label>

    <label>
      <span class="sr-only">商品分类</span>
      <select v-model="categoryFilter" class="admin-toolbar__select">
        <option value="">全部分类</option>
        <option v-for="category in categories.data.value ?? []" :key="category.slug" :value="category.slug">
          {{ category.name }}
        </option>
      </select>
    </label>

    <label class="admin-checkbox">
      <input v-model="includeDeleted" type="checkbox" />
      <span>包含已删除</span>
    </label>
  </div>

  <AppErrorState
    v-if="list.error.value"
    :message="list.error.value"
    @retry="() => list.load(list.page.value)"
  />

  <div v-else class="admin-card">
    <div v-if="list.loading.value" class="skeleton-rows">
      <AppSkeleton v-for="index in 6" :key="index" height="56px" />
    </div>

    <p v-else-if="rows.length === 0" class="empty-hint">没有符合条件的商品。</p>

    <template v-else>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>分类</th>
              <th>卖家</th>
              <th>价格</th>
              <th>状态</th>
              <th>浏览 / 收藏</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in rows" :key="item.id">
              <tr>
                <td>
                  <div class="item-cell">
                    <span class="admin-thumb">
                      <!-- 标题就在旁边，缩略图按装饰处理，避免读屏重复念一遍 -->
                      <img
                        v-if="item.coverUrl"
                        :src="item.coverUrl"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                    </span>
                    <div class="admin-cell-title">
                      <p class="admin-cell-title__main">{{ item.title }}</p>
                      <p v-if="item.deletedAt" class="admin-cell-title__sub">已于 {{ formatDateTime(item.deletedAt) }} 删除</p>
                    </div>
                  </div>
                </td>
                <td>{{ item.categoryName }}</td>
                <td>{{ item.sellerNickname }}</td>
                <td class="price">¥{{ formatPrice(item.priceCents) }}</td>
                <td>
                  <AppTag :tone="statusTone(item.status)">{{ STATUS_LABEL[item.status] }}</AppTag>
                </td>
                <td class="text-tertiary">{{ item.viewCount }} / {{ item.favoriteCount }}</td>
                <td class="text-tertiary">{{ formatDateTime(item.publishedAt) }}</td>
                <td>
                  <div class="admin-table__actions">
                    <AppButton
                      v-if="item.status !== 'off_shelf' && !item.deletedAt"
                      variant="text"
                      size="sm"
                      @click="ask(item, 'take_down')"
                    >
                      <AppIcon name="eye" :size="14" />
                      <span>下架</span>
                    </AppButton>
                    <AppButton
                      v-else-if="!item.deletedAt"
                      variant="secondary"
                      size="sm"
                      @click="ask(item, 'restore')"
                    >
                      <AppIcon name="refresh" :size="14" />
                      <span>恢复</span>
                    </AppButton>
                    <AppButton
                      v-if="!item.deletedAt"
                      variant="text"
                      size="sm"
                      @click="ask(item, 'delete')"
                    >
                      <AppIcon name="trash" :size="14" />
                      <span>删除</span>
                    </AppButton>
                    <span v-else class="text-tertiary">已删除</span>
                  </div>
                </td>
              </tr>

              <tr v-if="pending?.id === item.id">
                <td colspan="8" class="inline-cell">
                  <div class="admin-inline">
                    <span class="admin-inline__text">
                      确认{{ actionText(pending.kind) }}「{{ item.title }}」？
                    </span>
                    <input
                      v-model="reason"
                      type="text"
                      maxlength="200"
                      placeholder="填写原因（可选，会记录在操作日志里）"
                    />
                    <AppButton
                      size="sm"
                      :variant="pending.kind === 'delete' ? 'danger' : 'primary'"
                      :loading="submitting"
                      @click="confirm"
                    >
                      确认{{ actionText(pending.kind) }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" @click="pending = null">取消</AppButton>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <AdminPager
        v-if="list.meta.value"
        :page="list.meta.value.page"
        :total-pages="list.meta.value.totalPages"
        :total="list.meta.value.total"
        @update:page="list.load"
      />
    </template>
  </div>
</template>

<style scoped>
.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.empty-hint {
  padding: var(--space-10) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.inline-cell {
  padding: 0;
}

.item-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.price {
  font-variant-numeric: tabular-nums;
  font-weight: var(--weight-medium);
  color: var(--color-accent-600);
}
</style>
