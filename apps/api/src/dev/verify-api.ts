import { disconnectDatabase, prisma } from '../lib/prisma.js'
import { storage } from '../lib/storage/index.js'

/**
 * 针对一个正在运行的 API 服务做完整链路验证：
 * 分类 → 列表 → 搜索 → 上传图片 → 发布 → 详情 → 收藏 → 改状态 → 删除。
 *
 * 与 vitest 的区别在于它打的是真实 HTTP 服务，覆盖静态资源托管、
 * 存储驱动落盘这些进程内测试碰不到的环节。部署之后可以做冒烟：
 *   VERIFY_BASE_URL=https://your-app.example.com/api pnpm verify:api
 *
 * 结束后清理本次产生的数据，开发库回到种子状态。
 */

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000/api'
const ORIGIN = new URL(BASE).origin

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

// ---------- 响应结构（只声明脚本实际用到的字段） ----------

interface CategoryDto {
  slug: string
  name: string
  itemCount: number
}

interface ItemDto {
  id: string
  title: string
  status: string
  priceCents: number
  sellerId: string
  favoriteCount: number
  viewCount: number
  seller: { contact: string | null }
}

interface ListResponse<T> {
  data: T[]
  meta: { total: number }
}

interface DataResponse<T> {
  data: T
}

interface AuthResponse {
  data: { token: string }
}

interface UploadResponse {
  data: { url: string; key: string }
}

interface ProfileResponse {
  data: { bio: string | null }
}

interface SellerProfileResponse {
  data: { itemCount: number }
}

let passed = 0
let failed = 0

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1
    console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed += 1
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function json<T>(url: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const response = await fetch(url, init)
  const body = (await response.json()) as T
  return { status: response.status, body }
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

function jsonHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', ...bearer(token) }
}

