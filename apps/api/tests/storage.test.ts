import { createRequire } from 'node:module'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp, rm } from 'node:fs/promises'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { S3Storage } from '../src/lib/storage/s3-storage.js'

/**
 * 对象存储驱动的验证。
 *
 * 生产环境用的是 Supabase Storage / Cloudflare R2 这类 S3 兼容服务，
 * 本地开发用不到，因此很容易变成「写完没跑过」的代码。
 * 这里起一个本地 S3 模拟服务，把上传、删除、URL 反解这几条路径真的跑一遍。
 */

const require = createRequire(import.meta.url)
const S3rver = require('s3rver')

const PORT = 4569
const BUCKET = 'campus-market-test'
const PUBLIC_BASE = `http://127.0.0.1:${PORT}/${BUCKET}`

/** s3rver 的 run() 返回的不是 http.Server，关闭要用实例上的 close() */
let s3rver: { run: () => Promise<unknown>; close: (callback: () => void) => void }
let dataDir: string
let storage: S3Storage

beforeAll(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 's3rver-'))

  s3rver = new S3rver({
    port: PORT,
    address: '127.0.0.1',
    silent: true,
    directory: dataDir,
    // 客户端用的是路径风格寻址（endpoint/bucket/key），测试环境保持一致
    configureBuckets: [{ name: BUCKET }]
  })
  await s3rver.run()

  storage = new S3Storage({
    endpoint: `http://127.0.0.1:${PORT}`,
    region: 'us-east-1',
    bucket: BUCKET,
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
    publicBaseUrl: PUBLIC_BASE
  })
})

afterAll(async () => {
  await new Promise<void>((resolve) => s3rver.close(() => resolve()))
  await rm(dataDir, { recursive: true, force: true })
})

describe('S3 对象存储驱动', () => {
  it('上传后返回可公开访问的地址，并且真的能取回内容', async () => {
    const buffer = Buffer.from('假的图片内容', 'utf8')

    const stored = await storage.save({
      buffer,
      extension: 'png',
      mimeType: 'image/png'
    })

    // key 按年月分目录，扩展名来自调用方（服务端根据 MIME 决定）
    expect(stored.key).toMatch(/^\d{6}\/[0-9a-f-]{36}\.png$/)
    expect(stored.url).toBe(`${PUBLIC_BASE}/${stored.key}`)

    const downloaded = await request(stored.url).get('')
    expect(downloaded.status).toBe(200)
    expect(downloaded.headers['content-type']).toContain('image/png')
    // 图片是二进制内容，supertest 放在 body 里而不是 text
    expect(Buffer.isBuffer(downloaded.body)).toBe(true)
    expect(downloaded.body.equals(buffer)).toBe(true)
  })

  it('删除后对象不再可访问', async () => {
    const stored = await storage.save({
      buffer: Buffer.from('待删除', 'utf8'),
      extension: 'jpg',
      mimeType: 'image/jpeg'
    })

    await storage.remove(stored.key)

    const downloaded = await request(stored.url).get('')
    expect(downloaded.status).toBe(404)
  })

  it('从 URL 反解 key，用于校验图片确实来自本平台存储', () => {
    expect(storage.resolveKey(`${PUBLIC_BASE}/202609/abc.png`)).toBe('202609/abc.png')

    // 查询串（例如 CDN 加的版本参数）应当被忽略
    expect(storage.resolveKey(`${PUBLIC_BASE}/202609/abc.png?v=2`)).toBe('202609/abc.png')
  })

  it('拒绝不属于本存储的地址，避免把平台当成任意外链图床', () => {
    expect(storage.resolveKey('https://example.com/evil.png')).toBeNull()
    expect(storage.resolveKey('/uploads/202609/abc.png')).toBeNull()
    expect(storage.resolveKey(`${PUBLIC_BASE}/`)).toBeNull()
  })

  it('拒绝带路径穿越的 key', () => {
    expect(storage.resolveKey(`${PUBLIC_BASE}/../../etc/passwd`)).toBeNull()
    expect(storage.resolveKey(`${PUBLIC_BASE}/202609/../../secret.png`)).toBeNull()
  })
})
