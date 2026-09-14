/**
 * 访问令牌的本地存储。
 *
 * 说明：这里用的是 localStorage，实现简单、刷新不丢登录态。
 * 代价是 XSS 一旦发生，令牌可被读取。当前项目还没有引入用户生成内容渲染，
 * 风险可控；后续如果要彻底消除，需要改成 httpOnly Cookie + 刷新令牌，
 * 那部分工作依赖后端配合，记录在 Phase 5 的安全加固里。
 */

const STORAGE_KEY = 'campus-market:token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // 隐私模式下 localStorage 可能不可用，按未登录处理
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* 存不进去就只在内存里保持登录态 */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 忽略 */
  }
}
