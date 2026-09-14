import express from 'express'
import type { Express } from 'express'
import { env } from './config/env.js'
import { storagePublicDir } from './lib/storage/index.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { globalLimiter } from './middlewares/rateLimit.js'
import { requestLogger } from './middlewares/requestLogger.js'
import { securityHeaders } from './middlewares/securityHeaders.js'
import { authRouter } from './modules/auth/auth.router.js'
import { adminRouter } from './modules/admin/admin.router.js'
import { categoryRouter } from './modules/categories/category.router.js'
import { favoriteRouter } from './modules/favorites/favorite.router.js'
import { healthRouter } from './modules/health/health.router.js'
import { itemRouter } from './modules/items/item.router.js'
import { uploadRouter } from './modules/uploads/upload.router.js'
import { userRouter } from './modules/users/user.router.js'

/** 组装 Express 应用。与进程启动分离，方便后续在测试中直接拿到 app 实例 */
export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  // 生产环境部署在反向代理之后，需要信任代理头才能拿到真实 IP 与协议
  app.set('trust proxy', 1)

  app.use(securityHeaders)
  app.use(express.json({ limit: '1mb' }))
  app.use(requestLogger)

  // 全局限流兜底；更严格的限制挂在具体路由上
  app.use('/api', globalLimiter)

  // 上传的图片。文件名是随机 UUID，内容不会变，因此可以长期缓存
  app.use(
    env.STORAGE_PUBLIC_PATH,
    express.static(storagePublicDir, { immutable: true, maxAge: '30d', index: false })
  )

  app.use('/api/health', healthRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/categories', categoryRouter)
  app.use('/api/items', itemRouter)
  app.use('/api/favorites', favoriteRouter)
  app.use('/api/users', userRouter)
  app.use('/api/uploads', uploadRouter)

  // 顺序要求：404 兜底在前，错误处理必须放在最后
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
