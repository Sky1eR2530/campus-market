import { existsSync } from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { storage, storagePublicDir } from '../src/lib/storage/index.js'
import { app, seedCategory, seedUserWithToken, TINY_PNG, truncateAll } from './helpers.js'

let uploader: Awaited<ReturnType<typeof seedUserWithToken>>
const createdKeys: string[] = []

beforeEach(async () => {
  await truncateAll()
  await seedCategory()
  uploader = await seedUserWithToken({ email: 'uploader@campus.edu', password: 'campus1234' })
})

afterEach(async () => {
  // 清理测试产生的文件，避免 uploads 目录无限增长
  await Promise.all(createdKeys.splice(0).map((key) => storage.remove(key)))
})

describe('POST /api/uploads/images', () => {
  it('未登录不能上传', async () => {
    const res = await request(app).post('/api/uploads/images').attach('file', TINY_PNG, {
      filename: 'a.png',
      contentType: 'image/png'
    })

    expect(res.status).toBe(401)
  })

  it('上传成功后返回可访问地址，文件真实落盘', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', uploader.auth)
      .attach('file', TINY_PNG, { filename: 'a.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    expect(res.body.data.url).toMatch(/^\/uploads\/\d{6}\/.+\.png$/)
    expect(res.body.data.key).toMatch(/^\d{6}\/.+\.png$/)

    createdKeys.push(res.body.data.key)
    expect(existsSync(path.join(storagePublicDir, res.body.data.key))).toBe(true)
  })

  it('扩展名由服务端根据 MIME 决定，不采用客户端文件名', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', uploader.auth)
      .attach('file', TINY_PNG, { filename: '../../evil.php', contentType: 'image/png' })

    expect(res.status).toBe(201)
    expect(res.body.data.key.endsWith('.png')).toBe(true)
    expect(res.body.data.key).not.toContain('..')

    createdKeys.push(res.body.data.key)
  })

  it('非图片类型被拒绝', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', uploader.auth)
      .attach('file', Buffer.from('#!/bin/sh\necho hi'), {
        filename: 'script.sh',
        contentType: 'text/x-shellscript'
      })

    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('JPG')
  })

  it('超过大小上限的图片被拒绝，并给出可读提示', async () => {
    const oversized = Buffer.alloc(6 * 1024, 1)

    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', uploader.auth)
      .attach('file', oversized, { filename: 'big.png', contentType: 'image/png' })

    expect(res.status).toBe(422)
    expect(res.body.error.message).toContain('不能超过')
  })

  it('没有附带文件时返回 422', async () => {
    const res = await request(app).post('/api/uploads/images').set('Authorization', uploader.auth)

    expect(res.status).toBe(422)
  })

  it('上传得到的地址可以直接用于发布商品（端到端串联）', async () => {
    const uploaded = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', uploader.auth)
      .attach('file', TINY_PNG, { filename: 'a.png', contentType: 'image/png' })
    createdKeys.push(uploaded.body.data.key)

    const created = await request(app)
      .post('/api/items')
      .set('Authorization', uploader.auth)
      .send({
        title: '用上传图片发布的商品',
        description: '这是一段足够长度的商品描述，用于通过校验。',
        priceCents: 9900,
        categorySlug: 'digital',
        images: [uploaded.body.data.url]
      })

    expect(created.status).toBe(201)
    expect(created.body.data.images[0].url).toBe(uploaded.body.data.url)
  })
})
