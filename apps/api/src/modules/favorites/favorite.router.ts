import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  addFavoriteHandler,
  listFavoriteIdsHandler,
  listFavoritesHandler,
  removeFavoriteHandler
} from './favorite.controller.js'

export const favoriteRouter = Router()

favoriteRouter.use(authenticate)

// 放在 /:itemId 之前，避免 ids 被当成商品 id
favoriteRouter.get('/ids', listFavoriteIdsHandler)
favoriteRouter.get('/', listFavoritesHandler)
favoriteRouter.post('/:itemId', addFavoriteHandler)
favoriteRouter.delete('/:itemId', removeFavoriteHandler)
