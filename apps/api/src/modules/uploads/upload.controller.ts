import { AppError } from '@campus/shared'
import type { Request, Response } from 'express'
import { storage } from '../../lib/storage/index.js'
import { sendData } from '../../utils/http.js'

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

export async function uploadImageHandler(req: Request, res: Response): Promise<void> {
  const file = req.file
  if (!file || file.size === 0) {
    throw new AppError('VALIDATION_FAILED', '请选择要上传的图片', 422)
  }

  // 扩展名由服务端根据 MIME 决定，不采用客户端提供的文件名，
  // 避免通过构造文件名把文件写到预期之外的位置
  const extension = EXTENSION_BY_MIME[file.mimetype]
  if (!extension) {
    throw new AppError('VALIDATION_FAILED', '只支持 JPG / PNG / WebP 格式的图片', 422)
  }

  const stored = await storage.save({
    buffer: file.buffer,
    extension,
    mimeType: file.mimetype
  })

  sendData(res, stored, 201)
}
