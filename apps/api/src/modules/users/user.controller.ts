import type { Request, Response } from 'express'
import { requireUser } from '../../middlewares/authenticate.js'
import { sendData } from '../../utils/http.js'
import { parseInput, parseUuidParam } from '../../utils/validation.js'
import { updateProfilePayloadSchema } from '@campus/shared'
import { getSellerProfile, updateMyProfile } from './user.service.js'

export async function updateMyProfileHandler(req: Request, res: Response): Promise<void> {
  const payload = parseInput(updateProfilePayloadSchema, req.body)
  sendData(res, await updateMyProfile(requireUser(req).id, payload))
}

export async function getSellerProfileHandler(req: Request, res: Response): Promise<void> {
  const userId = parseUuidParam(req.params.id, '该用户不存在')
  sendData(res, await getSellerProfile(userId, req.user?.id ?? null))
}
