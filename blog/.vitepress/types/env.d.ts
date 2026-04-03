/// <reference types="vite/client" />

// 统一的环境变量类型
interface SharedEnv {
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GITHUB_REDIRECT_URI: string
  readonly VITE_GITHUB_REPO_ID: string
  readonly VITE_GITHUB_DISCUSS_REP: string
  readonly VITE_GITHUB_DISCUSS_OWNER: string
  readonly VITE_GITHUB_DISCUSS_TYPE_ID: string
  readonly VITE_GITHUB_PROXY: string
}

// ------------------------------
// import.meta.env（浏览器端）
// ------------------------------
interface ImportMetaEnv extends SharedEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ------------------------------
// process.env（Node 环境）
// ------------------------------
declare namespace NodeJS {
  interface ProcessEnv extends SharedEnv {}
}
