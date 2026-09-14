<script setup lang="ts">
import { AppIcon } from '@campus/ui'
import type { IconName } from '@campus/ui'
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/auth'
import { useAdminToastStore } from '@/stores/toast'

const auth = useAdminAuthStore()
const toast = useAdminToastStore()
const route = useRoute()
const router = useRouter()

const NAV_ITEMS: { name: string; label: string; icon: IconName }[] = [
  { name: 'dashboard', label: '数据概览', icon: 'grid' },
  { name: 'users', label: '用户管理', icon: 'user' },
  { name: 'items', label: '商品管理', icon: 'inbox' },
  { name: 'categories', label: '分类管理', icon: 'tag' },
  { name: 'actions', label: '操作日志', icon: 'clock' }
]

const activeName = computed(() => String(route.name ?? ''))

async function signOut(): Promise<void> {
  await auth.logout()
  toast.success('已退出登录')
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <span class="admin-brand__mark">
          <AppIcon name="shield" :size="20" />
        </span>
        <span>
          <span class="admin-brand__title">校园淘</span>
          <span class="admin-brand__subtitle">管理后台</span>
        </span>
      </div>

      <nav class="admin-nav" aria-label="后台导航">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.name"
          class="admin-nav__item"
          :class="{ 'is-active': activeName === item.name }"
          :to="{ name: item.name }"
        >
          <AppIcon :name="item.icon" :size="17" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin-sidebar__foot">
        <div class="admin-sidebar__user">
          <p class="admin-sidebar__name">{{ auth.user?.nickname }}</p>
          <p class="admin-sidebar__email">{{ auth.user?.email }}</p>
        </div>
        <button class="admin-signout" type="button" @click="signOut">
          <AppIcon name="logout" :size="16" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <div class="admin-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>
