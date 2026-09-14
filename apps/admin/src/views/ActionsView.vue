<script setup lang="ts">
import { fetchAdminActions } from '@campus/api-client'
import type { AdminActionLog } from '@campus/shared'
import { formatDateTime } from '@campus/shared'
import { AppErrorState, AppIcon, AppSkeleton, AppTag } from '@campus/ui'
import { computed } from 'vue'
import AdminPager from '@/components/AdminPager.vue'
import { useAdminList } from '@/composables/useAdminList'

const list = useAdminList<AdminActionLog>((page) => fetchAdminActions({ page, pageSize: 20 }))
void list.load()

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

const rows = computed(() => list.items.value)
</script>

<template>
  <header class="admin-page-head">
    <div>
      <h1 class="admin-page-head__title">操作日志</h1>
      <p class="admin-page-head__desc">
        每一次下架、恢复、删除与封禁都会留痕，可追溯到具体操作人与原因。
      </p>
    </div>
  </header>

  <AppErrorState
    v-if="list.error.value"
    :message="list.error.value"
    @retry="() => list.load(list.page.value)"
  />

  <div v-else class="admin-card">
    <div v-if="list.loading.value" class="skeleton-rows">
      <AppSkeleton v-for="index in 6" :key="index" height="40px" />
    </div>

    <p v-else-if="rows.length === 0" class="empty-hint">还没有任何后台操作记录。</p>

    <template v-else>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>操作</th>
              <th>操作人</th>
              <th>对象类型</th>
              <th>对象 ID</th>
              <th>说明</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in rows" :key="log.id">
              <td>
                <AppTag :tone="actionTone(log.action)">
                  {{ ACTION_LABELS[log.action] ?? log.action }}
                </AppTag>
              </td>
              <td>{{ log.adminNickname }}</td>
              <td>{{ log.targetType === 'user' ? '用户' : '商品' }}</td>
              <td class="mono">{{ log.targetId.slice(0, 8) }}…</td>
              <td class="text-tertiary">{{ log.reason || '—' }}</td>
              <td class="text-tertiary">{{ formatDateTime(log.createdAt) }}</td>
            </tr>
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

  <p class="foot-hint">
    <AppIcon name="info" :size="14" />
    <span>日志只增不改：后台操作一旦发生就会留下记录，便于事后核查。</span>
  </p>
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

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.foot-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
</style>
