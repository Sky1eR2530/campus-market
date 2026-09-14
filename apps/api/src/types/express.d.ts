import type { CurrentUser } from '@campus/shared'

declare module 'express-serve-static-core' {
  interface Request {
    /** 由 authenticate 中间件注入；未经过该中间件的路由上为 undefined */
    user?: CurrentUser
  }
}
