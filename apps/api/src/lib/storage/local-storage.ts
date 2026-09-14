import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SaveFileInput, StorageAdapter, StoredFile } from './types.js'

/**
 * 本地磁盘驱动，用于本地开发。
 * 文件按年月分目录存放，避免单目录堆积过多文件影响文件系统性能。
 */
export class LocalDiskStorage implements StorageAdapter {
  constructor(
    private readonly rootDir: string,
    private readonly publicPath: string,
    private readonly baseUrl: string
  ) {}

  /** 把 key 解析成绝对路径，并确保没有跳出根目录 */
  private resolvePath(key: string): string | null {
    if (!key || key.includes('..') || path.isAbsolute(key)) return null
    const target = path.resolve(this.rootDir, key)
    const root = path.resolve(this.rootDir)
    return target === root || target.startsWith(root + path.sep) ? target : null
  }

  async save(input: SaveFileInput): Promise<StoredFile> {
    const now = new Date()
    const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const key = `${folder}/${randomUUID()}.${input.extension}`

    const target = this.resolvePath(key)
    if (!target) throw new Error(`非法的存储 key：${key}`)

    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, input.buffer)

    return { key, url: `${this.baseUrl}${this.publicPath}/${key}` }
  }

  async remove(key: string): Promise<void> {
    const target = this.resolvePath(key)
    if (!target) return
    await rm(target, { force: true })
  }

  resolveKey(url: string): string | null {
    const prefix = `${this.baseUrl}${this.publicPath}/`
    if (!url.startsWith(prefix)) return null
    const key = url.slice(prefix.length)
    return this.resolvePath(key) ? key : null
  }
}
