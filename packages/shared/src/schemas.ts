import { z } from 'zod'
import {
  ADMIN_REASON_MAX,
  BIO_MAX,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  MAX_ITEM_IMAGES,
  NICKNAME_MAX,
  NICKNAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PRICE_MAX_CENTS,
  TITLE_MAX,
  TITLE_MIN
} from './constants.js'

/**
 * 前后端共用的校验规则。
 * 前端用于即时反馈，后端 Phase 2 用同一份 schema 做最终校验，
 * 避免「前端能过、后端拒绝」这类不一致。
 */

const email = z
  .string()
  .min(1, '请输入邮箱')
  .max(120, '邮箱过长')
  .email('邮箱格式不正确')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, '请输入密码').min(PASSWORD_MIN, `密码至少 ${PASSWORD_MIN} 位`)
})

export const nicknameRule = z
  .string()
  .trim()
  .min(1, '请输入昵称')
  .min(NICKNAME_MIN, `昵称至少 ${NICKNAME_MIN} 个字`)
  .max(NICKNAME_MAX, `昵称最多 ${NICKNAME_MAX} 个字`)

export const passwordRule = z
  .string()
  .min(1, '请设置密码')
  .min(PASSWORD_MIN, `密码至少 ${PASSWORD_MIN} 位`)
  .max(PASSWORD_MAX, `密码最多 ${PASSWORD_MAX} 位`)
  .regex(/[a-zA-Z]/, '密码需要包含字母')
  .regex(/\d/, '密码需要包含数字')

/**
 * 注册接口的请求体。后端只需要这三个字段。
 */
export const registerPayloadSchema = z.object({
  email,
  nickname: nicknameRule,
  password: passwordRule
})
export type RegisterPayloadValues = z.infer<typeof registerPayloadSchema>

/**
 * 注册表单的校验规则：在请求体之上加了「确认密码」。
 * 两个 schema 共用同一份字段规则，不会出现前后端校验不一致。
 */
export const registerSchema = registerPayloadSchema
  .extend({ confirmPassword: z.string().min(1, '请再次输入密码') })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致'
  })

/** 表单里价格是字符串（便于输入过程中的空值、小数点处理），提交前转成分 */
export const itemFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '请输入商品名称')
    .min(TITLE_MIN, `名称至少 ${TITLE_MIN} 个字`)
    .max(TITLE_MAX, `名称最多 ${TITLE_MAX} 个字`),
  categorySlug: z.string().min(1, '请选择分类'),
  price: z
    .string()
    .min(1, '请输入价格')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.trim()), '价格格式不正确，最多两位小数')
    .refine((v) => Number(v) > 0, '价格必须大于 0')
    .refine((v) => Math.round(Number(v) * 100) <= PRICE_MAX_CENTS, '价格超出上限'),
  description: z
    .string()
    .trim()
    .min(1, '请填写商品描述')
    .min(DESCRIPTION_MIN, `描述至少 ${DESCRIPTION_MIN} 个字，说明成色和交易方式更容易卖出`)
    .max(DESCRIPTION_MAX, `描述最多 ${DESCRIPTION_MAX} 个字`),
  images: z
    .array(z.string())
    .min(1, '请至少上传一张商品图片')
    .max(MAX_ITEM_IMAGES, `最多上传 ${MAX_ITEM_IMAGES} 张图片`)
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, '请输入昵称')
    .min(NICKNAME_MIN, `昵称至少 ${NICKNAME_MIN} 个字`)
    .max(NICKNAME_MAX, `昵称最多 ${NICKNAME_MAX} 个字`),
  school: z.string().trim().max(50, '学校名称过长').optional().or(z.literal('')),
  campus: z.string().trim().max(50, '校区名称过长').optional().or(z.literal('')),
  contact: z.string().trim().max(100, '联系方式过长').optional().or(z.literal('')),
  bio: z.string().trim().max(BIO_MAX, `简介最多 ${BIO_MAX} 个字`).optional().or(z.literal(''))
})

export type ProfileFormValues = z.infer<typeof profileSchema>

// ---------------------------------------------------------------------------
// 商品
// ---------------------------------------------------------------------------

