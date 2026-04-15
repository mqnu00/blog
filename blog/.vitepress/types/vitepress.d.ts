import 'vitepress'
import {CreateDiscussionMutation} from "@blog/.vitepress/utils/github/graphql/github";

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
    },
    url?: string,
    frontmatter: {
      discussion?: CreateDiscussionMutation
      
    }
  }
}
