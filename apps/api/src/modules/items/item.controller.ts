import { createItemPayloadSchema, itemQuerySchema, updateItemStatusSchema } from '@campus/shared'
import type { Request, Response } from 'express'
import { requireUser } from '../../middlewares/authenticate.js'
import { sendData, sendPage } from '../../utils/http.js'
import { parseInput, parseUuidParam } from '../../utils/validation.js'
import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
  updateItemStatus
} from './item.service.js'

export async function listItemsHandler(req: Request, res: Response): Promise<void> {
  const query = parseInput(itemQuerySchema, req.query)
  const { data, meta } = await listItems(query, req.user?.id ?? null)
  sendPage(res, data, meta)
}

export async function getItemHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.id, '商品不存在或已被删除')
  sendData(res, await getItemById(itemId, req.user?.id ?? null))
}

export async function createItemHandler(req: Request, res: Response): Promise<void> {
  const payload = parseInput(createItemPayloadSchema, req.body)
  sendData(res, await createItem(payload, requireUser(req)), 201)
}

export async function updateItemHandler(req: Request, res: Response): Promise<void> {
  const payload = parseInput(createItemPayloadSchema.partial(), req.body)
  const itemId = parseUuidParam(req.params.id, '商品不存在或已被删除')
  sendData(res, await updateItem(itemId, payload, requireUser(req)))
}

export async function updateItemStatusHandler(req: Request, res: Response): Promise<void> {
  const { status } = parseInput(updateItemStatusSchema, req.body)
  const itemId = parseUuidParam(req.params.id, '商品不存在或已被删除')
  sendData(res, await updateItemStatus(itemId, status, requireUser(req)))
}

export async function deleteItemHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.id, '商品不存在或已被删除')
  await deleteItem(itemId, requireUser(req))
  res.status(204).send()
}