export const itemTitleRule = z
  .string()
  .trim()
  .min(1, '请输入商品名称')
  .min(TITLE_MIN, `名称至少 ${TITLE_MIN} 个字`)
  .max(TITLE_MAX, `名称最多 ${TITLE_MAX} 个字`)

export const itemDescriptionRule = z
  .string()
  .trim()
  .min(1, '请填写商品描述')
  .min(DESCRIPTION_MIN, `描述至少 ${DESCRIPTION_MIN} 个字，说明成色和交易方式更容易卖出`)
  .max(DESCRIPTION_MAX, `描述最多 ${DESCRIPTION_MAX} 个字`)

export const itemStatusRule = z.enum(['on_sale', 'sold', 'off_shelf'])

/**
 * 发布商品的请求体。
 * 价格用「分」的整数传递，避免在传输和计算过程中出现浮点误差。
 */
export const createItemPayloadSchema = z.object({
  title: itemTitleRule,
  description: itemDescriptionRule,
  priceCents: z
    .number({ error: '价格必须是以「分」为单位的整数' })
    .int('价格必须是以「分」为单位的整数')
    .positive('价格必须大于 0')
    .max(PRICE_MAX_CENTS, '价格超出上限'),
  categorySlug: z.string().trim().min(1, '请选择分类'),
  images: z
    .array(z.string().trim().min(1))
    .min(1, '请至少上传一张商品图片')
    .max(MAX_ITEM_IMAGES, `最多上传 ${MAX_ITEM_IMAGES} 张图片`)
})

export type CreateItemPayloadValues = z.infer<typeof createItemPayloadSchema>

/** 编辑商品：所有字段可选，只改传上来的部分 */
export const updateItemPayloadSchema = createItemPayloadSchema.partial()
export type UpdateItemPayloadValues = z.infer<typeof updateItemPayloadSchema>

export const updateItemStatusSchema = z.object({ status: itemStatusRule })

/**
 * 商品列表查询条件。
 * query string 里全是字符串，因此用 coerce 转换数值，并在这里统一约束边界，
 * 避免把「pageSize=10000」这类请求透传到数据库。
 */
export const itemQuerySchema = z.object({
  q: z.string().trim().max(60, '关键词过长').optional(),
  category: z.string().trim().max(40).optional(),
  sort: z.enum(['latest', 'price_asc', 'price_desc']).optional(),
  status: itemStatusRule.optional(),
  sellerId: z.string().uuid('卖家 id 格式不正确').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12)
})

export type ItemQueryValues = z.infer<typeof itemQuerySchema>

// ---------------------------------------------------------------------------
// 用户资料
// ---------------------------------------------------------------------------

/** 编辑资料：只允许修改这些字段，且全部可选 */
export const updateProfilePayloadSchema = z.object({
  nickname: nicknameRule.optional(),
  school: z.string().trim().max(50, '学校名称过长').nullish(),
  campus: z.string().trim().max(50, '校区名称过长').nullish(),
  contact: z.string().trim().max(100, '联系方式过长').nullish(),
  bio: z.string().trim().max(BIO_MAX, `简介最多 ${BIO_MAX} 个字`).nullish()
})

export type UpdateProfilePayloadValues = z.infer<typeof updateProfilePayloadSchema>

// ---------------------------------------------------------------------------
// 管理后台
// ---------------------------------------------------------------------------

const adminReason = z
  .string()
  .trim()
  .max(ADMIN_REASON_MAX, `说明最多 ${ADMIN_REASON_MAX} 个字`)
  .optional()

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'banned'], { error: '状态只能是 active 或 banned' }),
  reason: adminReason
})

export const adminUpdateItemStatusSchema = z.object({
  status: itemStatusRule,
  reason: adminReason
})

export const adminDeleteSchema = z.object({ reason: adminReason })

export const createCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, '标识至少 2 个字符')
    .max(40, '标识最多 40 个字符')
    // 分类标识会出现在 URL 里，限制为小写字母、数字与连字符
    .regex(/^[a-z0-9-]+$/, '标识只能包含小写字母、数字和连字符'),
  name: z.string().trim().min(1, '请输入分类名称').max(20, '分类名称最多 20 个字'),
  icon: z.string().trim().min(1, '请选择图标').max(50),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true)
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryValues = z.infer<typeof createCategorySchema>
export type UpdateCategoryValues = z.infer<typeof updateCategorySchema>
