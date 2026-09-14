/**
 * Phase 1 专用的商品图片生成器。
 *
 * 真实商品图片在 Phase 2 由用户上传、存对象存储。这里用确定性的 SVG 占位图，
 * 好处是：完全离线可用、体积极小、每个分类与每件商品都有区分度，
 * 不会出现「一堆灰色方块」或「图片加载失败」的廉价观感。
 *
 * Phase 3 接入真实上传后，这个文件只保留给「无图商品」做兜底。
 */

interface CategoryVisual {
  hue: number
  /** 24x24 线稿图标，居中绘制 */
  icon: string
}

const ICONS = {
  device:
    '<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 18.4h3"/>',
  book:
    '<rect x="4.5" y="3.5" width="15" height="17" rx="1.8"/><path d="M8.6 3.5v17M11.5 8.5h5M11.5 12h5"/>',
  mug:
    '<rect x="4.2" y="7" width="11" height="12" rx="2.2"/><path d="M15.2 10.2h2.4a2.6 2.6 0 0 1 0 5.2h-2.4M4.2 10.6h11"/>',
  shirt:
    '<path d="M9.2 3.4 4.6 6.2l1.6 4.1 1.6-.9v10.3h8.4V9.4l1.6.9 1.6-4.1-4.6-2.8a2.9 2.9 0 0 1-5.6 0Z"/>',
  pencil:
    '<path d="M4.4 19.6l.9-3.7L15.6 5.6a2.1 2.1 0 0 1 3 3L8.2 18.7l-3.8.9Z"/><path d="M14.2 7.1l2.9 2.9"/>',
  box:
    '<path d="M3.6 7.6 12 3.5l8.4 4.1v8.8L12 20.5 3.6 16.4Z"/><path d="M3.6 7.6 12 11.6l8.4-4M12 11.6v8.9"/>'
} as const

const CATEGORY_VISUAL: Record<string, CategoryVisual> = {
  digital: { hue: 222, icon: ICONS.device },
  books: { hue: 26, icon: ICONS.book },
  living: { hue: 168, icon: ICONS.mug },
  fashion: { hue: 340, icon: ICONS.shirt },
  study: { hue: 262, icon: ICONS.pencil },
  other: { hue: 204, icon: ICONS.box }
}

const FALLBACK: CategoryVisual = { hue: 210, icon: ICONS.box }

const cache = new Map<string, string>()

/**
 * 生成商品占位图。
 * @param categorySlug 分类 slug，决定色相与图标
 * @param seed 任意整数，用于让同一分类下的商品也有可见差异
 */
export function itemImage(categorySlug: string, seed: number): string {
  const key = `${categorySlug}:${seed}`
  const cached = cache.get(key)
  if (cached) return cached

  const visual = CATEGORY_VISUAL[categorySlug] ?? FALLBACK
  const hue = visual.hue
  const hueAlt = (hue + ((seed * 17) % 46) - 23 + 360) % 360
  const angle = (seed * 41) % 360
  const blobX = 18 + ((seed * 29) % 64)
  const blobY = 12 + ((seed * 53) % 62)
  const iconScale = 2.05 + ((seed % 3) * 0.12)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="800" height="800" role="img">
<defs>
<linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
<stop offset="0" stop-color="hsl(${hue} 62% 96%)"/>
<stop offset="1" stop-color="hsl(${hueAlt} 46% 88%)"/>
</linearGradient>
<pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<line x1="0" y1="0" x2="0" y2="5" stroke="hsl(${hue} 40% 55%)" stroke-width="0.28" opacity="0.22"/>
</pattern>
</defs>
<rect width="100" height="100" fill="url(#bg)"/>
<circle cx="${blobX}" cy="${blobY}" r="30" fill="#ffffff" opacity="0.42"/>
<circle cx="${100 - blobX}" cy="${100 - blobY}" r="16" fill="hsl(${hue} 70% 100%)" opacity="0.5"/>
<rect width="100" height="100" fill="url(#grid)"/>
<g transform="translate(50 50) scale(${iconScale}) translate(-12 -12)" fill="none"
   stroke="hsl(${hue} 38% 34%)" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity="0.72">
${visual.icon}
</g>
</svg>`

  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  cache.set(key, dataUri)
  return dataUri
}
