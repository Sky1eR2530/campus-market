import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import {
  app,
  fakeImageUrl,
  seedCategory,
  seedItem,
  seedUserWithToken,
  truncateAll
} from './helpers.js'

const MISSING_UUID = '00000000-0000-7000-8000-000000000000'

let categoryId: number
let seller: Awaited<ReturnType<typeof seedUserWithToken>>
let other: Awaited<ReturnType<typeof seedUserWithToken>>

beforeEach(async () => {
  await truncateAll()
  categoryId = (await seedCategory()).id
  seller = await seedUserWithToken({
    email: 'seller@campus.edu',
    password: 'campus1234',
    nickname: '卖家',
    school: '云川大学',
    campus: '东湖校区',
    contact: '微信 seller'
  })
  other = await seedUserWithToken({
    email: 'other@campus.edu',
    password: 'campus1234',
    nickname: '买家'
  })
})

function createPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: '测试商品：机械键盘 87 键',
    description: '自用一年，键帽无油，支持在图书馆门口当面验货。',
    priceCents: 18850,
    categorySlug: 'digital',
    images: [fakeImageUrl('kbd-1.jpg')],
    ...overrides
  }
}

/** 四件商品：分属两个卖家，覆盖在售 / 已售 / 下架三种状态 */
async function seedMany() {
  return Promise.all([
    seedItem({
      sellerId: seller.user.id,
      categoryId,
      title: '便宜的键盘',
      description: '描述A 键盘',
      priceCents: 100,
      publishedAt: new Date('2026-01-01T00:00:00Z')
    }),
    seedItem({
      sellerId: seller.user.id,
      categoryId,
      title: '昂贵的相机',
      description: '描述B 相机',
      priceCents: 5000,
      publishedAt: new Date('2026-02-01T00:00:00Z')
    }),
    seedItem({
      sellerId: other.user.id,
      categoryId,
      title: '已售的吉他',
      description: '描述C',
      priceCents: 800,
      status: 'sold',
      publishedAt: new Date('2026-03-01T00:00:00Z')
    }),
    seedItem({
      sellerId: other.user.id,
      categoryId,
      title: '下架的书',
      description: '描述D',
      priceCents: 50,
      status: 'off_shelf',
      publishedAt: new Date('2026-04-01T00:00:00Z')
    })
  ])
}

describe('POST /api/items', () => {
  it('未登录不能发布', async () => {
    const res = await request(app).post('/api/items').send(createPayload())

    expect(res.status).toBe(401)
  })

  it('发布成功，返回完整的商品信息且不泄露内部字段', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('测试商品：机械键盘 87 键')
    expect(res.body.data.status).toBe('on_sale')
    expect(res.body.data.priceCents).toBe(18850)
    expect(res.body.data.categorySlug).toBe('digital')
    expect(res.body.data.categoryName).toBe('数码产品')
    // 学校/校区从卖家资料继承
    expect(res.body.data.school).toBe('云川大学')
    expect(res.body.data.images).toHaveLength(1)
    expect(res.body.data.images[0].sortOrder).toBe(0)
    expect(res.body.data.images[0]).not.toHaveProperty('storageKey')
    expect(res.body.data).not.toHaveProperty('deletedAt')
  })

  it('拒绝不属于本平台存储的图片地址，避免被当成图床', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload({ images: ['https://example.com/not-ours.jpg'] }))

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'images' }))
  })

  it('分类不存在时返回 422', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload({ categorySlug: 'not-exist' }))

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ field: 'categorySlug' })
    )
  })

  it('价格必须是大于 0 的整数分', async () => {
    for (const priceCents of [0, -100, 12.5]) {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', seller.auth)
        .send(createPayload({ priceCents }))

      expect(res.status, `priceCents=${priceCents}`).toBe(422)
      expect(res.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'priceCents' })
      )
    }
  })

  it('至少需要一张图片', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload({ images: [] }))

    expect(res.status).toBe(422)
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'images' }))
  })

  it('标题过短或描述过短都会被拒绝', async () => {
    const short = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload({ title: 'A' }))
    expect(short.status).toBe(422)

    const shortDesc = await request(app)
      .post('/api/items')
      .set('Authorization', seller.auth)
      .send(createPayload({ description: '太短' }))
    expect(shortDesc.status).toBe(422)
  })
})

