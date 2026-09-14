import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@campus/shared'

/**
 * 上传前的图片处理。
 *
 * 手机拍摄的照片动辄 3~8MB，直接上传既容易超出服务端上限，
 * 在校园网环境下也明显拖慢发布速度。这里在浏览器端先压缩再上传。
 */

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
/** 小于这个体积就不压缩：收益有限，反而损失画质 */
const COMPRESS_THRESHOLD_BYTES = 1024 * 1024
/** 原始文件的硬上限。超过这个体积基本不是正常拍摄的照片，直接拒绝 */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024

function toMb(bytes: number): number {
  return Math.round(bytes / 1024 / 1024)
}

/** 上传前的即时校验，返回错误文案；通过则返回 null */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `「${file.name}」格式不支持，请上传 JPG / PNG / WebP 图片`
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `「${file.name}」超过 ${toMb(MAX_SOURCE_BYTES)}MB，请换一张图片`
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

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY)
  })
}

/** 把图片等比缩放并转成 JPEG */
async function compress(file: File): Promise<File> {
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

  const blob = await canvasToBlob(canvas)
  if (!blob) throw new Error('图片压缩失败，请重试')

  // 压缩后反而更大（例如本身就是高压缩率的 WebP），保留原图
  if (blob.size >= file.size) return file

  const name = `${file.name.replace(/\.[^.]+$/, '')}.jpg`
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}

/**
 * 校验并把图片处理成适合上传的文件。
 * 小图原样返回；大图压缩后再检查是否仍然超出服务端上限。
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)

  const prepared = file.size > COMPRESS_THRESHOLD_BYTES ? await compress(file) : file

  if (prepared.size > MAX_IMAGE_BYTES) {
    throw new Error(`「${file.name}」压缩后仍超过 ${toMb(MAX_IMAGE_BYTES)}MB，请换一张图片`)
  }

  return prepared
}
