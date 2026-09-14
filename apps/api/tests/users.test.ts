import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import { app, seedCategory, seedItem, seedUser, seedUserWithToken, truncateAll } from './helpers.js'

const MISSING_UUID = '00000000-0000-7000-8000-000000000000'

let categoryId: number
let user: Awaited<ReturnType<typeof seedUserWithToken>>
let viewer: Awaited<ReturnType<typeof seedUserWithToken>>

beforeEach(async () => {
  await truncateAll()
  categoryId = (await seedCategory()).id
  user = await seedUserWithToken({
    email: 'profile@campus.edu',
    password: 'campus1234',
    nickname: '原昵称',
    school: '云川大学',
    campus: '东湖校区',
    contact: '微信 old'
  })
  viewer = await seedUserWithToken({ email: 'viewer@campus.edu', password: 'campus1234' })
})

describe('PATCH /api/users/me', () => {
  it('未登录不能修改资料', async () => {
    const res = await request(app).patch('/api/users/me').send({ nickname: '新昵称' })

    expect(res.status).toBe(401)
  })

  it('可以修改昵称、校区与联系方式', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', user.auth)
      .send({ nickname: '新昵称', campus: '华中校区', contact: '微信 new' })

    expect(res.status).toBe(200)
    expect(res.body.data.nickname).toBe('新昵称')
    expect(res.body.data.campus).toBe('华中校区')
    expect(res.body.data.contact).toBe('微信 new')
    // 未提交的字段保持原值
    expect(res.body.data.school).toBe('云川大学')
  })

  it('空字符串按清空字段处理，避免库里出现空串与 null 两种空值', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', user.auth)
      .send({ bio: '', contact: '   ' })

    expect(res.status).toBe(200)
    expect(res.body.data.bio).toBeNull()
    expect(res.body.data.contact).toBeNull()
  })

  it('昵称不合法时返回 422', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', user.auth)
      .send({ nickname: 'A' })

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'nickname' }))
  })

  it('修改学校后，已发布商品的学校信息同步更新', async () => {
    const item = await seedItem({ sellerId: user.user.id, categoryId })

    await request(app)
      .patch('/api/users/me')
      .set('Authorization', user.auth)
      .send({ school: '新的大学', campus: '新校区' })

    const updated = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.school).toBe('新的大学')
    expect(updated.campus).toBe('新校区')
  })

  it('不修改学校时不会误改商品的学校信息', async () => {
    const item = await seedItem({ sellerId: user.user.id, categoryId })

    await request(app)
      .patch('/api/users/me')
      .set('Authorization', user.auth)
      .send({ bio: '随便写点简介' })

    const updated = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.school).toBeNull()
  })
})

describe('GET /api/users/:id', () => {
  it('未登录可见卖家信息，但不返回联系方式', async () => {
    const res = await request(app).get(`/api/users/${user.user.id}`)

    expect(res.status).toBe(200)
    expect(res.body.data.nickname).toBe('原昵称')
    expect(res.body.data.contact).toBeNull()
  })

  it('登录后可以拿到联系方式', async () => {
    const res = await request(app)
      .get(`/api/users/${user.user.id}`)
      .set('Authorization', viewer.auth)

    expect(res.body.data.contact).toBe('微信 old')
  })

  it('返回发布数量与在售数量', async () => {
    await seedItem({ sellerId: user.user.id, categoryId, status: 'on_sale' })
    await seedItem({ sellerId: user.user.id, categoryId, status: 'sold' })
    await seedItem({ sellerId: user.user.id, categoryId, status: 'off_shelf' })
    await seedItem({ sellerId: viewer.user.id, categoryId })

    const res = await request(app).get(`/api/users/${user.user.id}`)

    expect(res.body.data.itemCount).toBe(3)
    expect(res.body.data.onSaleCount).toBe(1)
  })

  it('软删除的商品不计入统计', async () => {
    await seedItem({ sellerId: user.user.id, categoryId })
    await prisma.item.updateMany({
      where: { sellerId: user.user.id },
      data: { deletedAt: new Date() }
    })

    const res = await request(app).get(`/api/users/${user.user.id}`)

    expect(res.body.data.itemCount).toBe(0)
  })

  it('用户不存在时返回 404', async () => {
    const res = await request(app).get(`/api/users/${MISSING_UUID}`)

    expect(res.status).toBe(404)
  })

  it('id 不是 uuid 时返回 404 而不是 500', async () => {
    const res = await request(app).get('/api/users/not-a-uuid')

    expect(res.status).toBe(404)
  })

  it('被封禁的账号等同于不存在', async () => {
    const banned = await seedUser({
      email: 'banned@campus.edu',
      password: 'campus1234',
      status: 'banned'
    })

    const res = await request(app).get(`/api/users/${banned.id}`)

    expect(res.status).toBe(404)
  })

  it('卖家信息里不包含邮箱等敏感字段', async () => {
    const res = await request(app).get(`/api/users/${user.user.id}`)

    expect(res.body.data).not.toHaveProperty('email')
    expect(res.body.data).not.toHaveProperty('passwordHash')
    expect(res.body.data).not.toHaveProperty('status')
  })
})
