import { disconnectDatabase, prisma } from '../lib/prisma.js'

/**
 * 把开发库恢复到种子数据的状态。
 *
 * 为什么需要它：端到端冒烟脚本走的是产品接口，而「删除商品」在产品里是软删除，
 * 所以每跑一次测试就会在库里留下一件已删除商品与几条操作日志。
 * 反复执行后，后台概览里的「已删除」计数会越积越多，看起来像是出了问题。
 *
 * 它只清理测试痕迹，不重建表结构；需要彻底重置请用 `prisma migrate reset`
 * （不可逆操作，需要你确认后手动执行）。
 */

async function main(): Promise<void> {
  const deletedItems = await prisma.item.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true }
  })

  if (deletedItems.length > 0) {
    await prisma.item.deleteMany({ where: { id: { in: deletedItems.map((item) => item.id) } } })
  }

  const favorites = await prisma.favorite.deleteMany({})
  const logs = await prisma.adminAction.deleteMany({})

  const demo = await prisma.user.updateMany({
    where: { email: 'demo@campus.edu' },
    data: {
      campus: '东湖校区',
      bio: '计算机学院大三，只在校园内当面交易，欢迎验货。'
    }
  })

  console.log(`已清理软删除商品 ${deletedItems.length} 件`)
  console.log(`已清理收藏 ${favorites.count} 条`)
  console.log(`已清理操作日志 ${logs.count} 条`)
  console.log(`已还原演示账号资料 ${demo.count} 条`)

  const [items, users, categories] = await Promise.all([
    prisma.item.count(),
    prisma.user.count(),
    prisma.category.count()
  ])
  console.log(`当前状态：商品 ${items} 件，用户 ${users} 个，分类 ${categories} 个`)
}

main()
  .catch((error: unknown) => {
    console.error('清理失败：', error)
    process.exitCode = 1
  })
  .finally(() => {
    // 必须同时结束连接池，否则进程会一直挂着不退出
    void disconnectDatabase()
  })
