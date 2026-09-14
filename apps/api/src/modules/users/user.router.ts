import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { optionalAuth } from '../../middlewares/optionalAuth.js'
import { getMyStatsHandler, getSellerProfileHandler, updateMyProfileHandler } from './user.controller.js'

export const userRouter = Router()

userRouter.patch('/me', authenticate, updateMyProfileHandler)

// 放在 /:id 之前，避免 me 被当成用户 id
userRouter.get('/me/stats', authenticate, getMyStatsHandler)

// 公开的卖家主页信息；联系方式只对已登录用户返回
userRouter.get('/:id', optionalAuth, getSellerProfileHandler)