async function login(email: string, password: string): Promise<string> {
  const { status, body } = await json<AuthResponse>(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (status !== 200) throw new Error(`登录失败：${email}`)
  return body.data.token
}

async function main(): Promise<void> {
  const uploadedKeys: string[] = []
  let createdItemId: string | null = null

  try {
    // ---------- 分类 ----------
    const categories = await json<ListResponse<CategoryDto>>(`${BASE}/categories`)
    check(
      '分类列表返回启用分类与在售数量',
      categories.body.data.length === 6 &&
        categories.body.data.every((category) => typeof category.itemCount === 'number'),
      `${categories.body.data.length} 个分类`
    )

    // ---------- 列表 ----------
    const list = await json<ListResponse<ItemDto>>(`${BASE}/items`)
    check(
      '商品列表默认隐藏下架商品',
      list.body.meta.total > 0 && list.body.data.every((item) => item.status !== 'off_shelf'),
      `共 ${list.body.meta.total} 件`
    )

    // ---------- 搜索 ----------
    const searched = await json<ListResponse<ItemDto>>(
      `${BASE}/items?q=${encodeURIComponent('键盘')}`
    )
    check(
      '中文关键词搜索命中标题',
      searched.body.meta.total >= 1 && searched.body.data.some((item) => item.title.includes('键盘')),
      `命中 ${searched.body.meta.total} 件`
    )

    const descSearch = await json<ListResponse<ItemDto>>(
      `${BASE}/items?q=${encodeURIComponent('宿舍楼下')}`
    )
    check('中文关键词搜索命中描述', descSearch.body.meta.total >= 1, `命中 ${descSearch.body.meta.total} 件`)

    // ---------- 排序 ----------
    const ascending = await json<ListResponse<ItemDto>>(`${BASE}/items?sort=price_asc&pageSize=3`)
    const prices = ascending.body.data.map((item) => item.priceCents)
    check(
      '价格升序生效',
      prices.every((price, index) => index === 0 || price >= prices[index - 1]),
      prices.join(' / ')
    )

    // ---------- 登录 ----------
    const demoToken = await login('demo@campus.edu', 'demo1234')
    const otherToken = await login('lin@campus.edu', 'campus1234')
    check('种子账号可以登录', Boolean(demoToken) && Boolean(otherToken))

    // ---------- 上传 ----------
    const form = new FormData()
    form.append('file', new Blob([TINY_PNG], { type: 'image/png' }), 'verify.png')
    const uploadResponse = await fetch(`${BASE}/uploads/images`, {
      method: 'POST',
      headers: bearer(demoToken),
      body: form
    })
    const uploaded = (await uploadResponse.json()) as UploadResponse
    check(
      '上传图片返回可访问地址',
      uploadResponse.status === 201,
      uploaded.data?.url ?? '无返回'
    )
    uploadedKeys.push(uploaded.data.key)

    const imageResponse = await fetch(`${ORIGIN}${uploaded.data.url}`)
    check('上传后的图片可以通过静态地址访问', imageResponse.ok, `HTTP ${imageResponse.status}`)

    // ---------- 发布 ----------
    const created = await json<DataResponse<ItemDto>>(`${BASE}/items`, {
      method: 'POST',
      headers: jsonHeaders(demoToken),
      body: JSON.stringify({
        title: '联调验证：机械键盘 87 键 自用',
        description: '这是一段用于验证后端链路的商品描述，成色良好，支持当面验货。',
        priceCents: 18850,
        categorySlug: 'digital',
        images: [uploaded.data.url]
      })
    })
    createdItemId = created.body.data?.id ?? null
    check('发布商品成功', created.status === 201, created.body.data?.title ?? '无返回')

    // ---------- 详情 ----------
    const detail = await json<DataResponse<ItemDto>>(`${BASE}/items/${createdItemId}`)
    check(
      '详情返回商品且未登录时不含联系方式',
      detail.body.data.title.includes('联调验证') && detail.body.data.seller.contact === null,
      `浏览 ${detail.body.data.viewCount} 次`
    )

    const detailLoggedIn = await json<DataResponse<ItemDto>>(`${BASE}/items/${createdItemId}`, {
      headers: bearer(otherToken)
    })
    check(
      '登录后详情返回卖家联系方式',
      detailLoggedIn.body.data.seller.contact === '微信 shenzhiyuan'
    )

    // ---------- 越权 ----------
    const forbidden = await fetch(`${BASE}/items/${createdItemId}`, {
      method: 'PATCH',
      headers: jsonHeaders(otherToken),
      body: JSON.stringify({ title: '别人改的标题' })
    })
    check('修改他人商品返回 403', forbidden.status === 403)

    // ---------- 收藏 ----------
    const favorite = await fetch(`${BASE}/favorites/${createdItemId}`, {
      method: 'POST',
      headers: bearer(otherToken)
    })
    const favoriteAgain = await fetch(`${BASE}/favorites/${createdItemId}`, {
      method: 'POST',
      headers: bearer(otherToken)
    })
    const afterFavorite = await json<DataResponse<ItemDto>>(`${BASE}/items/${createdItemId}`)
    check(
      '收藏成功且重复收藏幂等',
      favorite.status === 201 && favoriteAgain.status === 201 && afterFavorite.body.data.favoriteCount === 1,
      `收藏数 ${afterFavorite.body.data.favoriteCount}`
    )

    const favoriteList = await json<ListResponse<ItemDto>>(`${BASE}/favorites`, {
      headers: bearer(otherToken)
    })
    check('收藏列表包含该商品', favoriteList.body.meta.total >= 1)

    const favoriteIds = await json<DataResponse<string[]>>(`${BASE}/favorites/ids`, {
      headers: bearer(otherToken)
    })
    check('收藏 id 列表可用于标记爱心', favoriteIds.body.data.includes(createdItemId!))

    // ---------- 状态 ----------
    const sold = await json<DataResponse<ItemDto>>(`${BASE}/items/${createdItemId}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(demoToken),
      body: JSON.stringify({ status: 'sold' })
    })
    check('标记为已售', sold.body.data.status === 'sold')

    const onSale = await json<DataResponse<ItemDto>>(`${BASE}/items/${createdItemId}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(demoToken),
      body: JSON.stringify({ status: 'on_sale' })
    })
    check('重新上架', onSale.body.data.status === 'on_sale')

    // ---------- 我的发布 ----------
    const mine = await json<ListResponse<ItemDto>>(
      `${BASE}/items?sellerId=${sold.body.data.sellerId}`,
      { headers: bearer(demoToken) }
    )
    check('按卖家筛选可以看到自己的全部商品', mine.body.meta.total >= 4, `${mine.body.meta.total} 件`)

    // ---------- 资料 ----------
    const profile = await json<ProfileResponse>(`${BASE}/users/me`, {
      method: 'PATCH',
      headers: jsonHeaders(demoToken),
      body: JSON.stringify({ bio: '联调验证临时修改的简介' })
    })
    check('修改个人资料', profile.body.data.bio === '联调验证临时修改的简介')

    const sellerPage = await json<SellerProfileResponse>(`${BASE}/users/${sold.body.data.sellerId}`)
    check('卖家主页返回统计信息', sellerPage.body.data.itemCount >= 4, `${sellerPage.body.data.itemCount} 件`)

    // ---------- 删除 ----------
    const removed = await fetch(`${BASE}/items/${createdItemId}`, {
      method: 'DELETE',
      headers: bearer(demoToken)
    })
    const afterDelete = await fetch(`${BASE}/items/${createdItemId}`)
    check('软删除后详情返回 404', removed.status === 204 && afterDelete.status === 404)
    createdItemId = null
  } finally {
    // 清理本次验证产生的数据，让开发库回到种子状态
    if (createdItemId) {
      await prisma.item.delete({ where: { id: createdItemId } }).catch(() => undefined)
    }
    await prisma.user.updateMany({
      where: { email: 'demo@campus.edu' },
      data: { bio: '计算机学院大三，只在校园内当面交易，欢迎验货。' }
    })
    await Promise.all(uploadedKeys.map((key) => storage.remove(key).catch(() => undefined)))
    // 必须同时结束连接池，否则进程会一直挂着不退出
    await disconnectDatabase()
  }

  console.log(`\n通过 ${passed} / ${passed + failed}`)
  if (failed > 0) process.exitCode = 1
}

await main()
