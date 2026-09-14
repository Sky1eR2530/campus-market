import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { uploadImageHandler } from './upload.controller.js'
import { uploadSingleImage } from './upload.middleware.js'

export const uploadRouter = Router()

// 上传需要登录：避免匿名用户把存储空间当成免费图床
uploadRouter.post('/images', authenticate, uploadSingleImage, uploadImageHandler)
