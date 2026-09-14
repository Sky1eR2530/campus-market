import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { optionalAuth } from '../../middlewares/optionalAuth.js'
import {
  createItemHandler,
  deleteItemHandler,
  getItemHandler,
  listItemsHandler,
  updateItemHandler,
  updateItemStatusHandler
} from './item.controller.js'

export const itemRouter = Router()

// 公开接口：用可选鉴权识别身份，以便返回「我是否收藏了它」与卖家联系方式
itemRouter.get('/', optionalAuth, listItemsHandler)
itemRouter.get('/:id', optionalAuth, getItemHandler)

itemRouter.post('/', authenticate, createItemHandler)
itemRouter.patch('/:id', authenticate, updateItemHandler)
itemRouter.patch('/:id/status', authenticate, updateItemStatusHandler)
itemRouter.delete('/:id', authenticate, deleteItemHandler)
