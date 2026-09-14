export interface SaveFileInput {
  buffer: Buffer
  /** 不含点的扩展名，例如 jpg */
  extension: string
  mimeType: string
}

export interface StoredFile {
  /** 对外可访问地址 */
  url: string
  /** 存储内部的唯一标识，删除与迁移时使用 */
  key: string
}

/**
 * 图片存储抽象。
 *
 * 业务代码只依赖这个接口，因此从「本地磁盘」切到「对象存储」时
 * 只需要新增一个实现，商品与上传模块都不需要改动。
 * 当前提供本地磁盘驱动；对象存储驱动计划在部署阶段接入。
 */
export interface StorageAdapter {
  save(input: SaveFileInput): Promise<StoredFile>
  remove(key: string): Promise<void>
  /**
   * 从对外地址反推存储 key。
   * 用于校验「客户端提交的图片地址确实来自本平台的存储」，
   * 避免把服务当成任意外链的图床。不属于本存储时返回 null。
   */
  resolveKey(url: string): string | null
}
