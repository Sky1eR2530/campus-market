/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 是否使用本地 Mock 数据，Phase 3 接入真实 API 后置为 'false' */
  readonly VITE_USE_MOCK?: string
  /** API 基础路径 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
