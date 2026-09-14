import type { Request, Response } from 'express'
import { requireUser } from '../../middlewares/authenticate.js'
import { sendData, sendPage } from '../../utils/http.js'
import { parseUuidParam } from '../../utils/validation.js'
import { addFavorite, listFavoriteIds, listFavorites, removeFavorite } from './favorite.service.js'

const DEFAULT_PAGE_SIZE = 12

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
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.pageSize ?? DEFAULT_PAGE_SIZE)
  const { data, meta } = await listFavorites(
    requireUser(req),
    Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 60) : DEFAULT_PAGE_SIZE
  )
  sendPage(res, data, meta)
}
