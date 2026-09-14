<script setup lang="ts">
import type { MyStats } from '@campus/shared'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyStats } from '@campus/api-client'
import { AppErrorState, AppIcon, useAsync } from '@campus/ui'
import type { IconName } from '@campus/ui'
import { usePageMeta } from '@/composables/usePageMeta'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@campus/shared'

const auth = useAuthStore()
const router = useRouter()

const stats = useAsync<MyStats>(fetchMyStats)

usePageMeta('用户中心')

const statCards = computed(() => {
  const data = stats.data.value
  return [
    { key: 'onSale', label: '在售中', value: data?.onSale ?? 0, icon: 'tag' as IconName, status: 'on_sale' },
    { key: 'sold', label: '已售出', value: data?.sold ?? 0, icon: 'check' as IconName, status: 'sold' },
    { key: 'offShelf', label: '已下架', value: data?.offShelf ?? 0, icon: 'eye' as IconName, status: 'off_shelf' },
    { key: 'favorites', label: '我的收藏', value: data?.favorites ?? 0, icon: 'heart' as IconName, status: null }
  ]
})

function goToItems(status: string | null): void {
  if (status === null) {
    void router.push({ name: 'me-favorites' })
    return
  }
  void router.push({ name: 'me-items', query: { status } })
}

</script>

<template>
  <section class="overview">
    <header class="overview__head">
      <h1 class="overview__title">你好，{{ auth.user?.nickname }}</h1>
      <p class="overview__desc">
        这里可以看到你的发布情况、收藏数量和账号信息。
      </p>
    </header>

    <AppErrorState
      v-if="stats.error.value"
      :message="stats.error.value"
      size="compact"
      @retry="stats.run"
    />

    <div v-else class="stat-grid">
      <template v-if="stats.loading.value">
        <span v-for="index in 4" :key="index" class="skeleton stat-skeleton" />
      </template>
      <template v-else>
        <button
          v-for="card in statCards"
          :key="card.key"
          class="stat card card--interactive"
          type="button"
          @click="goToItems(card.status)"
        >
          <span class="stat__icon"><AppIcon :name="card.icon" :size="18" /></span>
          <span class="stat__value">{{ card.value }}</span>
          <span class="stat__label">{{ card.label }}</span>
        </button>
      </template>
    </div>

    <div class="quick">
      <RouterLink class="btn btn--primary btn--md" :to="{ name: 'publish' }">
        <AppIcon name="plus" :size="16" />
        <span>发布闲置</span>
      </RouterLink>
      <RouterLink class="btn btn--secondary btn--md" :to="{ name: 'me-items' }">
        <AppIcon name="inbox" :size="16" />
        <span>管理我的发布</span>
      </RouterLink>
      <RouterLink class="btn btn--secondary btn--md" :to="{ name: 'me-profile' }">
        <AppIcon name="edit" :size="16" />
        <span>编辑资料</span>
      </RouterLink>
    </div>

    <section class="card card--pad profile">
      <h2 class="profile__title">账号信息</h2>

      <dl class="profile__list">
        <div>
          <dt>邮箱</dt>
          <dd>{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt>昵称</dt>
          <dd>{{ auth.user?.nickname }}</dd>
        </div>
        <div>
          <dt>学校 / 校区</dt>
          <dd>
            {{
              [auth.user?.school, auth.user?.campus].filter(Boolean).join(' ') || '未填写'
            }}
          </dd>
        </div>
        <div>
          <dt>联系方式</dt>
          <dd>{{ auth.user?.contact || '未填写' }}</dd>
        </div>
        <div class="profile__wide">
          <dt>个人简介</dt>
          <dd>{{ auth.user?.bio || '还没有填写简介' }}</dd>
        </div>
        <div>
          <dt>加入时间</dt>
          <dd>{{ auth.user ? formatDate(auth.user.createdAt) : '' }}</dd>
        </div>
      </dl>
    </section>

  </section>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.overview__title {
  font-size: var(--text-xl);
}

.overview__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.stat-skeleton {
  height: 96px;
  border-radius: var(--radius-lg);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-4);
  text-align: left;
}

.stat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.stat__value {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
}

.stat__label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.quick {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.profile__title {
  font-size: var(--text-md);
  margin-bottom: var(--space-4);
}

.profile__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.profile__list dt {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.profile__list dd {
  margin: 3px 0 0;
  font-size: var(--text-base);
  word-break: break-word;
}

.profile__wide {
  grid-column: 1 / -1;
}

@media (min-width: 768px) {
  .overview__title {
    font-size: var(--text-2xl);
  }

  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

}
</style>
