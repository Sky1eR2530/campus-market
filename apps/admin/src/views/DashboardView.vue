<script setup lang="ts">
import { fetchAdminActions, fetchAdminStats } from '@campus/api-client'
import type { AdminActionLog, AdminStats } from '@campus/shared'
import { formatDateTime } from '@campus/shared'
import { AppErrorState, AppSkeleton, AppTag, useAsync } from '@campus/ui'
import { computed } from 'vue'

const stats = useAsync<AdminStats>(fetchAdminStats)
const actions = useAsync(() => fetchAdminActions({ pageSize: 6 }))

const cards = computed(() => {
  const data = stats.data.value
  return [
    { label: '注册用户', value: data?.users.total ?? 0, hint: `其中封禁 ${data?.users.banned ?? 0} 人` },
    { label: '商品总数', value: data?.items.total ?? 0, hint: `在售 ${data?.items.onSale ?? 0} 件` },
    { label: '已售出', value: data?.items.sold ?? 0, hint: `下架 ${data?.items.offShelf ?? 0} 件` },
    { label: '收藏关系', value: data?.favorites ?? 0, hint: `分类 ${data?.categories ?? 0} 个` }
  ]
})

const ACTION_LABELS: Record<string, string> = {
  ban: '封禁用户',
  unban: '解封用户',
  take_down: '下架商品',
  restore: '恢复商品',
  delete: '删除商品',
  mark_sold: '标记已售'
}

function actionTone(action: string): 'danger' | 'success' | 'neutral' {
  if (action === 'ban' || action === 'delete' || action === 'take_down') return 'danger'
  if (action === 'unban' || action === 'restore') return 'success'
  return 'neutral'
}

const recentActions = computed<AdminActionLog[]>(() => actions.data.value?.data ?? [])
</script>

<template>
  <header class="admin-page-head">
    <div>
      <h1 class="admin-page-head__title">数据概览</h1>
      <p class="admin-page-head__desc">平台整体情况与最近的后台操作。</p>
    </div>
  </header>

  <AppErrorState
    v-if="stats.error.value"
    :message="stats.error.value"
    size="compact"
    @retry="stats.run"
  />

  <div v-else class="admin-stats">
    <template v-if="stats.loading.value">
      <span v-for="index in 4" :key="index" class="skeleton admin-stat-skeleton" />
    </template>
    <template v-else>
      <div v-for="card in cards" :key="card.label" class="admin-stat">
        <p class="admin-stat__label">{{ card.label }}</p>
        <p class="admin-stat__value">{{ card.value }}</p>
        <p class="admin-stat__hint">{{ card.hint }}</p>
      </div>
    </template>
  </div>

  <section class="admin-card">
    <div class="section-head">
      <h2 class="section-head__title">最近操作</h2>
      <RouterLink class="section-head__link" :to="{ name: 'actions' }">查看全部</RouterLink>
    </div>

    <AppErrorState
      v-if="actions.error.value"
      :message="actions.error.value"
      size="compact"
      @retry="actions.run"
    />

    <div v-else-if="actions.loading.value" class="skeleton-rows">
      <AppSkeleton v-for="index in 4" :key="index" height="40px" />
    </div>

    <p v-else-if="recentActions.length === 0" class="empty-hint">
      还没有任何后台操作记录。
    </p>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>操作</th>
            <th>操作人</th>
            <th>对象</th>
            <th>说明</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in recentActions" :key="log.id">
            <td>
              <AppTag :tone="actionTone(log.action)">
                {{ ACTION_LABELS[log.action] ?? log.action }}
              </AppTag>
            </td>
            <td>{{ log.adminNickname }}</td>
            <td>{{ log.targetType === 'user' ? '用户' : '商品' }}</td>
            <td class="text-tertiary">{{ log.reason || '—' }}</td>
            <td class="text-tertiary">{{ formatDateTime(log.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.admin-stat-skeleton {
  height: 104px;
  border-radius: var(--radius-lg);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

.section-head__title {
  font-size: var(--text-md);
}

.section-head__link {
  font-size: var(--text-sm);
  color: var(--color-primary-600);
}

.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.empty-hint {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
</style>
