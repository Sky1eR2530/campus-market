import { z } from 'zod'
import {
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

const nickname = z
  .string()
  .trim()
  .min(1, '请输入昵称')
  .min(NICKNAME_MIN, `昵称至少 ${NICKNAME_MIN} 个字`)
  .max(NICKNAME_MAX, `昵称最多 ${NICKNAME_MAX} 个字`)

const password = z
  .string()
  .min(1, '请设置密码')
  .min(PASSWORD_MIN, `密码至少 ${PASSWORD_MIN} 位`)
  .max(PASSWORD_MAX, `密码最多 ${PASSWORD_MAX} 位`)
  .regex(/[a-zA-Z]/, '密码需要包含字母')
  .regex(/\d/, '密码需要包含数字')

/**
 * 注册接口的请求体。后端只需要这三个字段。
 */
export const registerPayloadSchema = z.object({ email, nickname, password })
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
