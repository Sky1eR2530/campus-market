import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import {
  app,
  fakeImageUrl,
  seedCategory,
  seedItem,
  seedUserWithToken,
  truncateAll,
  TINY_PNG
} from './helpers.js'

const MISSING_UUID = '00000000-0000-7000-8000-000000000000'

let categoryId: number
let seller: Awaited<ReturnType<typeof seedUserWithToken>>
let buyer: Awaited<ReturnType<typeof seedUserWithToken>>

beforeEach(async () => {
  await truncateAll()
  categoryId = (await seedCategory()).id
  seller = await seedUserWithToken({ email: 'seller@campus.edu', password: 'campus1234' })
  buyer = await seedUserWithToken({ email: 'buyer@campus.edu', password: 'campus1234' })
})

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: '边界测试商品',
    description: '这是一段足够长度的商品描述内容，用于通过校验。',
    priceCents: 1000,
    categorySlug: 'digital',
    images: [fakeImageUrl('edge.jpg')],
    ...overrides
  }
}

describe('输入边界', () => {
  it('商品标题超出长度上限返回 422', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(payload({ title: 'a'.repeat(61) }))

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'title' }))
  })

  it('商品描述超出长度上限返回 422', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(payload({ description: 'a'.repeat(1001) }))

    expect(res.status).toBe(422)
  })

  it('价格超出上限或不是整数都返回 422', async () => {
    const tooLarge = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(payload({ priceCents: 10_000_000 }))
    expect(tooLarge.status).toBe(422)

    const fractional = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(payload({ priceCents: 10.5 }))
    expect(fractional.status).toBe(422)
  })

  it('图片数量超出上限返回 422', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(payload({ images: Array.from({ length: 10 }, (_, i) => fakeImageUrl(`x-${i}.jpg`)) }))

    expect(res.status).toBe(422)
  })

  it('搜索关键词超长返回 422', async () => {
    const res = await request(app).get(`/api/items?q=${'a'.repeat(61)}`)

    expect(res.status).toBe(422)
  })

  it('页码小于 1 返回 422', async () => {
    for (const page of ['0', '-1', 'abc']) {
      const res = await request(app).get(`/api/items?page=${page}`)
      expect(res.status, `page=${page}`).toBe(422)
    }
  })

  it('每页条数超出上限返回 422，而不是静默截断', async () => {
    const res = await request(app).get('/api/items?pageSize=1000')

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'pageSize' }))
  })

  it('查询参数传成数组返回 422', async () => {
    const res = await request(app).get('/api/items?sort=latest&sort=price_asc')

    expect(res.status).toBe(422)
  })

  it('分页参数在各接口的行为一致', async () => {
    const itemList = await request(app).get('/api/items?pageSize=1000')
    const favoriteList = await request(app)
      .get('/api/favorites?pageSize=1000')
      .set('Authorization', buyer.auth)

    // 收藏列表此前是静默截断，现在与商品列表一样明确拒绝
    expect(favoriteList.status).toBe(itemList.status)
  })

  it('个人简介超出长度上限返回 422', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', buyer.auth)
      .send({ bio: 'a'.repeat(201) })

    expect(res.status).toBe(422)
  })
})

describe('资源不存在与非法标识', () => {
  it('非 uuid 的商品 id 返回 404 而不是 500', async () => {
    const paths = [
      { method: 'get', url: '/api/items/not-a-uuid' },
      { method: 'patch', url: '/api/items/not-a-uuid' },
      { method: 'delete', url: '/api/items/not-a-uuid' }
    ] as const

    for (const { method, url } of paths) {
      const res = await request(app)[method](url).set('Authorization', seller.auth).send({})
      expect(res.status, `${method} ${url}`).toBe(404)
    }
  })

  it('非 uuid 的用户 id 返回 404', async () => {
    const res = await request(app).get('/api/users/not-a-uuid')

    expect(res.status).toBe(404)
  })

  it('分类 id 不是正整数时返回 404', async () => {
    const res = await request(app)
      .patch('/api/admin/categories/abc')
      .set('Authorization', (await adminAuth()).auth)
      .send({ name: 'x' })

    expect(res.status).toBe(404)
  })

  it('收藏不存在的商品返回 404', async () => {
    const res = await request(app)
      .post(`/api/favorites/${MISSING_UUID}`)
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(404)
  })

  it('取消没有收藏过的商品仍然返回成功（幂等）', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const res = await request(app)
      .delete(`/api/favorites/${item.id}`)
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.favorited).toBe(false)
  })
})

