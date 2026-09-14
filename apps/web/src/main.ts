import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { setUnauthorizedHandler } from './api/http'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/utilities.css'

/**
 * 先恢复登录态再挂载，避免刷新受保护页面时先渲染出登录页再跳回来。
 */
async function bootstrap(): Promise<void> {
  const app = createApp(App)
  app.use(createPinia())

  const auth = useAuthStore()

  /**
   * 令牌失效（过期或被服务端拒绝）时的统一处理。
   * 在这里注册而不是让 http 直接依赖 store，避免 http ↔ store ↔ api 的循环引用。
   */
  setUnauthorizedHandler(() => {
    auth.setUser(null)
    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      void router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  })

  await auth.restore()

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
