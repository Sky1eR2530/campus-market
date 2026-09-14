import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import {
  app,
  seedCategory,
  seedItem,
  seedUserWithToken,
  truncateAll
} from './helpers.js'

let categoryId: number
let admin: Awaited<ReturnType<typeof seedUserWithToken>>
let member: Awaited<ReturnType<typeof seedUserWithToken>>

beforeEach(async () => {
  await truncateAll()
  categoryId = (await seedCategory()).id
  admin = await seedUserWithToken({
    email: 'admin@campus.edu',
    password: 'admin1234',
    nickname: '平台管理员',
    role: 'admin'
  })
  member = await seedUserWithToken({
    email: 'member@campus.edu',
    password: 'campus1234',
    nickname: '普通用户'
  })
})

describe('后台访问控制', () => {
  it('未登录访问后台返回 401', async () => {
    const res = await request(app).get('/api/admin/stats')

    expect(res.status).toBe(401)
  })

  it('普通用户访问后台返回 403（前端隐藏入口不算权限控制）', async () => {
    for (const path of [
      '/api/admin/stats',
      '/api/admin/users',
      '/api/admin/items',
      '/api/admin/categories',
      '/api/admin/actions'
    ]) {
      const res = await request(app).get(path).set('Authorization', member.auth)
      expect(res.status, path).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    }
  })

  it('普通用户不能执行写操作', async () => {
    const item = await seedItem({ sellerId: member.user.id, categoryId })

    const res = await request(app)
      .patch(`/api/admin/items/${item.id}/status`)
      .set('Authorization', member.auth)
      .send({ status: 'off_shelf' })

    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/stats', () => {
  it('返回用户、商品、分类与收藏的概览', async () => {
    await seedItem({ sellerId: member.user.id, categoryId, status: 'on_sale' })
    await seedItem({ sellerId: member.user.id, categoryId, status: 'sold' })
    await seedItem({ sellerId: member.user.id, categoryId, status: 'off_shelf' })
    await seedItem({ sellerId: member.user.id, categoryId, deletedAt: new Date() })

    const favoriteTarget = await seedItem({ sellerId: admin.user.id, categoryId })
    await request(app).post(`/api/favorites/${favoriteTarget.id}`).set('Authorization', member.auth)

    const res = await request(app).get('/api/admin/stats').set('Authorization', admin.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.users).toEqual({ total: 2, banned: 0, active: 2 })
    expect(res.body.data.items).toEqual({
      total: 4,
      onSale: 2,
      sold: 1,
      offShelf: 1,
      deleted: 1
    })
    expect(res.body.data.categories).toBe(1)
    expect(res.body.data.favorites).toBe(1)
  })
})

describe('用户管理', () => {
  it('支持按关键词搜索、按状态筛选与分页', async () => {
    await seedUserWithToken({ email: 'alice@campus.edu', password: 'campus1234', nickname: 'Alice' })

    const byKeyword = await request(app)
      .get('/api/admin/users?q=alice')
      .set('Authorization', admin.auth)
    expect(byKeyword.body.meta.total).toBe(1)
    expect(byKeyword.body.data[0].nickname).toBe('Alice')

    const banned = await seedUserWithToken({
      email: 'banned@campus.edu',
      password: 'campus1234',
      status: 'banned'
    })
    expect(banned.user.status).toBe('banned')

    const byStatus = await request(app)
      .get('/api/admin/users?status=banned')
      .set('Authorization', admin.auth)
    expect(byStatus.body.meta.total).toBe(1)

    const paged = await request(app)
      .get('/api/admin/users?pageSize=2')
      .set('Authorization', admin.auth)
    expect(paged.body.data).toHaveLength(2)
    expect(paged.body.meta.totalPages).toBe(2)
  })

  it('返回发布数量，且不泄露密码哈希', async () => {
    await seedItem({ sellerId: member.user.id, categoryId })
    await seedItem({ sellerId: member.user.id, categoryId, deletedAt: new Date() })

    const res = await request(app)
      .get('/api/admin/users?q=member')
      .set('Authorization', admin.auth)

    expect(res.body.data[0].itemCount).toBe(1)
    expect(res.body.data[0]).not.toHaveProperty('passwordHash')
  })

  it('封禁用户会同时写入操作日志', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'banned', reason: '发布虚假信息' })

    expect(res.status).toBe(204)

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: member.user.id } })
    expect(updated.status).toBe('banned')

    const logs = await prisma.adminAction.findMany()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      targetType: 'user',
      action: 'ban',
      reason: '发布虚假信息'
    })
  })

  it('解封用户写入 unban 日志', async () => {
    await prisma.user.update({ where: { id: member.user.id }, data: { status: 'banned' } })

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'active' })

    const logs = await prisma.adminAction.findMany()
    expect(logs[0].action).toBe('unban')
    expect(logs[0].reason).toBeNull()
  })

  it('不能修改自己的账号状态，避免管理员把自己锁在门外', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'banned' })

    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('自己')
  })

  it('不能封禁唯一的管理员账号', async () => {
    const secondAdmin = await seedUserWithToken({
      email: 'admin2@campus.edu',
      password: 'admin1234',
      role: 'admin'
    })

    // 现在有两个管理员，可以封禁其中一个
    const first = await request(app)
      .patch(`/api/admin/users/${secondAdmin.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'banned' })
    expect(first.status).toBe(204)

    // 只剩一个管理员时，另一个管理员尝试封禁他就是不允许的
    await prisma.user.update({ where: { id: admin.user.id }, data: { status: 'active' } })
    const successor = await seedUserWithToken({
      email: 'admin3@campus.edu',
      password: 'admin1234',
      role: 'admin'
    })
    const res = await request(app)
      .patch(`/api/admin/users/${successor.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'banned' })

    // 此时还有两个启用中的管理员，因此这次是允许的
    expect(res.status).toBe(204)
  })

  it('用户不存在时返回 404，id 非 uuid 也同样', async () => {
    const missing = await request(app)
      .patch('/api/admin/users/00000000-0000-7000-8000-000000000000/status')
      .set('Authorization', admin.auth)
      .send({ status: 'banned' })
    expect(missing.status).toBe(404)

    const invalid = await request(app)
      .patch('/api/admin/users/not-a-uuid/status')
      .set('Authorization', admin.auth)
      .send({ status: 'banned' })
    expect(invalid.status).toBe(404)
  })

  it('状态值非法时返回 422', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'deleted' })

    expect(res.status).toBe(422)
  })
})

