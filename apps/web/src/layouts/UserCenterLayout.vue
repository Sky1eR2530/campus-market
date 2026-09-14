<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorites'

const auth = useAuthStore()
const favorites = useFavoriteStore()
const route = useRoute()

interface NavItem {
  name: string
  label: string
  icon: IconName
  badge?: () => number
}

const NAV_ITEMS: NavItem[] = [
  { name: 'me', label: '资料概览', icon: 'user' },
  { name: 'me-items', label: '我的发布', icon: 'inbox' },
  { name: 'me-favorites', label: '我的收藏', icon: 'heart', badge: () => favorites.count },
  { name: 'me-profile', label: '编辑资料', icon: 'edit' }
]

function badgeOf(item: NavItem): number {
  return item.badge?.() ?? 0
}

/**
 * 用路由名判断选中态。
 * 不能用 RouterLink 自带的 router-link-active ——「/me」是「/me/items」的父路径，
 * 用它会同时高亮两个菜单项。
 */
const activeName = computed(() => String(route.name ?? ''))
</script>

<template>
  <div class="container page">
    <div class="uc">
      <aside class="uc__side">
        <div class="uc__profile card card--pad">
          <AppAvatar
            :name="auth.user?.nickname ?? ''"
            :src="auth.user?.avatarUrl"
            :seed="auth.user?.id"
            :size="56"
          />
          <p class="uc__name">{{ auth.user?.nickname }}</p>
          <p class="uc__email truncate">{{ auth.user?.email }}</p>
          <p v-if="auth.user?.school || auth.user?.campus" class="uc__place">
            <AppIcon name="location" :size="13" />
            {{ [auth.user?.school, auth.user?.campus].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <nav class="uc__nav" aria-label="用户中心导航">
          <RouterLink
            v-for="item in NAV_ITEMS"
            :key="item.name"
            class="uc__nav-item"
            :class="{ 'is-active': activeName === item.name }"
            :to="{ name: item.name }"
          >
            <AppIcon :name="item.icon" :size="17" />
            <span>{{ item.label }}</span>
            <span v-if="badgeOf(item)" class="uc__nav-badge">{{ badgeOf(item) }}</span>
          </RouterLink>
        </nav>
      </aside>

      <section class="uc__content">
        <RouterView />
      </section>
    </div>
  </div>
</template>

<style scoped>
.uc {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.uc__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.uc__profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.uc__name {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.uc__email {
  max-width: 100%;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.uc__place {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.uc__nav {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.uc__nav::-webkit-scrollbar {
  display: none;
}

.uc__nav-item {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-2);
  height: 38px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  white-space: nowrap;
  transition: background-color var(--transition-fast), border-color var(--transition-fast),
    color var(--transition-fast);
}

.uc__nav-item:hover {
  border-color: var(--color-primary-300);
  color: var(--color-primary-700);
}

.uc__nav-item.is-active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: #fff;
}

.uc__nav-badge {
  padding: 0 6px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.24);
  font-size: var(--text-xs);
}

.uc__nav-item:not(.is-active) .uc__nav-badge {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.uc__content {
  min-width: 0;
}

@media (min-width: 1024px) {
  .uc {
    grid-template-columns: 260px minmax(0, 1fr);
    gap: var(--space-6);
    align-items: start;
  }

  .uc__side {
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }

  .uc__nav {
    flex-direction: column;
    overflow: visible;
  }

  .uc__nav-item {
    height: 42px;
    border-radius: var(--radius-md);
    border-color: transparent;
    background: transparent;
  }

  .uc__nav-badge {
    margin-left: auto;
  }
}
</style>
