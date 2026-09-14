import { CATEGORY_SEED } from '@campus/shared'
import type { Category, ItemStatus, UserRole } from '@campus/shared'

/** 演示数据使用的学校信息。真实部署时由用户注册时填写或后台配置。 */
export const DEMO_SCHOOL = '云川大学'
export const DEMO_CAMPUS = '东湖校区'

/** 演示账号：登录页提供一键填充，方便快速体验完整流程 */
export const DEMO_ACCOUNT = { email: 'demo@campus.edu', password: 'demo1234' }
export const DEMO_ADMIN_ACCOUNT = { email: 'admin@campus.edu', password: 'admin1234' }

export interface SeedUser {
  id: string
  email: string
  password: string
  nickname: string
  school: string
  campus: string
  contact: string | null
  bio: string | null
  role: UserRole
  createdDaysAgo: number
}

export const SEED_USERS: SeedUser[] = [
  {
    id: 'u-demo',
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    nickname: '沈知远',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 shenzhiyuan',
    bio: '计算机学院大三，只在校园内当面交易，欢迎验货。',
    role: 'user',
    createdDaysAgo: 260
  },
  {
    id: 'u-lin',
    email: 'lin@campus.edu',
    password: 'campus1234',
    nickname: '林晓',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 linxiao_tech',
    bio: '数码爱好者，换设备比较频繁，出手的都是自用机。',
    role: 'user',
    createdDaysAgo: 410
  },
  {
    id: 'u-chen',
    email: 'chen@campus.edu',
    password: 'campus1234',
    nickname: '陈默',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: 'QQ 4021387',
    bio: '数学学院。书和文具居多，价格都好商量。',
    role: 'user',
    createdDaysAgo: 320
  },
  {
    id: 'u-su',
    email: 'su@campus.edu',
    password: 'campus1234',
    nickname: '苏晴',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 suqing_w',
    bio: '外国语学院，今年考研上岸，资料全部清仓。',
    role: 'user',
    createdDaysAgo: 520
  },
  {
    id: 'u-zhou',
    email: 'zhou@campus.edu',
    password: 'campus1234',
    nickname: '周予安',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 zy_an',
    bio: '建筑学院，大件物品可以帮忙搬到宿舍楼下。',
    role: 'user',
    createdDaysAgo: 190
  },
  {
    id: 'u-he',
    email: 'he@campus.edu',
    password: 'campus1234',
    nickname: '何屿',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: 'QQ 7712904',
    bio: '材料学院大二。宿舍楼下自提优先，可以小刀。',
    role: 'user',
    createdDaysAgo: 150
  },
  {
    id: 'u-zheng',
    email: 'zheng@campus.edu',
    password: 'campus1234',
    nickname: '郑一诺',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: '微信 yinuo_z',
    bio: '经管学院。买多了用不完的东西都放这里。',
    role: 'user',
    createdDaysAgo: 96
  },
  {
    id: 'u-admin',
    email: DEMO_ADMIN_ACCOUNT.email,
    password: DEMO_ADMIN_ACCOUNT.password,
    nickname: '平台管理员',
    school: DEMO_SCHOOL,
    campus: DEMO_CAMPUS,
    contact: null,
    bio: null,
    role: 'admin',
    createdDaysAgo: 600
  }
]

/** 分类表数据：来自共享种子，id 固定便于 Mock 层关联 */
export const SEED_CATEGORIES: Category[] = CATEGORY_SEED.map((item, index) => ({
  id: index + 1,
  slug: item.slug,
  name: item.name,
  icon: item.icon,
  sortOrder: item.sortOrder,
  itemCount: 0
}))

export interface SeedItemDef {
  id: string
  title: string
  description: string
  /** 单位：元。构建时转换为「分」 */
  yuan: number
  categorySlug: string
  sellerId: string
  imageCount: number
  status?: ItemStatus
  hoursAgo: number
  views: number
  favorites: number
}

