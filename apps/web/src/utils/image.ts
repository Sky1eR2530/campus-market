import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@campus/shared'

/**
 * 图片在浏览器端先压缩再处理。
 * Phase 1 用于控制 Mock 数据的存储体积；Phase 2 之后同样能显著减少上传带宽。
 */

const MAX_EDGE = 1280
const JPEG_QUALITY = 0.78

/** 上传前的即时校验，返回错误文案；通过则返回 null */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `「${file.name}」格式不支持，请上传 JPG / PNG / WebP 图片`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `「${file.name}」超过 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB，请压缩后重试`
  }
  return null
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`「${file.name}」读取失败，请换一张图片`))
    }
    image.src = objectUrl
  })
}

/** 读取本地图片 → 等比缩放 → 输出 JPEG data URL */
export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持图片处理，请更换浏览器后重试')

  // PNG 透明区域转 JPEG 前需要铺白底，否则会变成黑块
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
