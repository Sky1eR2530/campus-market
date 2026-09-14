import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { requireAdminRole } from '../../middlewares/requireAdmin.js'
import {
  createCategoryHandler,
  deleteCategoryHandler,
  deleteItemHandler,
  listActionsHandler,
  listCategoriesHandler,
  listItemsHandler,
  listUsersHandler,
  statsHandler,
  updateCategoryHandler,
  updateItemStatusHandler,
  updateUserStatusHandler
} from './admin.controller.js'

export const adminRouter = Router()

// 整个后台都要求「已登录」且「是管理员」，双重校验缺一不可
adminRouter.use(authenticate, requireAdminRole)

adminRouter.get('/stats', statsHandler)

adminRouter.get('/users', listUsersHandler)
adminRouter.patch('/users/:id/status', updateUserStatusHandler)

adminRouter.get('/items', listItemsHandler)
adminRouter.patch('/items/:id/status', updateItemStatusHandler)
adminRouter.delete('/items/:id', deleteItemHandler)

adminRouter.get('/categories', listCategoriesHandler)
adminRouter.post('/categories', createCategoryHandler)
adminRouter.patch('/categories/:id', updateCategoryHandler)
adminRouter.delete('/categories/:id', deleteCategoryHandler)

adminRouter.get('/actions', listActionsHandler)
