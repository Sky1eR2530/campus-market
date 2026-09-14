import { AppError } from '@campus/shared'
import { prepareImageForUpload } from '@/utils/image'
import { requestData } from './http'

export interface UploadedImage {
  url: string
  key: string
}

/**
 * 上传商品图片。
 *
 * 上传前会在浏览器端压缩：手机拍的照片动辄 3~5MB，既容易超出服务端上限，
 * 在校园网环境下也明显拖慢发布速度。
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

  const form = new FormData()
  form.append('file', prepared)

  // 不手动设置 Content-Type，交给 axios 生成带 boundary 的 multipart 头
  return requestData<UploadedImage>({ url: '/uploads/images', method: 'POST', data: form })
}
