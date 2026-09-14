import { ERROR_CODES } from '@campus/shared'
import type { Request, RequestHandler } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { env } from '../config/env.js'

export interface RateLimitOptions {
  windowMs: number
  limit: number
  /**
   * 是否跳过限流。默认在测试环境跳过——测试会发起大量请求，
   * 限流会把测试本身挡掉。需要验证限流行为时可以显式传入。
   */
  skip?: () => boolean
  /** 自定义计数键，用于「IP + 账号」这类更细的维度 */
  keyGenerator?: (req: Request) => string
}

const defaultSkip = (): boolean => env.NODE_ENV === 'test'

/**
 * 统一的限流器工厂。
 * 超出限制时返回项目的标准错误信封，而不是库默认的纯文本，
 * 前端因此不需要为 429 单独写一套解析逻辑。
 */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    keyGenerator: options.keyGenerator,
    skip: options.skip ?? defaultSkip,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: '请求过于频繁，请稍后再试'
        }
      })
    }
  })
}

const MINUTE = 60 * 1000

/**
 * 全局兜底。
 *
 * 额度定得比较宽松，原因很实际：校园网几乎都是 NAT 共享出口 IP，
 * 一栋宿舍楼可能只有少数几个公网地址。按 IP 限流如果收得太紧，
 * 一个同学跑脚本会把整栋楼的人一起挡在门外。
 * 这里的目标是拦住失控的批量请求，不是做精细化配额。
 */
export const globalLimiter = createRateLimiter({ windowMs: 15 * MINUTE, limit: 3000 })

/**
 * 登录与注册。
 *
 * 计数维度是「IP + 邮箱」而不是单纯 IP：按 IP 计会在共享出口下误伤无关用户，
 * 按邮箱计又挡不住换邮箱的撞库。两者结合既能限制针对某个账号的暴力尝试，
 * 也不会因为同一个出口地址有多个同学同时登录而互相影响。
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * MINUTE,
  // 20 次/15 分钟：正常用户不会触及，脚本化的暴力尝试会被明显拖慢。
  // 注意这一额度是「同一个出口 IP + 同一个邮箱」共用的，
  // 因此反复执行端到端测试时可能自己把自己挡住，重启后端即可清零。
  limit: 20,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    // 必须用 ipKeyGenerator 归一化：IPv6 同一个地址有多种写法，
    // 直接用 req.ip 拼字符串会让攻击者通过换写法绕过限制
    return `${ipKeyGenerator(req.ip ?? '')}|${email}`
  }
})

/** 上传：按小时放开一些，但限制单 IP 的图片写入量 */
export const uploadLimiter = createRateLimiter({ windowMs: 60 * MINUTE, limit: 300 })
