import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

/**
 * 本地开发数据库。
 *
 * 开发机没有 Docker、也不想为了跑起来就注册云数据库时，用这个脚本在本地拉起一个
 * 真实的 PostgreSQL 实例（二进制随依赖分发，数据保存在 apps/api/.localdb）。
 *
 * 用法：
 *   终端 A：pnpm dev:api 启动前先执行 pnpm db:local
 *   终端 B：pnpm dev:api
 *
 * 生产环境请改用托管数据库（Neon / Supabase 等），见 README。
 */

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const dataDir = path.join(projectDir, '.localdb')

const DATABASE = {
  name: 'campus_market',
  user: 'campus',
  password: 'campus',
  port: 5433
}

const verbose = process.env.DEBUG_LOCAL_DB === '1'

const postgres = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: DATABASE.user,
  password: DATABASE.password,
  port: DATABASE.port,
  persistent: true,
  onLog: verbose ? (message: string) => console.log(`  [postgres] ${message}`) : () => {},
  onError: (error: unknown) => console.error('  [postgres]', error)
})

async function ensureDatabase(): Promise<void> {
  const client = postgres.getPgClient('postgres')
  await client.connect()
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      DATABASE.name
    ])
    if (result.rowCount === 0) {
      await postgres.createDatabase(DATABASE.name)
      console.log(`  已创建数据库 ${DATABASE.name}`)
    }
  } finally {
    await client.end()
  }
}

let stopping = false
async function shutdown(signal: string): Promise<void> {
  if (stopping) return
  stopping = true
  console.log(`\n收到 ${signal}，正在停止本地数据库…`)
  await postgres.stop()
  console.log('已停止。数据仍保留在 apps/api/.localdb，下次启动直接复用。')
  process.exit(0)
}

const isFirstRun = !existsSync(path.join(dataDir, 'PG_VERSION'))

if (isFirstRun) {
  console.log('首次运行，正在初始化数据目录（大约需要十几秒）…')
  await postgres.initialise()
}

await postgres.start()
await ensureDatabase()

console.log('')
console.log('  本地 PostgreSQL 已就绪')
console.log(`  地址：localhost:${DATABASE.port}`)
console.log(`  用户：${DATABASE.user}    密码：${DATABASE.password}`)
console.log(`  数据库：${DATABASE.name}`)
console.log('')
console.log('  连接串（写入 apps/api/.env 的 DATABASE_URL）：')
console.log(
  `  postgresql://${DATABASE.user}:${DATABASE.password}@localhost:${DATABASE.port}/${DATABASE.name}?schema=public`
)
console.log('')
console.log('  按 Ctrl+C 停止')

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

// 保持进程存活，让数据库持续可连接
await new Promise(() => {})
