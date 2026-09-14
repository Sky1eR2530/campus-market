import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger, setLogLevel } from './lib/logger.js'
import { disconnectDatabase } from './lib/prisma.js'

setLogLevel(env.LOG_LEVEL)

const app = createApp()
const server = app.listen(env.PORT, () => {
  logger.info('API 服务已启动', {
    port: env.PORT,
    environment: env.NODE_ENV,
    address: `http://localhost:${env.PORT}`
  })
})

/**
 * 优雅退出：先停止接收新连接，再断开数据库，
 * 避免部署重启时把正在处理的请求拦腰截断。
 */
let shuttingDown = false

function shutdown(signal: string): void {
  if (shuttingDown) return
  shuttingDown = true
  logger.info(`收到 ${signal}，开始优雅退出`)

  server.close(() => {
    void disconnectDatabase()
      .then(() => {
        logger.info('已安全退出')
        process.exit(0)
      })
      .catch((error: unknown) => {
        logger.error('断开数据库连接失败', {
          message: error instanceof Error ? error.message : String(error)
        })
        process.exit(1)
      })
  })

  // 兜底：10 秒内没退干净就强制结束，避免僵尸进程
  setTimeout(() => {
    logger.warn('退出超时，强制结束进程')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
