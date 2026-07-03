import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import dotenv from 'dotenv'
import { ProxyAgent, fetch } from 'undici'
import { getSdk } from 'blog/.vitepress/utils/github/graphql/github'
import { GraphQLClient } from 'graphql-request'

// 加载环境变量
const mode = process.env.NODE_ENV || 'development'
dotenv.config({
  path: path.resolve(process.cwd(), `./blog/.env.${mode}`),
})

async function createGithubClient(token: string, proxyUrl?: string) {
  const customFetch: typeof fetch = proxyUrl
    ? (((input: URL | RequestInfo, init?: RequestInit) => {
        const undiciInit = {
          ...init,
          dispatcher: new ProxyAgent(proxyUrl),
        }
        return fetch(input as string | URL, undiciInit as any) as unknown as Promise<Response>
      }) as typeof fetch)
    : fetch

  return new GraphQLClient('https://api.github.com/graphql', {
    fetch: customFetch,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

async function main() {
  const token = process.env.GITHUB_TOKEN || ''
  const proxyUrl = process.env.Local === '1' ? process.env.VITE_GITHUB_PROXY : undefined
  const client = await createGithubClient(token, proxyUrl)
  const sdk = getSdk(client)

  // 读取所有 Markdown 文件
  const postsDir = path.resolve(process.cwd(), 'blog/posts')
  const files = await fs.readdir(postsDir, { recursive: true })

  for (const file of files) {
    if (!file.endsWith('.md')) continue

    const filePath = path.join(postsDir, file)
    const raw = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(raw)

    // 跳过已有讨论或不需要讨论的文章
    if (data.discussion != null || !data.title || data.publish === false) continue

    console.log(`创建讨论：${data.title}`)

    try {
      const url = `https://mqnu00.github.io/blog/${file.replace('.md', '.html')}`
      const res = await sdk.CreateDiscussion({
        repositoryId: process.env.VITE_GITHUB_REPO_ID!,
        title: data.title,
        body: url,
        categoryId: process.env.VITE_GITHUB_DISCUSS_TYPE_ID!,
      })

      if (res.createDiscussion?.discussion) {
        data.discussion = res.createDiscussion.discussion
        const newContent = matter.stringify(content, data)
        await fs.writeFile(filePath, newContent, 'utf-8')
        console.log(`✓ 创建成功：${data.title}`)
      }
    } catch (error) {
      console.error(`✗ 创建失败：${data.title}`, error)
    }
  }
}

main()
