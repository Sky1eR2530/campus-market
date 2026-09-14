import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue()],
    // 生产环境部署在 /admin 子路径下（由后端同源托管），开发环境用根路径
    base: env.VITE_PUBLIC_BASE || '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@campus/shared': fileURLToPath(
          new URL('../../packages/shared/src/index.ts', import.meta.url)
        ),
        '@campus/api-client': fileURLToPath(
          new URL('../../packages/api-client/src/index.ts', import.meta.url)
        ),
        // 更具体的路径写在前面，否则样式子路径会被下一条规则吞掉
        '@campus/ui/styles': fileURLToPath(new URL('../../packages/ui/styles', import.meta.url)),
        '@campus/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url))
      }
    },
    server: {
      port: 5174,
      host: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        // 商品封面图同样由后端托管，后台列表要能显示出来
        '/uploads': { target: apiTarget, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 800
    }
  }
})
