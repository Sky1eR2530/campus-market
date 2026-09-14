import path from 'node:path'
import { env } from '../../config/env.js'
import { LocalDiskStorage } from './local-storage.js'
import type { StorageAdapter } from './types.js'

export type { SaveFileInput, StorageAdapter, StoredFile } from './types.js'

/** 上传文件的落盘目录（绝对路径），同时用于静态资源托管 */
export const storagePublicDir = path.resolve(env.STORAGE_LOCAL_DIR)
export const uploadDir = storagePublicDir

function createStorage(): StorageAdapter {
  if (env.STORAGE_DRIVER === 's3') {
    // 明确失败而不是静默回退到本地磁盘：
    // 生产环境误把文件写到容器本地磁盘，重启后图片全部丢失，
    // 这种问题越早暴露越好。
    throw new Error(
      'STORAGE_DRIVER=s3 尚未实现（计划在部署阶段接入对象存储）。' +
        '请先将 STORAGE_DRIVER 设为 local，或实现 StorageAdapter 的 S3 驱动。'
    )
  }

  return new LocalDiskStorage(uploadDir, env.STORAGE_PUBLIC_PATH, env.PUBLIC_BASE_URL)
}

export const storage = createStorage()
