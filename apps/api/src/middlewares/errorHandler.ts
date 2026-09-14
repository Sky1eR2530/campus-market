import { AppError, ERROR_CODES } from '@campus/shared'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { isProduction } from '../config/env.js'
import { logger } from '../lib/logger.js'

/** 兜底 404：走到这里说明没有任何路由匹配，返回统一的错误信封 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `接口不存在：${req.method} ${req.originalUrl}`
    }
  })
}

/**
 * 统一错误处理。
 * Express 5 会把 async 处理函数中抛出的异常自动转发到这里，
 * 因此路由里不需要写 try/catch 包裹。
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? []
      }
    })
    return
  }

  logger.error('未处理的异常', {
    method: req.method,
    path: req.originalUrl,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })

  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      // 生产环境不把内部错误细节暴露给客户端
      message: isProduction
        ? '服务器内部错误，请稍后重试'
        : `服务器内部错误：${error instanceof Error ? error.message : String(error)}`
    }
  })
}
