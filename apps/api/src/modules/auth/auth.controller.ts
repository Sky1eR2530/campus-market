import type { LoginPayload, RegisterPayload } from '@campus/shared'
import type { Request, RequestHandler, Response } from 'express'
import { sendData } from '../../utils/http.js'
import { login, register } from './auth.service.js'

export async function registerHandler(req: Request, res: Response): Promise<void> {
  // req.body 已被 validateBody 用共享 schema 校验并替换
  const result = await register(req.body as RegisterPayload)
  sendData(res, result, 201)
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await login(req.body as LoginPayload)
  sendData(res, result)
}

/** 依赖 authenticate 中间件注入的 req.user */
export const meHandler: RequestHandler = (req, res) => {
  sendData(res, req.user)
}

/**
 * 登出。
 * 当前使用无状态 JWT，服务端没有需要清理的会话，因此这里只需要客户端丢弃 token。
 * 保留这个接口是为了让前端的登出流程有统一的落点；
 * 将来引入刷新令牌或令牌黑名单时，实现直接加在这里。
 */
export const logoutHandler: RequestHandler = (_req, res) => {
  res.status(204).send()
}
