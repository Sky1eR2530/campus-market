import type { Request, Response } from 'express'
import { Router } from 'express'
import { sendData } from '../../utils/http.js'
import { listCategories } from './category.service.js'

export const categoryRouter = Router()

categoryRouter.get('/', async (_req: Request, res: Response) => {
  sendData(res, await listCategories())
})