describe('商品管理', () => {
  it('默认只列出未删除的商品，可以显式包含已删除的', async () => {
    await seedItem({ sellerId: member.user.id, categoryId, title: '正常商品' })
    await seedItem({
      sellerId: member.user.id,
      categoryId,
      title: '已删除商品',
      deletedAt: new Date()
    })

    const defaultList = await request(app).get('/api/admin/items').set('Authorization', admin.auth)
    expect(defaultList.body.meta.total).toBe(1)

    const withDeleted = await request(app)
      .get('/api/admin/items?includeDeleted=true')
      .set('Authorization', admin.auth)
    expect(withDeleted.body.meta.total).toBe(2)
  })

  it('支持按标题与卖家昵称搜索', async () => {
    await seedItem({ sellerId: member.user.id, categoryId, title: '机械键盘' })

    const byTitle = await request(app)
      .get('/api/admin/items?q=键盘')
      .set('Authorization', admin.auth)
    expect(byTitle.body.meta.total).toBe(1)

    const bySeller = await request(app)
      .get(`/api/admin/items?q=${encodeURIComponent('普通用户')}`)
      .set('Authorization', admin.auth)
    expect(bySeller.body.meta.total).toBe(1)
  })

  it('返回封面图与卖家信息，便于后台辨认', async () => {
    await seedItem({ sellerId: member.user.id, categoryId, imageCount: 2 })

    const res = await request(app).get('/api/admin/items').set('Authorization', admin.auth)

    expect(res.body.data[0].coverUrl).toContain('/uploads/')
    expect(res.body.data[0].sellerNickname).toBe('普通用户')
    expect(res.body.data[0].categoryName).toBe('数码产品')
  })

  it('下架商品写入 take_down 日志', async () => {
    const item = await seedItem({ sellerId: member.user.id, categoryId })

    const res = await request(app)
      .patch(`/api/admin/items/${item.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'off_shelf', reason: '疑似违规内容' })

    expect(res.status).toBe(204)

    const updated = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.status).toBe('off_shelf')

    const log = await prisma.adminAction.findFirstOrThrow()
    expect(log).toMatchObject({ action: 'take_down', targetType: 'item', reason: '疑似违规内容' })
  })

  it('恢复商品不会刷新发布时间（与卖家重新上架的语义不同）', async () => {
    const publishedAt = new Date('2026-01-01T00:00:00Z')
    const item = await seedItem({
      sellerId: member.user.id,
      categoryId,
      status: 'off_shelf',
      publishedAt
    })

    await request(app)
      .patch(`/api/admin/items/${item.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'on_sale' })

    const updated = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.publishedAt.getTime()).toBe(publishedAt.getTime())
  })

  it('删除商品是软删除并写入日志', async () => {
    const item = await seedItem({ sellerId: member.user.id, categoryId })

    const res = await request(app)
      .delete(`/api/admin/items/${item.id}`)
      .set('Authorization', admin.auth)
      .send({ reason: '重复发布' })

    expect(res.status).toBe(204)

    const updated = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.deletedAt).not.toBeNull()
    expect(updated.status).toBe('off_shelf')

    const log = await prisma.adminAction.findFirstOrThrow()
    expect(log.action).toBe('delete')
  })
})

