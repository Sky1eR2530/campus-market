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
        )
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
