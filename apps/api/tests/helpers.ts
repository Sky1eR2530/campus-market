import { hash } from 'bcryptjs'
import { createApp } from '../src/app.js'
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
}

/** 直接落库创建用户，用于构造登录、封禁等场景的前提数据 */
export async function seedUser(input: SeedUserInput) {
  return prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      passwordHash: await hash(input.password, 4),
      nickname: input.nickname ?? '测试用户',
      status: input.status ?? 'active',
      role: input.role ?? 'user'
    }
  })
}
