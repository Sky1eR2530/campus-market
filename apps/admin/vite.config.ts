import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:3000'

  /*
   * 生产环境管理端由后端挂在 /admin 下，构建产物里的资源引用与前端路由
   * 都必须带上这个前缀；开发环境仍从根路径访问，方便本地调试。
   * 可以用 VITE_PUBLIC_BASE 覆盖（比如挂到别的子路径）。
   */
  const defaultBase = command === 'build' && mode === 'production' ? '/admin/' : '/'

  return {
    plugins: [vue()],
    base: env.VITE_PUBLIC_BASE || defaultBase,
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
