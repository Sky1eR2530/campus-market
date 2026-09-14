import express from 'express'
import type { Express } from 'express'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { requestLogger } from './middlewares/requestLogger.js'
import { authRouter } from './modules/auth/auth.router.js'
import { healthRouter } from './modules/health/health.router.js'

/** 组装 Express 应用。与进程启动分离，方便后续在测试中直接拿到 app 实例 */
export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  // 生产环境部署在反向代理之后，需要信任代理头才能拿到真实 IP 与协议
  app.set('trust proxy', 1)

  app.use(express.json({ limit: '1mb' }))
  app.use(requestLogger)

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)

  // 顺序要求：404 兜底在前，错误处理必须放在最后
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
