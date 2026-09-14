import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 共享包直接消费 TypeScript 源码，后端消费构建产物
        '@campus/shared': fileURLToPath(
          new URL('../../packages/shared/src/index.ts', import.meta.url)
        ),
        // 两个前端应用共用同一套设计令牌与 HTTP 客户端，避免各写一份
      '@campus/api-client': fileURLToPath(
        new URL('../../packages/api-client/src/index.ts', import.meta.url)
      ),
      // 更具体的路径写在前面，否则样式子路径会被上一条规则吞掉
      '@campus/ui/styles': fileURLToPath(new URL('../../packages/ui/styles', import.meta.url)),
      '@campus/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url))
    }
    },
    server: {
      port: 5173,
      host: true,
      // 开发环境把 /api 转发到本地后端，与生产环境的同源部署保持一致
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        // 上传的图片由后端在 /uploads/* 提供，
        // 开发环境必须一起代理，否则图片地址会落到前端服务器上变成 404
        '/uploads': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 800
    }
  }
})
