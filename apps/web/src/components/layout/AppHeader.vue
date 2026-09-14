<script setup lang="ts">
import { ref, watch } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBar from '@/components/business/SearchBar.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { AppIcon } from '@campus/ui'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorites'
import AppLogo from './AppLogo.vue'

const auth = useAuthStore()
const favorites = useFavoriteStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const keyword = ref('')
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const NAV_ITEMS = [
  { name: 'home', label: '首页' },
  { name: 'items', label: '闲置列表' },
  { name: 'categories', label: '全部分类' }
] as const

function isNavActive(name: string): boolean {
  if (name === 'items') return route.name === 'items' || route.name === 'search'
  return route.name === name
}

function submitSearch(value: string): void {
  void router.push(value ? { name: 'search', query: { q: value } } : { name: 'search' })
}

async function onLogout(): Promise<void> {
  menuOpen.value = false
  const wasProtected = Boolean(route.meta.requiresAuth)
  await auth.logout()
  toast.success('已退出登录')
  if (wasProtected) await router.push({ name: 'home' })
}

function onDocumentClick(event: MouseEvent): void {
  if (!menuOpen.value) return
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

// 路由变化时收起菜单，避免跳转后菜单还悬在那里
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <AppLogo />

      <nav class="header__nav" aria-label="主导航">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.name"
          class="header__nav-link"
          :class="{ 'is-active': isNavActive(item.name) }"
          :to="{ name: item.name }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header__search">
        <SearchBar v-model="keyword" label="站内搜索" @submit="submitSearch" />
      </div>

      <div class="header__actions">
        <RouterLink class="header__icon-btn" :to="{ name: 'search' }" aria-label="搜索">
          <AppIcon name="search" :size="20" />
        </RouterLink>

        <RouterLink
          v-if="auth.isAuthenticated"
          class="btn btn--primary btn--sm header__publish"
          :to="{ name: 'publish' }"
        >
          <AppIcon name="plus" :size="16" />
          发布闲置
        </RouterLink>

        <template v-if="!auth.isAuthenticated">
          <RouterLink class="header__login" :to="{ name: 'login' }">登录</RouterLink>
          <RouterLink class="btn btn--primary btn--sm header__register" :to="{ name: 'register' }">
            注册
          </RouterLink>
        </template>

        <div v-else ref="menuRef" class="header__menu">
          <button
            class="header__avatar-btn"
            type="button"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="menuOpen = !menuOpen"
          >
            <AppAvatar
              :name="auth.user?.nickname ?? ''"
              :src="auth.user?.avatarUrl"
              :seed="auth.user?.id"
              :size="32"
            />
          </button>

          <Transition name="menu">
            <div v-if="menuOpen" class="dropdown" role="menu">
              <div class="dropdown__head">
                <p class="dropdown__name">{{ auth.user?.nickname }}</p>
                <p class="dropdown__email truncate">{{ auth.user?.email }}</p>
              </div>

              <RouterLink class="dropdown__item" :to="{ name: 'me' }" role="menuitem">
                <AppIcon name="user" :size="16" />用户中心
              </RouterLink>
              <RouterLink class="dropdown__item" :to="{ name: 'me-items' }" role="menuitem">
                <AppIcon name="inbox" :size="16" />我的发布
              </RouterLink>
              <RouterLink class="dropdown__item" :to="{ name: 'me-favorites' }" role="menuitem">
                <AppIcon name="heart" :size="16" />我的收藏
                <span v-if="favorites.count" class="dropdown__badge">{{ favorites.count }}</span>
              </RouterLink>
              <RouterLink class="dropdown__item" :to="{ name: 'me-profile' }" role="menuitem">
                <AppIcon name="edit" :size="16" />编辑资料
              </RouterLink>

              <button class="dropdown__item dropdown__item--danger" type="button" role="menuitem" @click="onLogout">
                <AppIcon name="logout" :size="16" />退出登录
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border-default);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--header-height);
}

.header__nav {
  display: none;
  gap: var(--space-1);
  margin-left: var(--space-2);
}

.header__nav-link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.header__nav-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header__nav-link.is-active {
  color: var(--color-primary-700);
  font-weight: var(--weight-medium);
  background: var(--color-primary-50);
}

.header__search {
  display: none;
  flex: 1;
  max-width: 420px;
  margin-left: auto;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.header__icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header__login {
  padding: var(--space-2) var(--space-2);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.header__login:hover {
  color: var(--color-primary-700);
}

.header__publish,
.header__register {
  display: none;
}

.header__menu {
  position: relative;
}

.header__avatar-btn {
  display: block;
  border-radius: var(--radius-full);
  transition: box-shadow var(--transition-fast);
}

.header__avatar-btn:hover {
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: var(--z-dropdown);
  width: 220px;
  padding: var(--space-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.dropdown__head {
  padding: var(--space-2) var(--space-3) var(--space-3);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-neutral-100);
}

.dropdown__name {
  font-weight: var(--weight-semibold);
}

.dropdown__email {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
  text-align: left;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.dropdown__item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown__item--danger {
  color: var(--color-danger-500);
  margin-top: var(--space-1);
}

.dropdown__item--danger:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

.dropdown__badge {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-size: var(--text-xs);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (min-width: 768px) {
  .header__nav {
    display: flex;
  }

  .header__icon-btn {
    display: none;
  }

  .header__search {
    display: block;
    margin-left: auto;
  }

  .header__actions {
    margin-left: var(--space-2);
  }

  .header__publish,
  .header__register {
    display: inline-flex;
  }
}
</style>
