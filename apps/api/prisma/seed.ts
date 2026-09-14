import { CATEGORY_SEED } from '@campus/shared'
import { hash } from 'bcryptjs'
import { storage } from '../src/lib/storage/index.js'
import { disconnectDatabase, prisma } from '../src/lib/prisma.js'

/**
 * 种子数据。
 *
 * 全部使用 upsert / 存在性判断实现幂等：新环境初始化与已有环境补齐
 * 都走同一条命令，重复执行不会产生重复数据。
 */

const BCRYPT_ROUNDS = 10
const DEMO_SCHOOL = '云川大学'
const DEMO_CAMPUS = '东湖校区'
const HOUR = 3_600_000

interface SeedAccount {
  email: string
  password: string
  nickname: string
  role: 'user' | 'admin'
  contact: string | null
  bio: string | null
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: 'admin@campus.edu',
    password: 'admin1234',
    nickname: '平台管理员',
    role: 'admin',
    contact: null,
    bio: null
  },
  {
    email: 'demo@campus.edu',
    password: 'demo1234',
    nickname: '沈知远',
    role: 'user',
    contact: '微信 shenzhiyuan',
    bio: '计算机学院大三，只在校园内当面交易，欢迎验货。'
  },
  {
    email: 'lin@campus.edu',
    password: 'campus1234',
    nickname: '林晓',
    role: 'user',
    contact: '微信 linxiao_tech',
    bio: '数码爱好者，换设备比较频繁，出手的都是自用机。'
  },
  {
    email: 'chen@campus.edu',
    password: 'campus1234',
    nickname: '陈默',
    role: 'user',
    contact: 'QQ 4021387',
    bio: '数学学院。书和文具居多，价格都好商量。'
  },
  {
    email: 'su@campus.edu',
    password: 'campus1234',
    nickname: '苏晴',
    role: 'user',
    contact: '微信 suqing_w',
    bio: '外国语学院，今年考研上岸，资料全部清仓。'
  },
  {
    email: 'zhou@campus.edu',
    password: 'campus1234',
    nickname: '周予安',
    role: 'user',
    contact: '微信 zy_an',
    bio: '建筑学院，大件物品可以帮忙搬到宿舍楼下。'
  }
]

interface SeedItem {
  sellerEmail: string
  categorySlug: string
  title: string
  description: string
  /** 单位：元，入库时转换为「分」 */
  yuan: number
  imageCount: number
  status?: 'on_sale' | 'sold' | 'off_shelf'
  hoursAgo: number
}

const ITEMS: SeedItem[] = [
  {
    sellerEmail: 'lin@campus.edu',
    categorySlug: 'digital',
    title: 'iPad Air 5 64G 深空灰 附手写笔',
    description:
      '2023 年购入，自用两年，屏幕无划痕，边角有轻微使用痕迹。配原装充电头和数据线，可附赠一支二手 Apple Pencil。支持当场验机、开箱测试。',
    yuan: 2680,
    imageCount: 3,
    hoursAgo: 3
  },
  {
    sellerEmail: 'lin@campus.edu',
    categorySlug: 'digital',
    title: '联想小新 Pro14 2023 R7 16G+512G 在保',
    description:
      '国行在保到明年 3 月。平时写代码和做 PPT，没有跑过大游戏。C 面有轻微指纹印，键盘无油。带原装 65W 电源和收纳包。',
    yuan: 3699,
    imageCount: 3,
    hoursAgo: 5
  },
  {
    sellerEmail: 'chen@campus.edu',
    categorySlug: 'study',
    title: '卡西欧 fx-991CN 科学计算器',
    description: '考试指定型号，功能正常，屏幕无划痕。附说明书和硬壳保护套。',
    yuan: 65,
    imageCount: 2,
    hoursAgo: 21
  },
  {
    sellerEmail: 'chen@campus.edu',
    categorySlug: 'digital',
    title: '罗技 G304 无线鼠标 自用半年',
    description: '微动无双击，滚轮手感正常。附接收器和一条新的延长线，宿舍楼下自提优先。',
    yuan: 129,
    imageCount: 2,
    hoursAgo: 26
  },
  {
    sellerEmail: 'su@campus.edu',
    categorySlug: 'books',
    title: '考研数学一 全套资料 打包出',
    description:
      '李永乐复习全书 + 660 题 + 张宇 1000 题 + 历年真题，整套打包出。书上有笔记和划线，介意的同学慎拍。今年上岸了，希望资料能传给下一个人。',
    yuan: 85,
    imageCount: 3,
    hoursAgo: 6
  },
  {
    sellerEmail: 'zhou@campus.edu',
    categorySlug: 'living',
    title: '宿舍小冰箱 45L 制冷正常',
    description:
      '45L 单门小冰箱，制冷正常，噪音很小。因为要搬出宿舍所以出。体积较大请自行搬运，可以在宿舍楼下试机。',
    yuan: 260,
    imageCount: 3,
    hoursAgo: 12
  },
  {
    sellerEmail: 'zhou@campus.edu',
    categorySlug: 'other',
    title: '捷安特 ATX 660 27.5 寸 刚做过保养',
    description:
      '骑行两年，车况良好，刹车和变速都正常，刚做过保养。带车锁和打气筒，校园内可送到宿舍楼下。',
    yuan: 680,
    imageCount: 3,
    hoursAgo: 7
  },
  {
    sellerEmail: 'demo@campus.edu',
    categorySlug: 'books',
    title: '《Introduction to Algorithms》英文影印版',
    description:
      '原版影印教材（第三版），大二算法课用过，书页干净，只有目录做了标记。适合准备算法竞赛或考研复试的同学。',
    yuan: 120,
    imageCount: 2,
    hoursAgo: 8
  },
  {
    sellerEmail: 'demo@campus.edu',
    categorySlug: 'digital',
    title: '阿米洛 VA87 机械键盘 静电容轴',
    description: '自用一年，键帽无油无掉字。因为换了 75 配列所以出，带原装线和防尘罩。',
    yuan: 380,
    imageCount: 3,
    status: 'sold',
    hoursAgo: 50
  },
  {
    sellerEmail: 'demo@campus.edu',
    categorySlug: 'study',
    title: '线性代数教材 + 学习指导（旧版）',
    description: '旧版教材，书页有笔记，适合当参考书。已经用不上了，低价出。',
    yuan: 15,
    imageCount: 1,
    status: 'off_shelf',
    hoursAgo: 240
  }
]

