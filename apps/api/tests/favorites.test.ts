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

let categoryId: number
let seller: Awaited<ReturnType<typeof seedUserWithToken>>
let buyer: Awaited<ReturnType<typeof seedUserWithToken>>

beforeEach(async () => {
  await truncateAll()
  categoryId = (await seedCategory()).id
  seller = await seedUserWithToken({ email: 'seller@campus.edu', password: 'campus1234' })
  buyer = await seedUserWithToken({ email: 'buyer@campus.edu', password: 'campus1234' })
})

async function countFavorites(itemId: string): Promise<number> {
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } })
  return item.favoriteCount
}

describe('收藏', () => {
  it('未登录不能收藏', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const res = await request(app).post(`/api/favorites/${item.id}`)

    expect(res.status).toBe(401)
  })

  it('收藏成功并把商品的收藏数加一', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const res = await request(app)
      .post(`/api/favorites/${item.id}`)
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(201)
    expect(res.body.data.favorited).toBe(true)
    expect(await countFavorites(item.id)).toBe(1)
  })

  it('重复收藏是幂等的，计数不会重复增加', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)
    const second = await request(app)
      .post(`/api/favorites/${item.id}`)
      .set('Authorization', buyer.auth)

    expect(second.status).toBe(201)
    expect(await countFavorites(item.id)).toBe(1)
    expect(await prisma.favorite.count({ where: { itemId: item.id } })).toBe(1)
  })

  it('不能收藏自己发布的商品', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const res = await request(app)
      .post(`/api/favorites/${item.id}`)
      .set('Authorization', seller.auth)

    expect(res.status).toBe(422)
  })

  it('收藏不存在的商品返回 404', async () => {
    const res = await request(app)
      .post('/api/favorites/00000000-0000-7000-8000-000000000000')
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(404)
  })

  it('取消收藏后计数回到 0', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    const res = await request(app)
      .delete(`/api/favorites/${item.id}`)
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.favorited).toBe(false)
    expect(await countFavorites(item.id)).toBe(0)
  })

  it('取消一件没收藏过的商品不会把计数减成负数', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })

    const res = await request(app)
      .delete(`/api/favorites/${item.id}`)
      .set('Authorization', buyer.auth)

    expect(res.status).toBe(200)
    expect(await countFavorites(item.id)).toBe(0)
  })

  it('收藏列表按收藏时间倒序，并标记为已收藏', async () => {
    const first = await seedItem({ sellerId: seller.user.id, categoryId, title: '先收藏的' })
    const second = await seedItem({ sellerId: seller.user.id, categoryId, title: '后收藏的' })

    await request(app).post(`/api/favorites/${first.id}`).set('Authorization', buyer.auth)
    await request(app).post(`/api/favorites/${second.id}`).set('Authorization', buyer.auth)

    const res = await request(app).get('/api/favorites').set('Authorization', buyer.auth)

    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
    expect(res.body.data[0].title).toBe('后收藏的')
    expect(res.body.data.every((item: { isFavorited: boolean }) => item.isFavorited)).toBe(true)
  })

  it('提供收藏 id 列表，供前端标记爱心状态', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    const res = await request(app).get('/api/favorites/ids').set('Authorization', buyer.auth)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([item.id])
  })

  it('登录用户在商品列表与详情中能看到自己的收藏状态', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    const detail = await request(app)
      .get(`/api/items/${item.id}`)
      .set('Authorization', buyer.auth)
    expect(detail.body.data.isFavorited).toBe(true)

    const list = await request(app).get('/api/items').set('Authorization', buyer.auth)
    expect(list.body.data[0].isFavorited).toBe(true)

    const asSeller = await request(app).get('/api/items').set('Authorization', seller.auth)
    expect(asSeller.body.data[0].isFavorited).toBe(false)
  })

  it('已下架的商品仍保留在收藏列表里，被删除的则消失', async () => {
    const offShelf = await seedItem({
      sellerId: seller.user.id,
      categoryId,
      title: '下架的',
      status: 'off_shelf'
    })
    const removed = await seedItem({
      sellerId: seller.user.id,
      categoryId,
      title: '被删除的',
      imageCount: 1
    })

    await request(app).post(`/api/favorites/${offShelf.id}`).set('Authorization', buyer.auth)
    await request(app).post(`/api/favorites/${removed.id}`).set('Authorization', buyer.auth)

    await prisma.item.update({
      where: { id: removed.id },
      data: { deletedAt: new Date() }
    })

    const res = await request(app).get('/api/favorites').set('Authorization', buyer.auth)

    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].title).toBe('下架的')
  })

  it('收藏请求不影响商品的更新时间（计数用原生 SQL 维护）', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId })
    const before = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })

    await new Promise((resolve) => setTimeout(resolve, 10))
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    const after = await prisma.item.findUniqueOrThrow({ where: { id: item.id } })
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime())
    expect(after.favoriteCount).toBe(1)
  })

  it('图片地址在收藏列表中正常返回', async () => {
    const item = await seedItem({ sellerId: seller.user.id, categoryId, imageCount: 2 })
    await request(app).post(`/api/favorites/${item.id}`).set('Authorization', buyer.auth)

    const res = await request(app).get('/api/favorites').set('Authorization', buyer.auth)

    expect(res.body.data[0].images).toHaveLength(2)
    expect(res.body.data[0].images[0].url).toBe(fakeImageUrl('item-0.jpg'))
  })
})
