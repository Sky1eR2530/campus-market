import type { RequestHandler } from 'express'
import { logger } from '../lib/logger.js'

/** 记录每个请求的结果与耗时，便于排查慢接口和异常状态码 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = performance.now()

  res.on('finish', () => {
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    }

    // 健康检查会被探针高频调用，降到 debug 避免刷屏
    if (req.path.startsWith('/api/health')) {
      logger.debug('请求完成', meta)
    } else if (res.statusCode >= 500) {
      logger.error('请求失败', meta)
    } else if (res.statusCode >= 400) {
      logger.warn('请求异常', meta)
    } else {
      logger.info('请求完成', meta)
    }
  })

  next()
}
