<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/components/ui/icons'
import { useFavoriteStore } from '@/stores/favorites'

const route = useRoute()
const favorites = useFavoriteStore()

interface Tab {
  name: string
  label: string
  icon: IconName
  primary?: boolean
}

const TABS: Tab[] = [
  { name: 'home', label: '首页', icon: 'home' },
  { name: 'categories', label: '分类', icon: 'grid' },
  { name: 'publish', label: '发布', icon: 'plus', primary: true },
  { name: 'me-favorites', label: '收藏', icon: 'heart' },
  { name: 'me', label: '我的', icon: 'user' }
]

function isActive(name: string): boolean {
  switch (name) {
    case 'home':
      return route.name === 'home'
    case 'categories':
      return route.name === 'categories'
    case 'publish':
      return route.name === 'publish' || route.name === 'item-edit'
    case 'me-favorites':
      return route.name === 'me-favorites'
    case 'me':
      return route.path.startsWith('/me') && route.name !== 'me-favorites'
    default:
      return false
  }
}
</script>

<template>
  <nav class="tabbar" aria-label="快捷导航">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      class="tabbar__item"
      :class="{ 'is-active': isActive(tab.name), 'tabbar__item--primary': tab.primary }"
      :to="{ name: tab.name }"
      :aria-label="tab.label"
    >
      <span class="tabbar__icon">
        <AppIcon :name="tab.icon" :size="tab.primary ? 22 : 21" />
        <span v-if="tab.name === 'me-favorites' && favorites.count" class="tabbar__badge" />
      </span>
      <span class="tabbar__label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-tabbar);
  display: flex;
  height: calc(var(--tabbar-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border-default);
}

.tabbar__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
}

.tabbar__item.is-active {
  color: var(--color-primary-600);
}

.tabbar__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabbar__label {
  font-size: var(--text-xs);
}

.tabbar__item--primary .tabbar__icon {
  width: 40px;
  height: 40px;
  margin-top: -18px;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
  color: #fff;
  box-shadow: 0 6px 16px rgba(42, 79, 216, 0.32);
}

.tabbar__item--primary.is-active .tabbar__icon,
.tabbar__item--primary:hover .tabbar__icon {
  background: var(--color-primary-700);
}

.tabbar__badge {
  position: absolute;
  top: -1px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-accent-500);
  border: 1.5px solid #fff;
}

@media (min-width: 1024px) {
  .tabbar {
    display: none;
  }
}
</style>
