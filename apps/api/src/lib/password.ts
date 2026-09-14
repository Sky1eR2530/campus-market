import { compare, hash } from 'bcryptjs'

/**
 * bcrypt 代价因子。10 轮在开发机上约 60~100ms，
 * 足以让离线暴力破解变得昂贵，又不会拖慢登录接口。
 */
const BCRYPT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  try {
    return await compare(plain, passwordHash)
  } catch {
    // 哈希格式异常（例如数据被手工改坏）按验证失败处理，
    // 不要把内部结构问题暴露成 500
    return false
  }
}