describe('GET /api/items', () => {
  it('默认隐藏已下架商品，按发布时间倒序', async () => {
    await seedMany()

    const res = await request(app).get('/api/items')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    expect(res.body.data.map((item: { title: string }) => item.title)).not.toContain('下架的书')
    expect(res.body.data[0].title).toBe('已售的吉他')
    expect(res.body.meta).toEqual({ page: 1, pageSize: 12, total: 3, totalPages: 1 })
  })

  it('可以按状态筛选', async () => {
    await seedMany()

    const res = await request(app).get('/api/items?status=on_sale')

    expect(res.body.meta.total).toBe(2)
    expect(res.body.data.every((item: { status: string }) => item.status === 'on_sale')).toBe(true)
  })

  it('支持价格升序与降序', async () => {
    await seedMany()

    const asc = await request(app).get('/api/items?sort=price_asc')
    expect(asc.body.data[0].title).toBe('便宜的键盘')

    const desc = await request(app).get('/api/items?sort=price_desc')
    expect(desc.body.data[0].title).toBe('昂贵的相机')
  })

  it('关键词可以命中标题和描述', async () => {
    await seedMany()

    const byTitle = await request(app).get('/api/items?q=相机')
    expect(byTitle.body.meta.total).toBe(1)
    expect(byTitle.body.data[0].title).toBe('昂贵的相机')

    const byDescription = await request(app).get('/api/items?q=描述A')
    expect(byDescription.body.meta.total).toBe(1)
    expect(byDescription.body.data[0].title).toBe('便宜的键盘')
  })

  it('按卖家筛选时，卖家本人能看到自己的下架商品', async () => {
    await seedMany()

    const anonymous = await request(app).get(`/api/items?sellerId=${other.user.id}`)
    expect(anonymous.body.meta.total).toBe(1)

    const owner = await request(app)
      .get(`/api/items?sellerId=${other.user.id}`)
      .set('Authorization', other.auth)
    expect(owner.body.meta.total).toBe(2)
  })

  it('分页元信息正确，页码超出范围时收敛到最后一页', async () => {
    await seedMany()

    const first = await request(app).get('/api/items?pageSize=2&sort=price_asc')
    expect(first.body.data).toHaveLength(2)
    expect(first.body.meta).toEqual({ page: 1, pageSize: 2, total: 3, totalPages: 2 })

    const beyond = await request(app).get('/api/items?pageSize=2&page=99&sort=price_asc')
    expect(beyond.body.meta.page).toBe(2)
    expect(beyond.body.data).toHaveLength(1)
  })

  it('非法查询参数返回 422', async () => {
    const res = await request(app).get('/api/items?sort=whatever')

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('GET /api/items/:id', () => {
  it('返回详情并把浏览量加一', async () => {
    const [item] = await seedMany()

    const res = await request(app).get(`/api/items/${item.id}`)

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('便宜的键盘')
    expect(res.body.data.viewCount).toBe(0)

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(stored.viewCount).toBe(1)
  })

  it('id 不是 uuid 时返回 404 而不是 500', async () => {
    const res = await request(app).get('/api/items/not-a-uuid')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('商品不存在时返回 404', async () => {
    const res = await request(app).get(`/api/items/${MISSING_UUID}`)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ITEM_NOT_FOUND')
  })

  it('已软删除的商品不可见', async () => {
    const item = await seedItem({
      sellerId: seller.user.id,
      categoryId,
      deletedAt: new Date()
    })

    const res = await request(app).get(`/api/items/${item.id}`)

    expect(res.status).toBe(404)
  })

  it('登录后才返回卖家联系方式', async () => {
    const [item] = await seedMany()

    const guest = await request(app).get(`/api/items/${item.id}`)
    expect(guest.body.data.seller.contact).toBeNull()
    expect(guest.body.data.isFavorited).toBe(false)

    const logged = await request(app)
      .get(`/api/items/${item.id}`)
      .set('Authorization', other.auth)
    expect(logged.body.data.seller.contact).toBe('微信 seller')
  })

  it('卖家信息包含发布数量与在售数量', async () => {
    await seedMany()
    const [item] = await prisma.item.findMany({
      where: { sellerId: seller.user.id },
      orderBy: { title: 'asc' },
      take: 1
    })

    const res = await request(app).get(`/api/items/${item!.id}`)

    expect(res.body.data.seller.itemCount).toBe(2)
    expect(res.body.data.seller.onSaleCount).toBe(2)
  })
})

describe('PATCH /api/items/:id', () => {
  it('只能修改自己发布的商品', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set('Authorization', other.auth)
      .send({ title: '被改掉的名字' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('本人可以修改部分字段', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set('Authorization', seller.auth)
      .send({ priceCents: 999, title: '改过的键盘' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('改过的键盘')
    expect(res.body.data.priceCents).toBe(999)
    // 未提交的字段保持原值
    expect(res.body.data.description).toBe('描述A 键盘')
  })

  it('替换图片后旧图片记录被清除，顺序重新计算', async () => {
    const item = await seedItem({
      sellerId: seller.user.id,
      categoryId,
      imageCount: 2
    })

    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set('Authorization', seller.auth)
      .send({ images: [fakeImageUrl('new-a.jpg'), fakeImageUrl('new-b.jpg'), fakeImageUrl('new-c.jpg')] })

    expect(res.status).toBe(200)
    expect(res.body.data.images).toHaveLength(3)
    expect(res.body.data.images.map((image: { sortOrder: number }) => image.sortOrder)).toEqual([
      0, 1, 2
    ])

    const stored = await prisma.itemImage.findMany({ where: { itemId: item.id } })
    expect(stored).toHaveLength(3)
  })

  it('空请求体不会改动任何内容', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}`)
      .set('Authorization', seller.auth)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('便宜的键盘')
  })
})

describe('PATCH /api/items/:id/status', () => {
  it('非本人不能修改状态', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}/status`)
      .set('Authorization', other.auth)
      .send({ status: 'sold' })

    expect(res.status).toBe(403)
  })

  it('可以标记为已售', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}/status`)
      .set('Authorization', seller.auth)
      .send({ status: 'sold' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('sold')
  })

  it('重新上架会刷新发布时间，让商品回到列表前面', async () => {
    const [item] = await seedMany()
    await request(app)
      .patch(`/api/items/${item.id}/status`)
      .set('Authorization', seller.auth)
      .send({ status: 'off_shelf' })

    const res = await request(app)
      .patch(`/api/items/${item.id}/status`)
      .set('Authorization', seller.auth)
      .send({ status: 'on_sale' })

    expect(new Date(res.body.data.publishedAt).getTime()).toBeGreaterThan(
      new Date('2026-01-01T00:00:00Z').getTime()
    )
  })

  it('非法的状态值返回 422', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .patch(`/api/items/${item.id}/status`)
      .set('Authorization', seller.auth)
      .send({ status: 'deleted' })

    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/items/:id', () => {
  it('非本人不能删除', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .delete(`/api/items/${item.id}`)
      .set('Authorization', other.auth)

    expect(res.status).toBe(403)
  })

  it('软删除后列表与详情都不再返回，但记录仍保留在数据库中', async () => {
    const [item] = await seedMany()

    const res = await request(app)
      .delete(`/api/items/${item.id}`)
      .set('Authorization', seller.auth)
    expect(res.status).toBe(204)

    const list = await request(app).get('/api/items')
    expect(list.body.data.map((entry: { id: string }) => entry.id)).not.toContain(item.id)

    const detail = await request(app).get(`/api/items/${item.id}`)
    expect(detail.status).toBe(404)

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(stored.deletedAt).not.toBeNull()
    expect(stored.status).toBe('off_shelf')
  })
})
