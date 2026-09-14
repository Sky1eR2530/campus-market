import { CATEGORY_SEED } from '@campus/shared'
import { hash } from 'bcryptjs'
import { disconnectDatabase, prisma } from '../src/lib/prisma.js'

/**
 * 种子数据。
 * 使用 upsert 而非 create，因此可以重复执行：新环境初始化、已有环境补齐
 * 都走同一条命令，不会因为唯一约束冲突而失败。
 */

const BCRYPT_ROUNDS = 10
const DEMO_SCHOOL = '云川大学'
const DEMO_CAMPUS = '东湖校区'

interface SeedAccount {
  email: string
  password: string
  nickname: string
  role: 'user' | 'admin'
  school: string | null
  campus: string | null
  contact: string | null
  bio: string | null
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: 'admin@campus.edu',
    password: 'admin1234',
    nickname: '平台管理员',
    role: 'admin',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: null,
    bio: null
  },
  {
    email: 'demo@campus.edu',
    password: 'demo1234',
    nickname: '沈知远',
    role: 'user',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 shenzhiyuan',
    bio: '计算机学院大三，只在校园内当面交易，欢迎验货。'
  }
]

async function seedCategories(): Promise<void> {
  for (const category of CATEGORY_SEED) {
    const data = {
      name: category.name,
      icon: category.icon,
      sortOrder: category.sortOrder
    }
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: data,
      create: { slug: category.slug, ...data }
    })
  }
}

async function seedAccounts(): Promise<void> {
  for (const account of ACCOUNTS) {
    // 邮箱统一小写存储，保证大小写不敏感的唯一性
    const email = account.email.trim().toLowerCase()
    const passwordHash = await hash(account.password, BCRYPT_ROUNDS)

    await prisma.user.upsert({
      where: { email },
      // 重复执行时重置演示账号密码，方便随时恢复到已知状态
      update: { nickname: account.nickname, role: account.role, passwordHash },
      create: {
        email,
        passwordHash,
        nickname: account.nickname,
        role: account.role,
        school: account.school,
        campus: account.campus,
        contact: account.contact,
        bio: account.bio
      }
    })
  }
}

async function main(): Promise<void> {
  console.log('开始写入种子数据…')

  await seedCategories()
  await seedAccounts()

  const [categoryCount, userCount] = await Promise.all([
    prisma.category.count(),
    prisma.user.count()
  ])

  console.log(`完成：分类 ${categoryCount} 条，用户 ${userCount} 条`)
  console.log('  学生账号  demo@campus.edu  / demo1234')
  console.log('  管理员    admin@campus.edu / admin1234')
}

main()
  .catch((error: unknown) => {
    console.error('种子数据写入失败：', error)
    process.exitCode = 1
  })
  .finally(() => {
    void disconnectDatabase()
  })
