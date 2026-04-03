import 'gray-matter'
import {CreateDiscussionMutation} from "@blog/.vitepress/utils/github/graphql/github";

declare module 'gray-matter' {
    interface GrayMatterFile<I extends Input> {
        // 覆盖 data 的类型
        data: Frontmatter
    }
}

export interface Frontmatter {
    title?: string
    date?: string
    description?: string
    publish?: boolean
    tags?: String[]
    discussion?: CreateDiscussionMutation
}
