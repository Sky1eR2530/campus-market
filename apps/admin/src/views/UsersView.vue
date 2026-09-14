<script setup lang="ts">
import { fetchAdminUsers, toErrorMessage, updateAdminUserStatus } from '@campus/api-client'
import type { AdminUser, UserStatus } from '@campus/shared'
import { formatDate, formatDateTime } from '@campus/shared'
import { AppButton, AppErrorState, AppIcon, AppSkeleton, AppTag } from '@campus/ui'
import { computed, ref, watch } from 'vue'
import AdminPager from '@/components/AdminPager.vue'
import { useAdminList } from '@/composables/useAdminList'
import { useAdminAuthStore } from '@/stores/auth'
import { useAdminToastStore } from '@/stores/toast'

const auth = useAdminAuthStore()
const toast = useAdminToastStore()

const keyword = ref('')
const statusFilter = ref<'' | UserStatus>('')

const list = useAdminList<AdminUser>((page) =>
  fetchAdminUsers({
    q: keyword.value.trim() || undefined,
    status: statusFilter.value || undefined,
    page,
    pageSize: 20
  })
)
void list.load()

// 筛选条件一变化就回到第一页重新加载
watch([keyword, statusFilter], () => {
  void list.load(1)
})

const pending = ref<{ id: string; next: UserStatus; nickname: string } | null>(null)
const reason = ref('')
const submitting = ref(false)

const rows = computed(() => list.items.value)

function ask(user: AdminUser): void {
  pending.value = {
    id: user.id,
    next: user.status === 'banned' ? 'active' : 'banned',
    nickname: user.nickname
  }
  reason.value = ''
}

async function confirm(): Promise<void> {
  const target = pending.value
  if (!target) return

  submitting.value = true
  try {
    await updateAdminUserStatus(target.id, target.next, reason.value.trim() || undefined)
    toast.success(target.next === 'banned' ? `已封禁「${target.nickname}」` : `已解封「${target.nickname}」`)
    pending.value = null
    await list.load()
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <header class="admin-page-head">
    <div>
      <h1 class="admin-page-head__title">用户管理</h1>
      <p class="admin-page-head__desc">搜索用户、查看发布情况，必要时封禁异常账号。</p>
    </div>
  </header>

  <div class="admin-toolbar">
    <label class="admin-toolbar__search">
      <AppIcon name="search" :size="17" />
      <input v-model="keyword" type="search" placeholder="搜索邮箱或昵称" aria-label="搜索用户" />
    </label>

    <label>
      <span class="sr-only">账号状态</span>
      <select v-model="statusFilter" class="admin-toolbar__select">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="banned">已封禁</option>
      </select>
    </label>
  </div>

  <AppErrorState
    v-if="list.error.value"
    :message="list.error.value"
    @retry="() => list.load(list.page.value)"
  />

  <div v-else class="admin-card">
    <div v-if="list.loading.value" class="skeleton-rows">
      <AppSkeleton v-for="index in 6" :key="index" height="44px" />
    </div>

    <p v-else-if="rows.length === 0" class="empty-hint">
      没有符合条件的用户。换个关键词或状态试试。
    </p>

    <template v-else>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>状态</th>
              <th>发布</th>
              <th>注册时间</th>
              <th>最近登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="user in rows" :key="user.id">
              <tr>
                <td>
                  <div class="admin-cell-title">
                    <p class="admin-cell-title__main">{{ user.nickname }}</p>
                    <p class="admin-cell-title__sub">{{ user.email }}</p>
                  </div>
                </td>
                <td>
                  <AppTag :tone="user.role === 'admin' ? 'primary' : 'neutral'">
                    {{ user.role === 'admin' ? '管理员' : '学生' }}
                  </AppTag>
                </td>
                <td>
                  <AppTag :tone="user.status === 'banned' ? 'danger' : 'success'">
                    {{ user.status === 'banned' ? '已封禁' : '正常' }}
                  </AppTag>
                </td>
                <td>{{ user.itemCount }} 件</td>
                <td class="text-tertiary">{{ formatDate(user.createdAt) }}</td>
                <td class="text-tertiary">
                  {{ user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '从未登录' }}
                </td>
                <td>
                  <div class="admin-table__actions">
                    <AppButton
                      v-if="user.id === auth.user?.id"
                      variant="secondary"
                      size="sm"
                      disabled
                      title="不能修改自己的账号状态"
                    >
                      当前账号
                    </AppButton>
                    <AppButton
                      v-else
                      :variant="user.status === 'banned' ? 'secondary' : 'text'"
                      size="sm"
                      @click="ask(user)"
                    >
                      <AppIcon :name="user.status === 'banned' ? 'refresh' : 'shield'" :size="14" />
                      <span>{{ user.status === 'banned' ? '解封' : '封禁' }}</span>
                    </AppButton>
                  </div>
                </td>
              </tr>

              <tr v-if="pending?.id === user.id">
                <td colspan="7" class="inline-cell">
                  <div class="admin-inline">
                    <span class="admin-inline__text">
                      确认{{ pending.next === 'banned' ? '封禁' : '解封' }}「{{ user.nickname }}」？
                    </span>
                    <input
                      v-model="reason"
                      type="text"
                      maxlength="200"
                      placeholder="填写原因（可选，会记录在操作日志里）"
                    />
                    <AppButton size="sm" :loading="submitting" @click="confirm">确认</AppButton>
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
</style>
