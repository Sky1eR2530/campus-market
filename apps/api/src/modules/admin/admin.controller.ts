import {
  AppError,
  adminDeleteSchema,
  adminItemQuerySchema,
  adminUpdateItemStatusSchema,
  adminUpdateUserStatusSchema,
  adminUserQuerySchema,
  createCategorySchema,
  updateCategorySchema
} from '@campus/shared'
import { paginationQuerySchema } from '@campus/shared'
import type { Request, Response } from 'express'
import { requireUser } from '../../middlewares/authenticate.js'
import { sendData, sendPage } from '../../utils/http.js'
import { parseInput, parseUuidParam } from '../../utils/validation.js'
import * as adminService from './admin.service.js'

// ---------------------------------------------------------------------------
// 概览
// ---------------------------------------------------------------------------

export async function statsHandler(_req: Request, res: Response): Promise<void> {
  sendData(res, await adminService.getStats())
}

// ---------------------------------------------------------------------------
// 用户管理
// ---------------------------------------------------------------------------

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const query = parseInput(adminUserQuerySchema, req.query)
  const { data, meta } = await adminService.listUsers(query)
  sendPage(res, data, meta)
}

export async function updateUserStatusHandler(req: Request, res: Response): Promise<void> {
  const userId = parseUuidParam(req.params.id, '用户不存在')
  const { status, reason } = parseInput(adminUpdateUserStatusSchema, req.body)

  await adminService.updateUserStatus(requireUser(req).id, userId, status, reason)
  res.status(204).send()
}

// ---------------------------------------------------------------------------
// 商品管理
// ---------------------------------------------------------------------------

export async function listItemsHandler(req: Request, res: Response): Promise<void> {
  const query = parseInput(adminItemQuerySchema, req.query)
  const { data, meta } = await adminService.listItems(query)
  sendPage(res, data, meta)
}

export async function updateItemStatusHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.id, '商品不存在')
  const { status, reason } = parseInput(adminUpdateItemStatusSchema, req.body)

  await adminService.updateItemStatus(requireUser(req).id, itemId, status, reason)
  res.status(204).send()
}

export async function deleteItemHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.id, '商品不存在')
  const { reason } = parseInput(adminDeleteSchema, req.body)

  await adminService.deleteItem(requireUser(req).id, itemId, reason)
  res.status(204).send()
}

// ---------------------------------------------------------------------------
// 分类管理
// ---------------------------------------------------------------------------

export async function listCategoriesHandler(_req: Request, res: Response): Promise<void> {
  sendData(res, await adminService.listCategories())
}

export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  const payload = parseInput(createCategorySchema, req.body)
  sendData(res, await adminService.createCategory(payload), 201)
}

export async function updateCategoryHandler(req: Request, res: Response): Promise<void> {
  const categoryId = Number(req.params.id)
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError('NOT_FOUND', '分类不存在', 404)
  }

  const payload = parseInput(updateCategorySchema, req.body)
  sendData(res, await adminService.updateCategory(categoryId, payload))
}

export async function deleteCategoryHandler(req: Request, res: Response): Promise<void> {
  const categoryId = Number(req.params.id)
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError('NOT_FOUND', '分类不存在', 404)
  }

  await adminService.deleteCategory(categoryId)
  res.status(204).send()
}

// ---------------------------------------------------------------------------
// 操作日志
// ---------------------------------------------------------------------------

export async function listActionsHandler(req: Request, res: Response): Promise<void> {
  const { page, pageSize } = parseInput(paginationQuerySchema, req.query)
  const { data, meta } = await adminService.listActions(page, pageSize)
  sendPage(res, data, meta)
}
