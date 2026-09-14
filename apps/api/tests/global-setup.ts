import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'pg'
import { apiDir, resolveTestDatabase } from './test-env.js'

const migrationsDir = path.join(apiDir, 'prisma', 'migrations')

/**
 * 准备测试数据库：不存在就创建，然后重建 schema 并应用全部迁移。
 *
 * 这里直接执行 migrations 目录下的 SQL，而不是调用 `prisma migrate deploy`：
 * 后者需要启动 CLI 子进程，在不同环境下（CI、受限沙箱）容易失败，
 * 而测试库本身就是一次性的，每次运行都会被完全重建。
 */
async function rebuildSchema(connectionString: string): Promise<void> {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE')
    await client.query('CREATE SCHEMA public')

    const dirs = (await readdir(migrationsDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    for (const dir of dirs) {
      const sql = await readFile(path.join(migrationsDir, dir, 'migration.sql'), 'utf8')
      await client.query(sql)
    }

    console.log(`[test] 测试库已重建，应用了 ${dirs.length} 个迁移`)
  } finally {
    await client.end()
  }
}

async function ensureDatabaseExists(
  maintenanceUrl: string,
  databaseName: string
): Promise<void> {
  const admin = new Client({ connectionString: maintenanceUrl })
  await admin.connect()

  try {
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName
    ])
    if (existing.rowCount === 0) {
      // 库名来自配置文件而非用户输入，这里加双引号是为了兼容大小写与连字符
      await admin.query(`CREATE DATABASE "${databaseName}"`)
      console.log(`[test] 已创建测试库 ${databaseName}`)
    }
  } finally {
    await admin.end()
  }
}

export default async function globalSetup(): Promise<void> {
  const { url, maintenanceUrl, databaseName } = resolveTestDatabase()

  await ensureDatabaseExists(maintenanceUrl, databaseName)
  await rebuildSchema(url)
}