export const SEED_ITEMS: SeedItemDef[] = [
  {
    id: 'seed-01',
    title: 'iPad Air 5 64G 深空灰 附手写笔',
    description:
      '2023 年购入，自用两年，屏幕无划痕，边角有轻微使用痕迹（已拍细节图）。配原装充电头和数据线，可附赠一支二手 Apple Pencil。校内当面交易，支持当场验机、开箱测试。',
    yuan: 2680,
    categorySlug: 'digital',
    sellerId: 'u-lin',
    imageCount: 3,
    hoursAgo: 3,
    views: 412,
    favorites: 38
  },
  {
    id: 'seed-02',
    title: 'AirPods Pro 2 降噪正常 充电盒有划痕',
    description:
      '去年双十一买的，降噪和通透模式都正常，右耳电池稍弱（连续听 4 小时左右）。充电盒背面有几道细划痕，不影响使用。已过保，售出不退，介意慎拍。',
    yuan: 899,
    categorySlug: 'digital',
    sellerId: 'u-lin',
    imageCount: 2,
    status: 'sold',
    hoursAgo: 9,
    views: 308,
    favorites: 26
  },
  {
    id: 'seed-03',
    title: '罗技 G304 无线鼠标 自用半年',
    description:
      '自用半年，微动无双击，滚轮手感正常。附接收器和一条新的延长线。因为换了鼠标所以出，宿舍楼下自提优先。',
    yuan: 129,
    categorySlug: 'digital',
    sellerId: 'u-chen',
    imageCount: 2,
    hoursAgo: 26,
    views: 187,
    favorites: 12
  },
  {
    id: 'seed-04',
    title: '联想小新 Pro14 2023 R7 16G+512G 在保',
    description:
      '2023 款，R7 7840HS / 16G / 512G，国行在保到明年 3 月。平时写代码和做 PPT，没有跑过大游戏。C 面有轻微指纹印，键盘无油。带原装 65W 电源和收纳包，支持当面验机。',
    yuan: 3699,
    categorySlug: 'digital',
    sellerId: 'u-lin',
    imageCount: 3,
    hoursAgo: 5,
    views: 521,
    favorites: 44
  },
  {
    id: 'seed-05',
    title: '佳能 EOS 200D 单反套机 快门约 8000',
    description:
      '入门单反，快门数约 8000，成色很好。含 18-55 套头、相机包、两块电池和 32G 存储卡。适合想学摄影的同学入门，可以约在校园里试拍。',
    yuan: 1899,
    categorySlug: 'digital',
    sellerId: 'u-zhou',
    imageCount: 3,
    hoursAgo: 48,
    views: 276,
    favorites: 19
  },
  {
    id: 'seed-06',
    title: '小米手环 8 NFC 版 用两周',
    description:
      '上个月买的，戴了两周发现不太习惯戴手环。NFC 可以刷校园卡门禁（需自行绑定）。原盒、充电线齐全，功能一切正常。',
    yuan: 139,
    categorySlug: 'digital',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 30,
    views: 143,
    favorites: 9
  },
  {
    id: 'seed-07',
    title: '考研数学一 全套资料 打包出',
    description:
      '李永乐复习全书 + 660 题 + 张宇 1000 题 + 历年真题，整套打包出。书上有我自己的笔记和划线，介意的同学慎拍。今年上岸了，希望资料能传给下一个人。',
    yuan: 85,
    categorySlug: 'books',
    sellerId: 'u-su',
    imageCount: 3,
    hoursAgo: 6,
    views: 355,
    favorites: 31
  },
  {
    id: 'seed-08',
    title: '计算机网络：自顶向下方法 第 7 版',
    description:
      '教材，只上过一个学期，无笔记无划线，书角有轻微压痕。考研 408 和期末复习都能用。',
    yuan: 42,
    categorySlug: 'books',
    sellerId: 'u-chen',
    imageCount: 1,
    hoursAgo: 20,
    views: 168,
    favorites: 14
  },
  {
    id: 'seed-09',
    title: '同济高数教材 + 习题册（第七版）',
    description:
      '大一用过的，书上笔记比较多，习题册做过一部分。适合提前预习或者当参考书，价格就是图个清仓。',
    yuan: 25,
    categorySlug: 'books',
    sellerId: 'u-su',
    imageCount: 2,
    hoursAgo: 72,
    views: 121,
    favorites: 7
  },
  {
    id: 'seed-10',
    title: '英语六级真题卷 2023-2025 全新未写',
    description: '全新未写过，买的时候多买了一套。附带听力音频。',
    yuan: 30,
    categorySlug: 'books',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 44,
    views: 96,
    favorites: 5
  },
  {
    id: 'seed-11',
    title: '《Introduction to Algorithms》英文影印版',
    description:
      '原版影印教材（第三版），大二算法课用过，书页干净，只有目录做了标记。适合准备算法竞赛或考研复试的同学。',
    yuan: 120,
    categorySlug: 'books',
    sellerId: 'u-demo',
    imageCount: 2,
    hoursAgo: 8,
    views: 210,
    favorites: 16
  },
  {
    id: 'seed-12',
    title: '宿舍小冰箱 45L 制冷正常',
    description:
      '45L 单门小冰箱，制冷正常，噪音很小，放宿舍完全没问题。因为要搬出宿舍所以出。体积较大，请自行搬运，可以在宿舍楼下试机。',
    yuan: 260,
    categorySlug: 'living',
    sellerId: 'u-zhou',
    imageCount: 3,
    hoursAgo: 12,
    views: 402,
    favorites: 28
  },
  {
    id: 'seed-13',
    title: '米家台灯 Pro 护眼款',
    description: '护眼台灯，无频闪，支持无级调光和色温调节。用了大概一年，灯罩无发黄。附原装电源适配器。',
    yuan: 99,
    categorySlug: 'living',
    sellerId: 'u-zheng',
    imageCount: 2,
    hoursAgo: 33,
    views: 158,
    favorites: 11
  },
  {
    id: 'seed-14',
    title: '床上折叠小书桌 带杯架',
    description: '床上用折叠小书桌，桌面无明显划痕，杯架和卡槽都完好。折起来很薄，不占空间。',
    yuan: 45,
    categorySlug: 'living',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 96,
    views: 87,
    favorites: 6
  },
  {
    id: 'seed-15',
    title: '台式饮水机 + 大半桶桶装水',
    description: '台式饮水机，冷热双温，用了两个学期。桶装水是上周送的，还有大半桶，一起给。',
    yuan: 60,
    categorySlug: 'living',
    sellerId: 'u-chen',
    imageCount: 2,
    hoursAgo: 60,
    views: 73,
    favorites: 4
  },
  {
    id: 'seed-16',
    title: '加湿器 2L 静音 只用过两周',
    description: '2L 容量，静音款，只用过两周。因为宿舍已经有一台，这台闲置。附原装线和说明书。',
    yuan: 55,
    categorySlug: 'living',
    sellerId: 'u-su',
    imageCount: 2,
    hoursAgo: 140,
    views: 64,
    favorites: 3
  },
  {
    id: 'seed-17',
    title: '优衣库轻型羽绒服 M 码 基本全新',
    description:
      '去年冬天买的，只穿过两次，无污渍无破损。M 码，我 172 身高刚好合身。已干洗，可以直接穿。',
    yuan: 180,
    categorySlug: 'fashion',
    sellerId: 'u-zheng',
    imageCount: 3,
    hoursAgo: 28,
    views: 233,
    favorites: 21
  },
  {
    id: 'seed-18',
    title: 'Nike Air Force 1 白色 41 码',
    description:
      '正品，去年线下专柜买的，鞋盒还在。穿过大概 10 次，鞋底有轻微磨损，已经彻底清洁过。41 码标准码。',
    yuan: 320,
    categorySlug: 'fashion',
    sellerId: 'u-zhou',
    imageCount: 3,
    hoursAgo: 15,
    views: 289,
    favorites: 23
  },
  {
    id: 'seed-19',
    title: '通勤双肩包 15.6 寸电脑仓',
    description: '有独立电脑仓（最大 15.6 寸）和防雨罩。背了半年，拉链顺滑，无破损。',
    yuan: 85,
    categorySlug: 'fashion',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 52,
    views: 112,
    favorites: 8
  },
  {
    id: 'seed-20',
    title: '冬季加绒卫衣 L 码 全新带吊牌',
    description: '网上买的，尺码拍大了，全新带吊牌没洗过。L 码偏大，适合 180 左右的同学。',
    yuan: 79,
    categorySlug: 'fashion',
    sellerId: 'u-su',
    imageCount: 2,
    status: 'sold',
    hoursAgo: 120,
    views: 78,
    favorites: 5
  },
  {
    id: 'seed-21',
    title: '卡西欧 fx-991CN 科学计算器',
    description: '考试指定型号，功能正常，屏幕无划痕。附说明书和硬壳保护套。',
    yuan: 65,
    categorySlug: 'study',
    sellerId: 'u-chen',
    imageCount: 2,
    hoursAgo: 21,
    views: 176,
    favorites: 13
  },
  {
    id: 'seed-22',
    title: '百乐 P500 中性笔 10 支装 全新',
    description: '全新未拆封，10 支装。买多了用不完，按原价出。',
    yuan: 35,
    categorySlug: 'study',
    sellerId: 'u-demo',
    imageCount: 1,
    hoursAgo: 46,
    views: 92,
    favorites: 6
  },
  {
    id: 'seed-23',
    title: '大学物理实验报告本 + 绘图工具套装',
    description: '实验报告本还剩大半本，配绘图工具（铅笔、橡皮、三角板、圆规），大物实验能直接用。',
    yuan: 22,
    categorySlug: 'study',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 88,
    views: 58,
    favorites: 2
  },
  {
    id: 'seed-24',
    title: 'A4 加厚活页笔记本 未拆封',
    description: '加厚活页本，未拆封，A4 大小，内页可替换。当初多买了一本。',
    yuan: 18,
    categorySlug: 'study',
    sellerId: 'u-zheng',
    imageCount: 2,
    hoursAgo: 160,
    views: 47,
    favorites: 2
  },
  {
    id: 'seed-25',
    title: '捷安特 ATX 660 27.5 寸 刚做过保养',
    description:
      '捷安特 ATX 660，27.5 寸，骑行两年，车况良好，刹车和变速都正常，刚做过保养。带车锁和打气筒。校园内可送到宿舍楼下。',
    yuan: 680,
    categorySlug: 'other',
    sellerId: 'u-zhou',
    imageCount: 3,
    hoursAgo: 7,
    views: 611,
    favorites: 42
  },
  {
    id: 'seed-26',
    title: '41 寸民谣吉他 带琴包变调夹',
    description:
      '41 寸民谣吉他，带琴包、变调夹和背带。弦刚换过，音准没问题。适合零基础入门，可以教你几个基础和弦。',
    yuan: 320,
    categorySlug: 'other',
    sellerId: 'u-zheng',
    imageCount: 2,
    hoursAgo: 40,
    views: 198,
    favorites: 17
  },
  {
    id: 'seed-27',
    title: '宿舍收纳箱 3 个 打包价',
    description: '三个收纳箱打包出，带盖，尺寸相同，可以叠放。无破损，打包价不单卖。',
    yuan: 40,
    categorySlug: 'other',
    sellerId: 'u-he',
    imageCount: 2,
    hoursAgo: 120,
    views: 66,
    favorites: 3
  },
  {
    id: 'seed-28',
    title: '尤尼克斯 NF800 羽毛球拍 一对',
    description: '尤尼克斯 NF800 一对，拉线 24 磅，手感还很好。拍框无磕碰。带两个拍套和半桶球。',
    yuan: 260,
    categorySlug: 'other',
    sellerId: 'u-chen',
    imageCount: 3,
    hoursAgo: 66,
    views: 145,
    favorites: 10
  },
  {
    id: 'seed-29',
    title: '阿米洛 VA87 机械键盘 静电容轴',
    description: '自用一年，键帽无油无掉字，轴体手感正常。因为换了 75 配列所以出。带原装线和防尘罩。',
    yuan: 380,
    categorySlug: 'digital',
    sellerId: 'u-demo',
    imageCount: 3,
    status: 'sold',
    hoursAgo: 50,
    views: 264,
    favorites: 20
  },
  {
    id: 'seed-30',
    title: '线性代数教材 + 学习指导（旧版）',
    description: '旧版教材，书页有笔记，适合当参考书。已经用不上了，低价出。',
    yuan: 15,
    categorySlug: 'books',
    sellerId: 'u-demo',
    imageCount: 1,
    status: 'off_shelf',
    hoursAgo: 240,
    views: 88,
    favorites: 4
  }
]