describe('空数据', () => {
  it('没有商品时返回空数组与正确的分页元信息', async () => {
    const res = await request(app).get('/api/items')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta).toEqual({ page: 1, pageSize: 12, total: 0, totalPages: 1 })
  })

  it('没有收藏时返回空列表', async () => {
    const res = await request(app).get('/api/favorites').set('Authorization', buyer.auth)

    expect(res.body.data).toEqual([])
    expect(res.body.meta.total).toBe(0)
  })

  it('没有商品的分类计数为 0', async () => {
    const res = await request(app).get('/api/categories')

    expect(res.body.data.every((row: { itemCount: number }) => row.itemCount === 0)).toBe(true)
  })

  it('新用户的统计全为 0', async () => {
    const res = await request(app).get('/api/users/me/stats').set('Authorization', buyer.auth)

    expect(res.body.data).toEqual({
      published: 0,
      onSale: 0,
      sold: 0,
      offShelf: 0,
      favorites: 0
    })
  })

  it('后台无数据时列表与统计都返回空值而不是报错', async () => {
    await prisma.adminAction.deleteMany()
    const admin = await adminAuth()

    const logs = await request(app).get('/api/admin/actions').set('Authorization', admin.auth)
    expect(logs.body.data).toEqual([])

    const stats = await request(app).get('/api/admin/stats').set('Authorization', admin.auth)
    expect(stats.body.data.items.total).toBe(0)
    expect(stats.body.data.users.total).toBe(3)
  })
})

describe('并发与幂等', () => {
  it('同一邮箱并发注册只有一个成功', async () => {
    const attempts = await Promise.all([
      request(app)
        .post('/api/auth/register')
        .send({ email: 'race@campus.edu', nickname: '并发A', password: 'campus1234' }),
      request(app)
        .post('/api/auth/register')
        .send({ email: 'race@campus.edu', nickname: '并发B', password: 'campus1234' })
    ])

    const statuses = attempts.map((res) => res.status).sort()
    expect(statuses).toEqual([201, 409])
    expect(await prisma.user.count({ where: { email: 'race@campus.edu' } })).toBe(1)
  })

  it('并发收藏同一商品只产生一条记录，计数也不会重复累加', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const attempts = await Promise.all([
      request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth),
      request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth),
      request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)
    ])

    // 三个请求都应当成功（幂等），不能因为唯一约束冲突报 500
    expect(attempts.every((res) => res.status === 201)).toBe(true)
    expect(await prisma.favorite.count({ where: { itemId: item.id } })).toBe(1)

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(stored.favoriteCount).toBe(1)
  })

  it('并发取消收藏不会把计数减成负数', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    await Promise.all([
      request(app).delete(`/api/favorites/${item.id}`).set('Authorization', buyer.auth),
      request(app).delete(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)
    ])

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(stored.favoriteCount).toBe(0)
  })
})

describe('上传边界', () => {
  it('空文件被拒绝', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', seller.auth)
      .attach('file', Buffer.alloc(0), { filename: 'empty.png', contentType: 'image/png' })

    expect(res.status).toBe(422)
  })

  it('缺少文件字段时返回 422', async () => {
    const res = await request(app).post('/api/uploads/images').set('Authorization', seller.auth)

    expect(res.status).toBe(422)
  })

  it('正常图片可以上传（对照组）', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', seller.auth)
      .attach('file', TINY_PNG, { filename: 'ok.png', contentType: 'image/png' })

    expect(res.status).toBe(201)

    const { storage } = await import('../src/lib/storage/index.js')
    await storage.remove(res.body.data.key)
  })
})

async function adminAuth() {
  return seedUserWithToken({
    email: 'admin@campus.edu',
    password: 'admin1234',
    role: 'admin'
  })
}
