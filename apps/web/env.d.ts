/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
