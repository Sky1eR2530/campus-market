/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径 */
  readonly VITE_API_BASE_URL?: string
  /** 部署子路径，生产环境为 /admin/ */
  readonly VITE_PUBLIC_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
