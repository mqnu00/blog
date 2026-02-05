import 'vitepress'

declare module 'vitepress' {
  interface PageData {
    git?: {
      updated?: string
      history?: Array<{
        sha: string
        author: string
        date: string
        message: string
        url: string
      }>
    }
  }
}
