import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import type { SaveFileInput, StorageAdapter, StoredFile } from './types.js'

/**
 * S3 兼容对象存储驱动，用于生产环境。
 *
 * 已验证的目标是 Supabase Storage 与 Cloudflare R2，两者都提供 S3 兼容接口。
 * 关键差异是这类服务基本都需要「路径风格」寻址（endpoint/bucket/key），
 * 因此显式打开 forcePathStyle，不开的话 SDK 会按 AWS 的虚拟主机风格拼域名而失败。
 */
export class S3Storage implements StorageAdapter {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicBaseUrl: string

  constructor(options: {
    endpoint: string
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    publicBaseUrl: string
  }) {
    this.bucket = options.bucket
    // 去掉结尾斜杠，避免和 key 拼出双斜杠
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, '')

    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    })
  }

  async save(input: SaveFileInput): Promise<StoredFile> {
    // 按年月分目录，便于按时间批量清理，也避免单目录堆积过多对象
    const now = new Date()
    const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const key = `${folder}/${randomUUID()}.${input.extension}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        // 文件名是随机 UUID，内容不会变，可以放心长期缓存
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )

    return { key, url: this.toUrl(key) }
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  resolveKey(url: string): string | null {
    const prefix = `${this.publicBaseUrl}/`
    if (!url.startsWith(prefix)) return null

    const key = url.slice(prefix.length).split('?')[0]
    // 拒绝带路径穿越的 key，避免删除到预期之外的对象
    if (!key || key.includes('..')) return null
    return key
  }

  private toUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`
  }
}
