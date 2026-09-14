import { requestData } from '../http.js'

export interface UploadedImage {
  url: string
  key: string
}

/**
 * 上传图片（原样上传）。
 * 浏览器端的压缩属于具体应用的体验优化，由调用方在传入前处理。
 */
export function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData()
  form.append('file', file)

  // 不手动设置 Content-Type，交给 axios 生成带 boundary 的 multipart 头
  return requestData<UploadedImage>({ url: '/uploads/images', method: 'POST', data: form })
}
