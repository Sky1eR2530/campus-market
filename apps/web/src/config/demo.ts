/**
 * 演示账号提示。
 * 仅用于登录页的「一键填入」按钮，方便快速体验完整流程；
 * 账号本身由后端 `pnpm db:seed` 写入。
 */
export const DEMO_ACCOUNT = {
  email: 'demo@campus.edu',
  password: 'demo1234'
} as const
