import { disconnectDatabase, prisma } from '../lib/prisma.js'

/**
 * 接口耗时基准与索引命中检查。
 *
 * 索引检查不能直接跑在种子数据上：只有 10 行时 PostgreSQL 一定选全表扫描，
 * 「没有命中索引」并不能说明索引没用。因此这里在一个事务里临时插入 3000 行，
 * 重新收集统计信息后再看执行计划，最后回滚，不污染开发数据。
 */

const BASE = process.env.BENCH_BASE_URL ?? 'http://localhost:3000/api'
const ROUNDS = Number(process.env.BENCH_ROUNDS ?? 60)
const SYNTHETIC_ROWS = 3000

interface Scenario {
  label: string
  path: string
  token?: string
}

interface AuthResponse {
  data: { token: string }
}

interface ListResponse {
  data: { id: string }[]
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const body = (await response.json()) as AuthResponse
  return body.data?.token ?? ''
}

async function firstItemId(): Promise<string> {
  const response = await fetch(`${BASE}/items?pageSize=1`)
  const body = (await response.json()) as ListResponse
  return body.data[0]?.id ?? ''
}

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0
}

async function measure(scenario: Scenario): Promise<void> {
  const headers = scenario.token ? { Authorization: `Bearer ${scenario.token}` } : {}
  const durations: number[] = []
  let rateLimited = 0
  let otherFailures = 0

  // 先热身一次，避免把首次连接与模块加载的开销算进去
  await (await fetch(`${BASE}${scenario.path}`, { headers })).arrayBuffer()

  for (let index = 0; index < ROUNDS; index += 1) {
    const startedAt = performance.now()
    const response = await fetch(`${BASE}${scenario.path}`, { headers })
    durations.push(performance.now() - startedAt)
    if (response.status === 429) rateLimited += 1
    else if (!response.ok) otherFailures += 1
    await response.arrayBuffer()
  }

  const p50 = percentile(durations, 0.5)
  const p95 = percentile(durations, 0.95)
  const max = Math.max(...durations)

  const notes = [
    rateLimited > 0 ? `被限流 ${rateLimited} 次` : '',
    otherFailures > 0 ? `失败 ${otherFailures} 次` : '',
    p95 > 300 ? '超过 300ms' : ''
  ].filter(Boolean)

  console.log(
    `${scenario.label.padEnd(24)} p50 ${p50.toFixed(1).padStart(6)}ms` +
      `   p95 ${p95.toFixed(1).padStart(6)}ms   max ${max.toFixed(1).padStart(6)}ms` +
      (notes.length > 0 ? `   ${notes.join('，')}` : '')
  )
}

interface PlanRow {
  'QUERY PLAN': string
}

/** 用一个一定会回滚的事务，在接近真实的数据量上检查执行计划 */
class Rollback extends Error {}

interface PlanResult {
  natural: string
  forced: string
}

/**
 * 在合成数据上跑两次 EXPLAIN：
 * - natural：正常执行计划，反映优化器在真实成本下的选择；
 * - forced：关掉顺序扫描，用来判断「索引到底能不能用」。
 * 只看 natural 会把「数据量小所以不必要」误判成「索引没生效」。
 */
