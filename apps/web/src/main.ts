import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/utilities.css'

/**
 * 先恢复登录态再挂载，避免刷新受保护页面时先渲染出登录页再跳回来。
 * 这段等待很短（Mock 阶段约 100ms 内），比闪屏体验好得多。
 */
async function bootstrap(): Promise<void> {
  const app = createApp(App)
  app.use(createPinia())

  await useAuthStore().restore()

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
