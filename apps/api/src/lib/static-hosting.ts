import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Express, RequestHandler } from 'express'
import express from 'express'
import { env, isProduction } from '../config/env.js'
import { logger } from './logger.js'

/**
 * 生产环境的前端托管。
 *
 * 学生端、管理端与 API 由同一个服务提供，好处是三者同源：
 * 没有跨域预检、没有 Cookie 的 SameSite 限制、开发与生产行为一致，
 * 对外也只有一个访问地址。
 *
 * 其余环境（开发）由 Vite 负责，这里直接跳过。
 */

/** 这些前缀属于后端，不能被前端的 SPA 回退接管 */
const RESERVED_PREFIXES = ['/api', '/uploads']

/**
 * SPA 回退：找不到静态文件时返回 index.html，交给前端路由处理。
 *
 * 用中间件而不是 `app.get('*')`：Express 5 不再接受裸通配符路径，
 * 写 `'*'` 会直接抛错。
 */
function spaFallback(indexFile: string, skip: (pathname: string) => boolean): RequestHandler {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    // 只处理浏览器直接访问页面的请求；接口返回 JSON，不该被回退成 HTML
    if (!req.accepts('html')) {
      next()
      return
    }
    if (skip(req.path)) {
      next()
      return
    }
    res.sendFile(indexFile)
  }
}

function resolveDistDir(dir: string, label: string): string | null {
  const resolved = path.resolve(dir)
  if (!existsSync(path.join(resolved, 'index.html'))) {
    logger.warn(`${label}产物不存在，跳过托管`, { dir: resolved })
    return null
  }
  return resolved
}

export function mountStaticApps(app: Express): void {
  if (!isProduction) return

  const webDir = resolveDistDir(env.WEB_DIST_DIR, '学生端')
  const adminDir = resolveDistDir(env.ADMIN_DIST_DIR, '管理端')

  // 管理端先挂载：它的产物引用 /admin/assets/*，
  // 而且必须在学生端的回退之前处理，否则 /admin/xxx 会被学生端的 index.html 接管
  if (adminDir) {
    app.use(
      '/admin',
      express.static(adminDir, {
        index: 'index.html',
        setHeaders: (res, filePath) => {
          // 带内容哈希的产物可以长期缓存，index.html 必须每次校验
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        }
      })
    )
    app.use(
      '/admin',
      spaFallback(path.join(adminDir, 'index.html'), () => false)
    )
  }

  if (webDir) {
    app.use(
      express.static(webDir, {
        index: 'index.html',
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        }
      })
    )
    app.use(
      spaFallback(path.join(webDir, 'index.html'), (pathname) =>
        RESERVED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
      )
    )
  }

  if (webDir || adminDir) {
    logger.info('前端产物已托管', { web: webDir, admin: adminDir })
  }
}
