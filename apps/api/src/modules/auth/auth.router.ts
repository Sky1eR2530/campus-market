import { loginSchema, registerPayloadSchema } from '@campus/shared'
import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validateBody } from '../../middlewares/validate.js'
import { loginHandler, logoutHandler, meHandler, registerHandler } from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', validateBody(registerPayloadSchema), registerHandler)

authRouter.post('/login', validateBody(loginSchema), loginHandler)

/** 需要登录，也是验证整条鉴权链路（Bearer token → 校验 → 查库 → 封禁检查）的接口 */
authRouter.get('/me', authenticate, meHandler)

/** 无状态 token 的登出是客户端行为，因此不要求携带有效 token */
authRouter.post('/logout', logoutHandler)
