import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { uploadLimiter } from '../../middlewares/rateLimit.js'
import { uploadImageHandler } from './upload.controller.js'
import { uploadSingleImage } from './upload.middleware.js'

export const uploadRouter = Router()

// 上传需要登录：避免匿名用户把存储空间当成免费图床
// 限流放在鉴权之前：挡住批量请求的同时也省掉一次数据库查询
uploadRouter.post('/images', uploadLimiter, authenticate, uploadSingleImage, uploadImageHandler)
