import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from './helpers.js'

describe('GET /api/health', () => {
  it('数据库连通时返回 200 与依赖状态', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.checks.database.status).toBe('up')
    expect(typeof res.body.checks.database.latencyMs).toBe('number')
    expect(typeof res.body.uptimeSeconds).toBe('number')
  })
})

describe('未知路由', () => {
  it('返回统一的错误信封', async () => {
    const res = await request(app).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.message).toContain('/api/does-not-exist')
  })
})
