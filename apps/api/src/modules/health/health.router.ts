import { Router } from 'express'
import { env } from '../../config/env.js'
import { checkDatabase } from '../../lib/prisma.js'

export const healthRouter = Router()

/**
 * GET /api/health
 * 同时反映进程状态与依赖状态：数据库不可用时返回 503，
 * 这样部署平台的健康检查能直接把故障实例摘掉。
 */
healthRouter.get('/', async (_req, res) => {
  const database = await checkDatabase()
  const healthy = database.status === 'up'

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database }
  })
})
