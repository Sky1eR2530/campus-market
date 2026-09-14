import { uploadImage as uploadImageRaw } from '@campus/api-client'
import type { UploadedImage } from '@campus/api-client'
import { AppError } from '@campus/shared'
import { prepareImageForUpload } from '@/utils/image'

export type { UploadedImage }

/**
 * 上传商品图片。
 *
 * 在通用上传能力之上加了浏览器端压缩：手机拍的照片动辄 3~8MB，
 * 既容易超出服务端上限，在校园网环境下也明显拖慢发布速度。
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  let prepared: File
  try {
    prepared = await prepareImageForUpload(file)
  } catch (error) {
    throw new AppError(
      'UPLOAD_FAILED',
      error instanceof Error ? error.message : '图片处理失败，请重试',
      500
    )
  }

  return uploadImageRaw(prepared)
}
