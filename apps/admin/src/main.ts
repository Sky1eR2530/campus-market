import { configureApiClient, setUnauthorizedHandler } from '@campus/api-client'
import '@campus/ui/styles/tokens.css'
import '@campus/ui/styles/base.css'
import '@campus/ui/styles/components.css'
import '@campus/ui/styles/utilities.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useAdminAuthStore } from './stores/auth'
import './styles/admin.css'

async function bootstrap(): Promise<void> {
  const app = createApp(App)
  app.use(createPinia())

  configureApiClient({ baseURL: import.meta.env.VITE_API_BASE_URL })

  const auth = useAdminAuthStore()

  setUnauthorizedHandler(() => {
    auth.clear()
    const current = router.currentRoute.value
    if (current.name !== 'login') {
      void router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  })

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
