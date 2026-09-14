import { defineConfig } from 'vitest/config'
import { resolveTestDatabase } from './tests/test-env.js'

const { url } = resolveTestDatabase()

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    // 注入到测试进程的环境变量。它们优先于 .env，因此测试永远打到测试库
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: url,
      JWT_SECRET: 'test-only-secret-please-do-not-use-in-production',
      JWT_EXPIRES_IN: '1h',
      LOG_LEVEL: 'error'
    },
    // 所有用例共用同一个测试库，串行执行避免互相清表
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000
  }
})
