import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
const POSTS_DIR = path.resolve(__dirname, '../../', 'posts')

declare type SidebarItem = {
  date?: number
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}
const CATEGORY_LABELS: Record<string, string> = {
  frontend: '前端',
  summary: '总结',
  vitepress: 'vitepress示例',
  ops: '运维',
  ai: 'AI',
}

function parseMD(filePath: string): { title: string; date: number | null } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(raw)
  const res = {
    title: '',
    date: null as number | null,
  }
  // console.log(data.title, data.date)
  if (typeof data.title === 'string' && data.title.trim()) {
    res['title'] = data.title.trim()
  }
  if (typeof data.date === 'string' && data.date.trim()) {
    const timestamp = Date.parse(data.date.trim().replace(' ', 'T'))
    res['date'] = Number.isFinite(timestamp) ? timestamp : null
  }

  // console.log(res)

  return res
}

function parseMeta(filePath: string): { title: string; date: number | null } {
  return parseMD(filePath)
}

function buildSidebarItems(dirPath: string) {
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1
      }
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  const res: Array<{
    date: number
    text: string
    link?: string
    category?: string
    collapsed?: boolean
    items?: ReturnType<typeof buildSidebarItems>
  }> = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      res.push(...buildSidebarItems(path.join(dirPath, entry.name)))
    } else {
      if (entry.name.endsWith('.md')) {
        const { title, date } = parseMeta(path.join(dirPath, entry.name))
        if (!title) continue
        Object.entries(CATEGORY_LABELS).some(([key, label]) => {
          if (entry.parentPath.includes(key)) {
            // 找到 'blog' 在路径中的位置
            const parts = entry.parentPath.split(path.sep)
            const blogIndex = parts.findIndex((part) => part === 'posts')
            if (blogIndex !== -1) {
              const relativePath = path.join(...parts.slice(blogIndex))
              // console.log('/' + relativePath) // 确保以 / 开头
              res.push({
                date: date || 0,
                text: title,
                category: CATEGORY_LABELS[key] || '其他',
                link: `${'/' + relativePath}/${entry.name.replace('.md', '.html')}`,
              })
            }
          }
        })
      }
    }
  }
  return res
}

export function generateSidebar(): Record<string, SidebarItem[]> {
  const res = buildSidebarItems(POSTS_DIR)
  console.log('res', res)
  const sidebarList: SidebarItem[] = []
  for (const { text, link, category, date } of res) {
    const existingCategory = sidebarList.find((item) => item.text === category)
    if (existingCategory) {
      existingCategory.items = existingCategory.items || []
      existingCategory.items.push({ text, link, date })
    } else {
      sidebarList.push({
        text: category || '其他',
        collapsed: true,
        items: [{ text, link, date }],
      })
    }
  }
  sidebarList.forEach((category) => {
    category.items?.sort((a, b) => {
      return (a.date || 0) > (b.date || 0) ? -1 : 1
    })
  })
  sidebarList.forEach((category) => {
    console.log(category.text)
    category.items?.forEach((artical) => {
      console.log(artical.text, artical.date)
    })
  })
  console.log(sidebarList)
  return {
    '/posts/': sidebarList,
  }
}
