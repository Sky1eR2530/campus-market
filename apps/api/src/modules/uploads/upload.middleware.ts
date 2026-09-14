import { ALLOWED_IMAGE_TYPES, AppError } from '@campus/shared'
import type { RequestHandler } from 'express'
import multer from 'multer'
import { env } from '../../config/env.js'

const MAX_SIZE_MB = Math.round(env.MAX_UPLOAD_BYTES / 1024 / 1024)

const multerHandler = multer({
  // 图片不落本地临时目录，直接进内存后交给存储驱动处理
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(new AppError('VALIDATION_FAILED', '只支持 JPG / PNG / WebP 格式的图片', 422))
      return
    }
    callback(null, true)
  }
}).single('file')

/**
 * 把 multer 的错误翻译成统一的业务错误。
 * 否则文件过大这类可预期的输入问题会变成 500，前端也拿不到可读的提示。
 */
export const uploadSingleImage: RequestHandler = (req, res, next) => {
  multerHandler(req, res, (error: unknown) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? `图片不能超过 ${MAX_SIZE_MB}MB`
          : `图片上传失败（${error.code}）`
      next(new AppError('VALIDATION_FAILED', message, 422))
      return
    }

    next(error)
  })
}
