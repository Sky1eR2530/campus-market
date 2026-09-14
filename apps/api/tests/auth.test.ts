import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import { app, seedUser, truncateAll } from './helpers.js'

const VALID_PASSWORD = 'campus1234'

beforeEach(async () => {
  await truncateAll()
})

describe('POST /api/auth/register', () => {
  it('注册成功后返回 token 与用户信息，且不泄露密码字段', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'New.User@Campus.edu',
      nickname: '沈知远',
      password: VALID_PASSWORD
    })

    expect(res.status).toBe(201)
    expect(typeof res.body.data.token).toBe('string')
    expect(res.body.data.token.length).toBeGreaterThan(20)
    // 邮箱统一小写存储，避免大小写变体注册出两个账号
    expect(res.body.data.user.email).toBe('new.user@campus.edu')
    expect(res.body.data.user.nickname).toBe('沈知远')
    expect(res.body.data.user.role).toBe('user')
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
    expect(res.body.data.user).not.toHaveProperty('password')
  })

  it('密码以 bcrypt 哈希落库，不会出现明文', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'hash@campus.edu',
      nickname: '哈希测试',
      password: VALID_PASSWORD
    })

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'hash@campus.edu' } })
    expect(stored.passwordHash).not.toBe(VALID_PASSWORD)
    expect(stored.passwordHash.startsWith('$2')).toBe(true)
    expect(stored.passwordHash.length).toBeGreaterThan(50)
  })

  it('重复邮箱返回 409', async () => {
    await seedUser({ email: 'taken@campus.edu', password: VALID_PASSWORD })

    const res = await request(app).post('/api/auth/register').send({
      email: 'taken@campus.edu',
      nickname: '撞车',
      password: VALID_PASSWORD
    })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('邮箱大小写不同视为同一账号', async () => {
    await seedUser({ email: 'case@campus.edu', password: VALID_PASSWORD })

    const res = await request(app).post('/api/auth/register').send({
      email: 'CASE@Campus.EDU',
      nickname: '撞车',
      password: VALID_PASSWORD
    })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('弱密码（纯数字）被拒绝，并指出具体字段', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'weak@campus.edu',
      nickname: '弱密码',
      password: '12345678'
    })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ field: 'password' })
    )
  })

  it('超长密码被拒绝（bcrypt 只使用前 72 字节，静默截断会造成误解）', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'long@campus.edu',
      nickname: '长密码',
      password: `${'a1'.repeat(33)}`
    })

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ field: 'password' })
    )
  })

  it('邮箱格式不合法返回 422', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      nickname: '格式',
      password: VALID_PASSWORD
    })

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'email' }))
  })

  it('昵称过短返回 422', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nick@campus.edu',
      nickname: 'A',
      password: VALID_PASSWORD
    })

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'nickname' }))
  })

  it('注册后写入的账号可以直接用于登录', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'flow@campus.edu',
      nickname: '流程',
      password: VALID_PASSWORD
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'flow@campus.edu', password: VALID_PASSWORD })

    expect(res.status).toBe(200)
    expect(typeof res.body.data.token).toBe('string')
  })
})

describe('POST /api/auth/login', () => {
  it('凭证正确时返回 token 并更新最后登录时间', async () => {
    const user = await seedUser({ email: 'login@campus.edu', password: VALID_PASSWORD })
    expect(user.lastLoginAt).toBeNull()

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@campus.edu', password: VALID_PASSWORD })

    expect(res.status).toBe(200)
    expect(typeof res.body.data.token).toBe('string')

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.lastLoginAt).not.toBeNull()
  })

  it('大小写不同的邮箱也能登录成功', async () => {
    await seedUser({ email: 'mixed@campus.edu', password: VALID_PASSWORD })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'MIXED@campus.edu', password: VALID_PASSWORD })

    expect(res.status).toBe(200)
  })

  it('密码错误返回 401', async () => {
    await seedUser({ email: 'wrong@campus.edu', password: VALID_PASSWORD })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@campus.edu', password: 'campus9999' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('邮箱不存在时的响应与密码错误完全一致，避免账号枚举', async () => {
    await seedUser({ email: 'exists@campus.edu', password: VALID_PASSWORD })

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'exists@campus.edu', password: 'campus9999' })

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@campus.edu', password: VALID_PASSWORD })

    expect(unknownEmail.status).toBe(wrongPassword.status)
    expect(unknownEmail.body).toEqual(wrongPassword.body)
  })

  it('被封禁的账号无法登录，返回 403', async () => {
    await seedUser({ email: 'banned@campus.edu', password: VALID_PASSWORD, status: 'banned' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'banned@campus.edu', password: VALID_PASSWORD })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('ACCOUNT_BANNED')
  })

  it('缺少字段返回 422', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@campus.edu' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('GET /api/auth/me', () => {
  async function registerAndGetToken(email = 'me@campus.edu'): Promise<string> {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, nickname: '当前用户', password: VALID_PASSWORD })
    return res.body.data.token as string
  }

  it('携带有效 token 时返回当前用户', async () => {
    const token = await registerAndGetToken()

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('me@campus.edu')
    expect(res.body.data).not.toHaveProperty('passwordHash')
  })

  it('不带 token 返回 401', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('伪造或篡改 token 返回 401', async () => {
    const token = await registerAndGetToken('forged@campus.edu')
    const tampered = `${token.slice(0, -4)}aaaa`

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tampered}`)

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('Authorization 头格式不对返回 401', async () => {
    const token = await registerAndGetToken('format@campus.edu')

    const res = await request(app).get('/api/auth/me').set('Authorization', token)

    expect(res.status).toBe(401)
  })

  it('token 对应的账号已被删除时返回 401', async () => {
    const token = await registerAndGetToken('gone@campus.edu')
    await prisma.user.deleteMany({ where: { email: 'gone@campus.edu' } })

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('签发之后被封禁的账号立即失去访问权限', async () => {
    const token = await registerAndGetToken('later-banned@campus.edu')
    await prisma.user.updateMany({
      where: { email: 'later-banned@campus.edu' },
      data: { status: 'banned' }
    })

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('ACCOUNT_BANNED')
  })
})

describe('POST /api/auth/logout', () => {
  it('返回 204，客户端据此清除本地登录态', async () => {
    const res = await request(app).post('/api/auth/logout')

    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })
})
