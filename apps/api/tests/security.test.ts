import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { errorHandler } from '../src/middlewares/errorHandler.js'
import { createRateLimiter } from '../src/middlewares/rateLimit.js'
import { app, fakeImageUrl, seedCategory, seedUserWithToken, truncateAll } from './helpers.js'

/** 构造一个只挂限流器的最小应用，用来单独验证限流行为 */
function buildLimitedApp(limit: number, skip?: () => boolean) {
  const limited = express()
  limited.get(
    '/ping',
    createRateLimiter({ windowMs: 60_000, limit, ...(skip ? { skip } : {}) }),
    (_req, res) => {
      res.json({ data: 'pong' })
    }
  )
  limited.use(errorHandler)
  return limited
}

beforeEach(async () => {
  await truncateAll()
})

describe('安全响应头', () => {
  it('不暴露框架信息', async () => {
    const res = await request(app).get('/api/health')

    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('设置基础的防护响应头', async () => {
    const res = await request(app).get('/api/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(res.headers['content-security-policy']).toContain("object-src 'none'")
    expect(res.headers['content-security-policy']).toContain("script-src 'self'")
  })
})

describe('接口限流', () => {
  it('超过限制后返回 429，且使用统一的错误信封', async () => {
    const limited = buildLimitedApp(2, () => false)

    await request(limited).get('/ping').expect(200)
    await request(limited).get('/ping').expect(200)

    const blocked = await request(limited).get('/ping')

    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')
    expect(blocked.body.error.message).toContain('频繁')
  })

  it('测试环境默认关闭限流，避免把测试本身挡掉', async () => {
    const limited = buildLimitedApp(1)

    // 限制设为 1，但由于运行在测试环境，第二次请求仍然应当通过
    await request(limited).get('/ping').expect(200)
    await request(limited).get('/ping').expect(200)
  })
})

describe('服务端兜底', () => {
  it('未声明的字段会被丢弃，不能让客户端直接写内部字段', async () => {
    const category = await seedCategory()
    const seller = await seedUserWithToken({ email: 'extra@campus.edu', password: 'campus1234' })

    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send({
        title: '尝试注入额外字段',
        description: '这是一段足够长度的商品描述内容，用于通过校验。',
        priceCents: 1000,
        categorySlug: category.slug,
        images: [fakeImageUrl('a.jpg')],
        // 以下字段都不在共享 schema 里，应当被直接丢弃
        viewCount: 99999,
        favoriteCount: 88888,
        status: 'sold',
        deletedAt: new Date().toISOString()
      })

    expect(res.status).toBe(201)
    expect(res.body.data.viewCount).toBe(0)
    expect(res.body.data.favoriteCount).toBe(0)
    expect(res.body.data.status).toBe('on_sale')
  })

  it('商品描述里的脚本内容按纯文本原样存储，不会被当作 HTML', async () => {
    const category = await seedCategory()
    const seller = await seedUserWithToken({ email: 'xss@campus.edu', password: 'campus1234' })
    const evil = '<script>alert(1)</script> 这是一段足够长的描述内容。'

    const created = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send({
        title: 'XSS 复查',
        description: evil,
        priceCents: 1000,
        categorySlug: category.slug,
        images: [fakeImageUrl('xss.jpg')]
      })

    // 后端不做转义、也不做过滤，原样保存；是否渲染成 HTML 由前端决定
    expect(created.body.data.description).toBe(evil)

    // 前端全程使用插值（{{ }}）而非 v-html，因此不存在直接注入点
    const detail = await request(app).get(`/api/items/${created.body.data.id}`)
    expect(detail.body.data.description).toBe(evil)
  })
})
