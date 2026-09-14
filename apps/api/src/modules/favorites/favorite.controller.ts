import { paginationQuerySchema } from '@campus/shared'
import type { Request, Response } from 'express'
import { requireUser } from '../../middlewares/authenticate.js'
import { sendData, sendPage } from '../../utils/http.js'
import { parseInput, parseUuidParam } from '../../utils/validation.js'
import { addFavorite, listFavoriteIds, listFavorites, removeFavorite } from './favorite.service.js'

export async function addFavoriteHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.itemId, '商品不存在或已被删除')
  await addFavorite(itemId, requireUser(req))
  sendData(res, { favorited: true }, 201)
}

export async function removeFavoriteHandler(req: Request, res: Response): Promise<void> {
  const itemId = parseUuidParam(req.params.itemId, '商品不存在或已被删除')
  await removeFavorite(itemId, requireUser(req))
  sendData(res, { favorited: false })
}

export async function listFavoriteIdsHandler(req: Request, res: Response): Promise<void> {
  sendData(res, await listFavoriteIds(requireUser(req)))
}

export async function listFavoritesHandler(req: Request, res: Response): Promise<void> {
  const { page, pageSize } = parseInput(paginationQuerySchema, req.query)
  const { data, meta } = await listFavorites(requireUser(req), page, pageSize)
  sendPage(res, data, meta)
}
