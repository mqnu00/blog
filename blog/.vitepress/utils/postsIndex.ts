import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Plugin } from 'vite'

/**
 * 分类目录名 -> 展示名称。
 * 顺序决定了 posts/index.md 中「分类」小节的顺序，与侧边栏保持一致。
 * 新增分类目录时必须在这里登记，否则该目录下的文章不会出现在列表与侧边栏中。
 */
export const CATEGORY_LABELS: Record<string, string> = {
  frontend: '前端',
  summary: '总结',
  vitepress: 'vitepress 博客搭建记录',
  ops: '运维',
  ai: 'AI',
}

/** 「最新文章」小节展示的篇数 */
export const LATEST_COUNT = 3
/** 每个分类展示的篇数 */
export const PER_CATEGORY_COUNT = 3

const GENERATED_NOTICE =
  '<!-- 该文件由 blog/.vitepress/utils/postsIndex.ts 在构建时自动生成，请勿手动编辑 -->'

export type PostItem = {
  title: string
  /** 相对 blog/posts 的 posix 路径，如 'vitepress/article-tag.md' */
  relativePath: string
  /** 相对 posts/index.md 的链接，如 './vitepress/article-tag.md' */
  link: string
  /** 毫秒时间戳，无法解析时为 null（视为最旧） */
  date: number | null
  categoryKey: string
  categoryLabel: string
}

export type PostsIndexOptions = {
  /** blog/posts 目录 */
  postsDir: string
  /** blog/posts/index.md */
  indexPath: string
  latestCount?: number
  perCategoryCount?: number
  /** 为 false 时只渲染不写文件（默认 true） */
  write?: boolean
}

/** 兼容 frontmatter 里的 'YYYY-MM-DD HH:mm' 字符串与 YAML 解析出的 Date 对象 */
export function parsePostDate(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : null
  }
  if (typeof value === 'string' && value.trim()) {
    const timestamp = Date.parse(value.trim().replace(' ', 'T'))
    return Number.isFinite(timestamp) ? timestamp : null
  }
  return null
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

/** 递归收集目录下所有 markdown 文件，跳过 . 开头的条目 */
function walkMarkdownFiles(dirPath: string): Array<string> {
  const files: Array<string> = []
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(entryPath))
    } else if (entry.name.endsWith('.md')) {
      files.push(entryPath)
    }
  }
  return files
}

/** 读取单篇文章的展示信息，不可展示（解析失败 / 无标题 / publish 为 false）时返回 null */
function readPostMeta(
  filePath: string,
  relativePath: string,
): Omit<PostItem, 'relativePath' | 'link' | 'categoryKey' | 'categoryLabel'> | null {
  let data
  try {
    data = matter(fs.readFileSync(filePath, 'utf-8')).data
  } catch (error) {
    console.warn(`[posts-index] frontmatter 解析失败，已跳过 ${relativePath}`, error)
    return null
  }

  const title = typeof data.title === 'string' ? data.title.trim() : ''
  if (!title) return null
  if (data.publish === false) return null

  return { title, date: parsePostDate(data.date) }
}

/** 收集 blog/posts 下所有可展示的文章，按日期倒序排列 */
export function collectPosts(options: { postsDir: string }): Array<PostItem> {
  const posts: Array<PostItem> = []

  for (const filePath of walkMarkdownFiles(options.postsDir)) {
    const relativePath = toPosix(path.relative(options.postsDir, filePath))
    const segments = relativePath.split('/')
    // posts 根目录下的文件（例如 index.md 自身）不属于任何分类
    if (segments.length < 2) continue

    const categoryKey = segments[0]
    const categoryLabel = CATEGORY_LABELS[categoryKey]
    if (!categoryLabel) {
      console.warn(`[posts-index] 未识别的分类目录 "${categoryKey}"，已跳过 ${relativePath}`)
      continue
    }

    const meta = readPostMeta(filePath, relativePath)
    if (!meta) continue

    posts.push({
      ...meta,
      relativePath,
      link: `./${relativePath}`,
      categoryKey,
      categoryLabel,
    })
  }

  posts.sort((a, b) => {
    const diff = (b.date ?? 0) - (a.date ?? 0)
    return diff !== 0 ? diff : a.relativePath.localeCompare(b.relativePath, 'zh-CN')
  })

  return posts
}

