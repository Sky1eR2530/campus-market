import type { ItemStatus } from '@campus/shared'
import { hash } from 'bcryptjs'
import { createApp } from '../src/app.js'
import { signAccessToken } from '../src/lib/jwt.js'
import { prisma } from '../src/lib/prisma.js'

export const app = createApp()

/** 清空所有业务表，保证用例之间互不影响 */
export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE admin_actions, favorites, item_images, items, categories, users RESTART IDENTITY CASCADE'
  )
}

export interface SeedUserInput {
  email: string
  password: string
  nickname?: string
  status?: 'active' | 'banned'
  role?: 'user' | 'admin'
  school?: string | null
  campus?: string | null
  contact?: string | null
}

/** 直接落库创建用户，用于构造登录、封禁等场景的前提数据 */
export async function seedUser(input: SeedUserInput) {
  return prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      // 测试里用最低代价因子，避免每个用例都花上百毫秒在 bcrypt 上
      passwordHash: await hash(input.password, 4),
      nickname: input.nickname ?? '测试用户',
      status: input.status ?? 'active',
      role: input.role ?? 'user',
      school: input.school ?? null,
      campus: input.campus ?? null,
      contact: input.contact ?? null
    }
  })
}

/** 创建用户并签发 token，省去每个用例重复走注册接口 */
export async function seedUserWithToken(input: SeedUserInput) {
  const user = await seedUser(input)
  const token = await signAccessToken({ sub: user.id, role: user.role })
  return { user, token, auth: `Bearer ${token}` }
}

export async function seedCategory(slug = 'digital', name = '数码产品') {
  return prisma.category.create({
    data: { slug, name, icon: 'device', sortOrder: 1 }
  })
}

/** 构造一个「本平台存储」的图片地址，供发布商品时使用 */
export function fakeImageUrl(name: string): string {
  return `/uploads/tests/${name}`
}

export interface SeedItemInput {
  sellerId: string
  categoryId: number
  title?: string
  description?: string
  priceCents?: number
  status?: ItemStatus
  imageCount?: number
  publishedAt?: Date
  deletedAt?: Date | null
}

export async function seedItem(input: SeedItemInput) {
  const imageCount = input.imageCount ?? 1
  return prisma.item.create({
    data: {
      sellerId: input.sellerId,
      categoryId: input.categoryId,
      title: input.title ?? '测试商品',
      description: input.description ?? '这是一段用于测试的商品描述内容。',
      priceCents: input.priceCents ?? 1000,
      status: input.status ?? 'on_sale',
      ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
      ...(input.deletedAt ? { deletedAt: input.deletedAt } : {}),
      images: {
        create: Array.from({ length: imageCount }, (_, index) => {
          const url = fakeImageUrl(`${input.title ?? 'item'}-${index}.jpg`)
          return { url, storageKey: url.replace('/uploads/', ''), sortOrder: index }
        })
      }
    },
    include: { images: true }
  })
}

/** 一张 1x1 的合法 PNG，用于上传接口测试 */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)