/** 分类对应的色相，让演示图片彼此有区分度 */
const CATEGORY_HUE: Record<string, number> = {
  digital: 222,
  books: 26,
  living: 168,
  fashion: 340,
  study: 262,
  other: 204
}

/**
 * 生成一张占位图。
 * 演示数据需要真实可访问的图片地址，但又不能凭空造出照片，
 * 因此按分类色相生成一张简洁的 SVG，由存储驱动落盘并通过静态资源访问。
 */
function buildPlaceholderSvg(categoryName: string, hue: number, seed: number): string {
  const angle = (seed * 41) % 360
  const blobX = 20 + ((seed * 29) % 60)
  const blobY = 15 + ((seed * 53) % 60)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0" stop-color="hsl(${hue} 62% 95%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 24) % 360} 46% 87%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="${(blobX / 100) * 800}" cy="${(blobY / 100) * 600}" r="180" fill="#ffffff" opacity="0.45"/>
  <circle cx="${800 - (blobX / 100) * 800}" cy="${600 - (blobY / 100) * 600}" r="90" fill="hsl(${hue} 70% 100%)" opacity="0.55"/>
  <text x="400" y="320" text-anchor="middle" font-size="84" font-weight="600"
        fill="hsl(${hue} 38% 34%)" opacity="0.5"
        font-family="PingFang SC, Microsoft YaHei, sans-serif">${categoryName}</text>
</svg>`
}

async function seedCategories(): Promise<void> {
  for (const category of CATEGORY_SEED) {
    const data = { name: category.name, icon: category.icon, sortOrder: category.sortOrder }
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: data,
      create: { slug: category.slug, ...data }
    })
  }
}

async function seedAccounts(): Promise<Map<string, string>> {
  const idByEmail = new Map<string, string>()

  for (const account of ACCOUNTS) {
    // 邮箱统一小写存储，保证大小写不敏感的唯一性
    const email = account.email.trim().toLowerCase()
    const passwordHash = await hash(account.password, BCRYPT_ROUNDS)

    const user = await prisma.user.upsert({
      where: { email },
      // 重复执行时重置演示账号密码，方便随时恢复到已知状态
      update: { nickname: account.nickname, role: account.role, passwordHash },
      create: {
        email,
        passwordHash,
        nickname: account.nickname,
        role: account.role,
        school: DEMO_SCHOOL,
        campus: DEMO_CAMPUS,
        contact: account.contact,
        bio: account.bio
      }
    })

    idByEmail.set(email, user.id)
  }

  return idByEmail
}

async function seedDemoItems(userIdByEmail: Map<string, string>): Promise<number> {
  // 库里已经有商品时跳过，避免重复执行种子数据时把演示商品堆成一堆
  const existing = await prisma.item.count()
  if (existing > 0) {
    console.log(`已有 ${existing} 件商品，跳过演示商品写入`)
    return 0
  }

  const categories = await prisma.category.findMany()
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
  const now = Date.now()
  let created = 0

  for (const [index, item] of ITEMS.entries()) {
    const sellerId = userIdByEmail.get(item.sellerEmail)
    const category = categoryBySlug.get(item.categorySlug)
    if (!sellerId || !category) continue

    const images = []
    for (let position = 0; position < item.imageCount; position += 1) {
      const svg = buildPlaceholderSvg(category.name, CATEGORY_HUE[category.slug] ?? 210, index * 7 + position + 1)
      const stored = await storage.save({
        buffer: Buffer.from(svg, 'utf8'),
        extension: 'svg',
        mimeType: 'image/svg+xml'
      })
      images.push({ url: stored.url, storageKey: stored.key, sortOrder: position })
    }

    const publishedAt = new Date(now - item.hoursAgo * HOUR)
    await prisma.item.create({
      data: {
        sellerId,
        categoryId: category.id,
        title: item.title,
        description: item.description,
        priceCents: item.yuan * 100,
        status: item.status ?? 'on_sale',
        school: DEMO_SCHOOL,
        campus: DEMO_CAMPUS,
        publishedAt,
        createdAt: publishedAt,
        images: { create: images }
      }
    })
    created += 1
  }

  return created
}

async function main(): Promise<void> {
  console.log('开始写入种子数据…')

  await seedCategories()
  const userIdByEmail = await seedAccounts()
  const itemCount = await seedDemoItems(userIdByEmail)

  const [categoryCount, userCount] = await Promise.all([
    prisma.category.count(),
    prisma.user.count()
  ])

  console.log(`完成：分类 ${categoryCount} 条，用户 ${userCount} 条，新增商品 ${itemCount} 件`)
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
