import { AppError } from '@campus/shared'
import { fileToCompressedDataUrl, validateImageFile } from '@/utils/image'

/**
 * 图片上传。
 *
 * Phase 1：在浏览器端压缩后以 data URL 返回，不经过服务器。
 * Phase 2：换成 `POST /api/uploads/images` 的 multipart 请求，
 *          服务端写入对象存储并返回可访问的 URL —— 页面层无需改动。
 */

export interface UploadedImage {
  url: string
  key: string
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const invalid = validateImageFile(file)
  if (invalid) throw new AppError('VALIDATION_FAILED', invalid, 422)

  try {
    const url = await fileToCompressedDataUrl(file)
    return { url, key: `local/${Date.now()}-${file.name}` }
  } catch (error) {
    throw new AppError(
      'UPLOAD_FAILED',
      error instanceof Error ? error.message : '图片处理失败，请重试',
      500
    )
  }
}

export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  const results: UploadedImage[] = []
  for (const file of files) {
    results.push(await uploadImage(file))
  }
  return results
}