/** 转义链接文字中会被 markdown 误解析的字符 */
function escapeLinkText(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/[[\]]/g, '\\$&')
}

/** 路径含空格或括号时用 <...> 包裹链接目标 */
function escapeLinkTarget(relativePath: string): string {
  const target = `./${relativePath}`
  return /[\s()]/.test(relativePath) ? `<${target}>` : target
}

/** 渲染 posts/index.md 的正文 */
export function renderPostsIndex(
  posts: Array<PostItem>,
  options: { latestCount?: number; perCategoryCount?: number } = {},
): string {
  const latestCount = options.latestCount ?? LATEST_COUNT
  const perCategoryCount = options.perCategoryCount ?? PER_CATEGORY_COUNT

  const lines: Array<string> = [GENERATED_NOTICE, '# 博客文章', '', '## 最新文章', '']

  const latest = posts.slice(0, latestCount)
  if (latest.length === 0) {
    lines.push('暂无文章')
  } else {
    for (const post of latest) {
      lines.push(`- [${escapeLinkText(post.title)}](${escapeLinkTarget(post.relativePath)})`)
    }
  }

  const categories = Object.keys(CATEGORY_LABELS).filter((key) =>
    posts.some((post) => post.categoryKey === key),
  )

  if (categories.length > 0) {
    lines.push('', '## 分类', '')
    for (const key of categories) {
      const items = posts.filter((post) => post.categoryKey === key).slice(0, perCategoryCount)
      if (items.length === 0) continue

      lines.push(`### ${CATEGORY_LABELS[key]}`, '')
      for (const post of items) {
        lines.push(`- [${escapeLinkText(post.title)}](${escapeLinkTarget(post.relativePath)})`)
      }
      lines.push('')
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

/**
 * 生成 posts/index.md：保留原有 frontmatter，仅替换正文。
 * 内容与磁盘一致时不写文件，避免 dev 下的重复刷新。
 */
export function generatePostsIndex(options: PostsIndexOptions): {
  changed: boolean
  markdown: string
} {
  const { postsDir, indexPath, write = true } = options
  const posts = collectPosts({ postsDir })
  const body = renderPostsIndex(posts, options)

  const existing = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : null
  // 文件不存在时直接写入正文，url 等 frontmatter 由 config 的 transformPageData 补齐
  const next = existing === null ? body : matter.stringify(body, matter(existing).data)
  const displayPath = path.relative(process.cwd(), indexPath)

  if (existing === next) {
    console.log(`[posts-index] ${displayPath} 无需更新`)
    return { changed: false, markdown: body }
  }

  if (write) {
    fs.writeFileSync(indexPath, next, 'utf-8')
    const categoryCount = new Set(posts.map((post) => post.categoryKey)).size
    const latestCount = Math.min(options.latestCount ?? LATEST_COUNT, posts.length)
    console.log(
      `[posts-index] 已生成 ${displayPath}：最新文章 ${latestCount} 篇 / 分类 ${categoryCount} 个 / 共 ${posts.length} 篇`,
    )
  }

  return { changed: true, markdown: body }
}

/**
 * dev 模式下监听 posts 目录，文章增删改后重新生成 posts/index.md。
 * 生成是幂等的，且忽略 index.md 自身，因此不会形成刷新循环。
 */
export function postsIndexPlugin(options: { postsDir: string; indexPath: string }): Plugin {
  return {
    name: 'posts-index-dev',
    apply: 'serve',
    configureServer(server) {
      const isPostFile = (file: string) => {
        const relativePath = path.relative(options.postsDir, file)
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return false
        return relativePath.endsWith('.md') && path.basename(file) !== 'index.md'
      }

      let timer: ReturnType<typeof setTimeout> | undefined
      const schedule = () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          try {
            const { changed } = generatePostsIndex(options)
            if (changed) server.ws.send({ type: 'full-reload' })
          } catch (error) {
            console.error('[posts-index] 重新生成失败', error)
          }
        }, 150)
      }

      const onChange = (file: string) => {
        if (isPostFile(file)) schedule()
      }
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
      server.watcher.on('change', onChange)
    },
  }
}
