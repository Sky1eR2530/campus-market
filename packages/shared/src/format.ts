/** 金额、时间、文本的展示格式化。所有页面对价格与时间的展示都走这里，保证口径一致。 */

/** 分 → 千分位金额字符串（不含货币符号，符号由组件单独排版） */
export function formatPrice(cents: number): string {
  const yuan = cents / 100
  const hasFraction = cents % 100 !== 0
  return yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2
  })
}

/** 输入框中的字符串 → 分。非法输入返回 NaN，由校验层拦截 */
export function yuanToCents(input: string): number {
  const value = Number(input.trim())
  if (!Number.isFinite(value)) return Number.NaN
  return Math.round(value * 100)
}

/** 分 → 输入框回填用的字符串（不带千分位，避免用户编辑时出现逗号） */
export function centsToYuanInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** 相对时间：刚刚 / 12 分钟前 / 3 小时前 / 2 天前，超过 30 天显示具体日期 */
export function formatRelativeTime(iso: string): string {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Date.now() - time

  if (diff < MINUTE) return '刚刚'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)} 天前`
  return formatDate(iso)
}

/**
 * 用 Intl 而不是手工拼接日期：
 * 跨时区、跨语言的行为一致，也不会因为忘记补零出现 2026-9-4 这种写法。
 * formatter 缓存在模块作用域——构造 Intl 实例并不便宜，逐次新建会明显拖慢列表渲染。
 */
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  // 用 h23 而不是 hour12:false：后者在部分地区会输出 24:00
  hourCycle: 'h23'
})

/** 2026/09/14 */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFormatter.format(d)
}

/** 2026/09/14 14:30 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateTimeFormatter.format(d)
}

/** 大数字缩写：1234 → 1.2k，用于浏览/收藏计数 */
export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  if (value < 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(value / 1000)}k`
}

/** 由任意字符串派生一个稳定色相，用于生成用户头像底色 */
export function hashHue(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }
  return hash
}

/** 取昵称首字，用于无头像时的占位 */
export function initialsOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 1).toUpperCase()
}
