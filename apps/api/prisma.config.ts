import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 起 CLI 不再自动读取 .env，需要在这里显式加载。
 * 使用 Node 内置的 process.loadEnvFile，不额外引入 dotenv 依赖。
 * 加载必须发生在 defineConfig 之前，否则读不到 DATABASE_URL。
 */
const projectDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(projectDir, '.env')

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

const databaseUrl = process.env.DATABASE_URL ?? ''

if (!databaseUrl) {
  console.error(
    '[prisma] 未找到 DATABASE_URL。请复制 apps/api/.env.example 为 apps/api/.env 并填写连接串。'
  )
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    // 由 `prisma migrate dev` / `prisma db seed` 调用
    seed: 'tsx prisma/seed.ts'
  },
  datasource: {
    url: databaseUrl
  }
})