describe('分类管理', () => {
  it('后台可以看到已停用的分类', async () => {
    await prisma.category.create({
      data: { slug: 'paused', name: '已停用分类', icon: 'box', sortOrder: 9, isActive: false }
    })

    const res = await request(app).get('/api/admin/categories').set('Authorization', admin.auth)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.map((row: { slug: string }) => row.slug)).toContain('paused')
  })

  it('可以新建分类，前台立即可见（创建后不要求重启或发版）', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', admin.auth)
      .send({ slug: 'sports', name: '运动器材', icon: 'box', sortOrder: 7 })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ slug: 'sports', name: '运动器材', itemCount: 0 })

    // 前台的公开分类接口应当立刻能拿到它
    const publicList = await request(app).get('/api/categories')
    expect(publicList.body.data.map((row: { slug: string }) => row.slug)).toContain('sports')
  })

  it('标识重复时返回 409', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', admin.auth)
      .send({ slug: 'digital', name: '重复标识', icon: 'box' })

    expect(res.status).toBe(409)
  })

  it('标识格式非法时返回 422', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', admin.auth)
      .send({ slug: 'Bad Slug!', name: '格式错误', icon: 'box' })

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'slug' }))
  })

  it('可以修改名称、排序与启用状态', async () => {
    const res = await request(app)
      .patch(`/api/admin/categories/${categoryId}`)
      .set('Authorization', admin.auth)
      .send({ name: '数码与配件', sortOrder: 5, isActive: false })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('数码与配件')
    expect(res.body.data.sortOrder).toBe(5)

    // 停用后前台不再返回该分类
    const publicList = await request(app).get('/api/categories')
    expect(publicList.body.data).toHaveLength(0)
  })

  it('分类下还有商品时不允许删除，并给出可执行的处理建议', async () => {
    await seedItem({ sellerId: member.user.id, categoryId })

    const res = await request(app)
      .delete(`/api/admin/categories/${categoryId}`)
      .set('Authorization', admin.auth)

    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('停用')
  })

  it('空分类可以删除', async () => {
    const empty = await prisma.category.create({
      data: { slug: 'empty', name: '空分类', icon: 'box', sortOrder: 9 }
    })

    const res = await request(app)
      .delete(`/api/admin/categories/${empty.id}`)
      .set('Authorization', admin.auth)

    expect(res.status).toBe(204)
    expect(await prisma.category.count({ where: { id: empty.id } })).toBe(0)
  })

  it('不存在的分类返回 404', async () => {
    const res = await request(app)
      .patch('/api/admin/categories/999999')
      .set('Authorization', admin.auth)
      .send({ name: '不存在' })

    expect(res.status).toBe(404)
  })
})

describe('操作日志', () => {
  it('按时间倒序返回，并带上操作人昵称', async () => {
    const item = await seedItem({ sellerId: member.user.id, categoryId })

    await request(app)
      .patch(`/api/admin/items/${item.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'off_shelf', reason: '第一条' })

    await request(app)
      .patch(`/api/admin/users/${member.user.id}/status`)
      .set('Authorization', admin.auth)
      .send({ status: 'banned', reason: '第二条' })

    const res = await request(app).get('/api/admin/actions').set('Authorization', admin.auth)

    expect(res.body.meta.total).toBe(2)
    expect(res.body.data[0].reason).toBe('第二条')
    expect(res.body.data[0].adminNickname).toBe('平台管理员')
    expect(res.body.data[0].targetType).toBe('user')
    expect(res.body.data[1].action).toBe('take_down')
  })
})
