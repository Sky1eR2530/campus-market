import path from 'node:path'
import { env } from '../../config/env.js'
import { LocalDiskStorage } from './local-storage.js'
import { S3Storage } from './s3-storage.js'
import type { StorageAdapter } from './types.js'

export type { SaveFileInput, StorageAdapter, StoredFile } from './types.js'

/** 上传文件的落盘目录（绝对路径），同时用于静态资源托管 */
export const storagePublicDir = path.resolve(env.STORAGE_LOCAL_DIR)
export const uploadDir = storagePublicDir

function createStorage(): StorageAdapter {
  if (env.STORAGE_DRIVER === 's3') {
    // 必需项在 config/env.ts 已经校验过，缺配置会在启动阶段直接失败，
    // 而不是等到用户上传第一张图才报错
    return new S3Storage({
      endpoint: env.S3_ENDPOINT!,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET!,
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      publicBaseUrl: env.S3_PUBLIC_BASE_URL!
    })
  }

  return new LocalDiskStorage(uploadDir, env.STORAGE_PUBLIC_PATH, env.PUBLIC_BASE_URL)
}

export const storage = createStorage()
