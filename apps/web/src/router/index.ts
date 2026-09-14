import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 已登录用户不应再访问（登录、注册页） */
    guestOnly?: boolean
    /** 页面标题 */
    title?: string
  }
}

const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const UserCenterLayout = () => import('@/layouts/UserCenterLayout.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/CategoryListView.vue'),
        meta: { title: '全部分类' }
      },
      {
        path: 'items',
        name: 'items',
        component: () => import('@/views/ItemListView.vue'),
        meta: { title: '闲置列表' }
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@/views/ItemListView.vue'),
        meta: { title: '搜索' }
      },
      {
        path: 'items/:id',
        name: 'item-detail',
        component: () => import('@/views/ItemDetailView.vue'),
        meta: { title: '商品详情' }
      },
      {
        path: 'items/:id/edit',
        name: 'item-edit',
        component: () => import('@/views/ItemEditView.vue'),
        meta: { requiresAuth: true, title: '编辑商品' }
      },
      {
        path: 'publish',
        name: 'publish',
        component: () => import('@/views/PublishView.vue'),
        meta: { requiresAuth: true, title: '发布闲置' }
      },
      {
        path: 'me',
        component: UserCenterLayout,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'me',
            component: () => import('@/views/user-center/ProfileOverviewView.vue'),
            meta: { title: '用户中心' }
          },
          {
            path: 'items',
            name: 'me-items',
            component: () => import('@/views/user-center/MyItemsView.vue'),
            meta: { title: '我的发布' }
          },
          {
            path: 'favorites',
            name: 'me-favorites',
            component: () => import('@/views/user-center/MyFavoritesView.vue'),
            meta: { title: '我的收藏' }
          },
          {
            path: 'profile',
            name: 'me-profile',
            component: () => import('@/views/user-center/ProfileEditView.vue'),
            meta: { title: '编辑资料' }
          }
        ]
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: '页面不存在' }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true, title: '注册' }
  }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})

router.afterEach((to) => {
  // 标题是动态内容的页面（如商品详情）会在组件内自行覆盖
  if (to.meta.title) {
    document.title = `${to.meta.title} · 校园淘`
  }
})
