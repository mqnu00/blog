/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GITHUB_REDIRECT_URI: string
  readonly VITE_GITHUB_REPO_ID: string
  readonly VITE_GITHUB_DISCUSS_REP: string
  readonly VITE_GITHUB_DISCUSS_OWNER: string
  readonly VITE_GITHUB_DISCUSS_TYPE_ID: string
  // 你可以继续加更多
  // readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
