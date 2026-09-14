import { isProduction } from '../config/env.js'
import helmet from 'helmet'
import type { RequestHandler } from 'express'

/**
 * 安全响应头。
 *
 * 说明：当前这个服务只返回 JSON 与图片，CSP 实际上还不生效；
 * 等到部署阶段由同一个服务托管前端页面时（Phase 6），
 * 需要以「真的加载一次页面」的方式重新验证 CSP 不会拦掉资源。
 */
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 商品图片来自同源 /uploads，另外允许 data: 与 blob:（前端占位图与预览用）
      imgSrc: ["'self'", 'data:', 'blob:'],
      // Vue 的 :style 绑定会生成内联样式属性
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  // 图片需要能被前端页面以 <img> 引用（同源部署时同样是同源，这里放宽是为了兼容分离部署）
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // 生产环境启用 HSTS
  hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true } : false
})