async function explainWithSyntheticData(label: string, sql: string): Promise<PlanResult> {
  let natural = ''
  let forced = ''

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        INSERT INTO items
          (id, seller_id, category_id, title, description, price_cents, status,
           published_at, created_at, updated_at)
        SELECT
          gen_random_uuid(),
          (SELECT id FROM users LIMIT 1),
          (SELECT id FROM categories LIMIT 1),
          CASE
            WHEN i % 100 = 0 THEN '基准测试机械键盘商品 ' || i
            ELSE '基准测试普通商品 ' || i
          END,
          '这是一段用于基准测试的商品描述内容 ' || i,
          (i % 5000) + 100,
          CASE
            WHEN i % 7 = 0 THEN 'off_shelf'::"ItemStatus"
            WHEN i % 5 = 0 THEN 'sold'::"ItemStatus"
            ELSE 'on_sale'::"ItemStatus"
          END,
          now() - (i || ' minutes')::interval,
          now(),
          now()
        FROM generate_series(1, ${SYNTHETIC_ROWS}) AS i
      `)
      await tx.$executeRawUnsafe('ANALYZE items')

      const rows = await tx.$queryRawUnsafe<PlanRow[]>(`EXPLAIN ANALYZE ${sql}`)
      natural = rows.map((row) => row['QUERY PLAN']).join('\n')

      await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off')
      const forcedRows = await tx.$queryRawUnsafe<PlanRow[]>(`EXPLAIN ANALYZE ${sql}`)
      forced = forcedRows.map((row) => row['QUERY PLAN']).join('\n')

      throw new Rollback()
    })
  } catch (error) {
    if (!(error instanceof Rollback)) throw error
  } finally {
    // 事务虽然回滚了，统计信息可能仍停留在 3000 行的估算上，重新收集一次
    await prisma.$executeRawUnsafe('ANALYZE items')
  }

  console.log(`\n${label}`)
  printPlan('默认计划', natural)
  printPlan('关闭顺序扫描后', forced)

  return { natural, forced }
}

function printPlan(title: string, plan: string): void {
  // 同时匹配 "Index Scan using x" 与 "Bitmap Index Scan on y" 两种写法
  const indexNames = [...plan.matchAll(/Index (?:Only )?Scan (?:using|on) (\S+)/g)].map(
    (match) => match[1]
  )
  const onlySeqScan = /Seq Scan on items/.test(plan) && indexNames.length === 0

  console.log(
    `  ${title}：${indexNames.length > 0 ? `使用 ${[...new Set(indexNames)].join('、')}` : onlySeqScan ? '全表扫描' : '未使用索引'}`
  )
  console.log(`    执行耗时 ${/Execution Time: ([\d.]+ ms)/.exec(plan)?.[1] ?? '未知'}`)

  if (process.env.BENCH_VERBOSE === '1') {
    for (const line of plan.split('\n')) {
      if (/Scan|Filter|Execution Time/i.test(line)) console.log(`      ${line.trim()}`)
    }
  }
}

async function main(): Promise<void> {
  console.log(`接口耗时基准（每个场景 ${ROUNDS} 次请求）\n`)

  const adminToken = await login('admin@campus.edu', 'admin1234')
  const detailId = await firstItemId()

  const scenarios: Scenario[] = [
    { label: '商品列表（默认）', path: '/items' },
    { label: '商品列表（中文搜索）', path: `/items?q=${encodeURIComponent('键盘')}` },
    { label: '商品列表（分类筛选）', path: '/items?category=digital' },
    { label: '商品列表（价格排序）', path: '/items?sort=price_asc' },
    { label: '商品详情', path: `/items/${detailId}` },
    { label: '分类列表', path: '/categories' },
    { label: '后台商品列表', path: '/admin/items', token: adminToken },
    { label: '后台用户列表', path: '/admin/users', token: adminToken }
  ]

  for (const scenario of scenarios) {
    await measure(scenario)
  }

  console.log('\n索引命中检查')

  await explainWithSyntheticData(
    '列表默认查询（status + published_at）',
    [
      'SELECT id FROM items',
      "WHERE deleted_at IS NULL AND status <> 'off_shelf'",
      'ORDER BY published_at DESC LIMIT 12'
    ].join(' ')
  )

  await explainWithSyntheticData(
    '中文搜索：4 个字符，命中约 1%（可提取三元组）',
    [
      'SELECT id FROM items',
      'WHERE deleted_at IS NULL',
      "AND (title ILIKE '%机械键盘%' OR description ILIKE '%机械键盘%') LIMIT 12"
    ].join(' ')
  )

  await explainWithSyntheticData(
    '中文搜索：2 个字符，命中约 1%（PostgreSQL 要求至少 3 个字符才能用三元组索引）',
    [
      'SELECT id FROM items',
      'WHERE deleted_at IS NULL',
      "AND (title ILIKE '%键盘%' OR description ILIKE '%键盘%') LIMIT 12"
    ].join(' ')
  )

  await explainWithSyntheticData(
    '卖家维度查询（seller_id + created_at）',
    [
      'SELECT id FROM items',
      'WHERE seller_id = (SELECT id FROM users LIMIT 1)',
      'ORDER BY created_at DESC LIMIT 12'
    ].join(' ')
  )

  await disconnectDatabase()
}

await main()
