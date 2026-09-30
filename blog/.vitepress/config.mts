import type { MarkdownRenderer } from 'vitepress'
import { defineConfig } from 'vitepress'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { Feed } from 'feed'
import fs from 'fs/promises'
import path, { resolve } from 'node:path'
import matter from 'gray-matter'
import { load, type CheerioAPI } from 'cheerio'
import { getGithubHistory } from './utils/github/gitHistory'
import { generateSidebar } from './utils/sideCondig'
import { generatePostsIndex, postsIndexPlugin } from './utils/postsIndex'
import dotenv from 'dotenv'
import moment from 'moment'

const mode = process.env.NODE_ENV_TEST === 'true' ? 'test' : process.env.NODE_ENV || 'development'
console.log(mode)
dotenv.config({
  path: path.resolve(process.cwd(), `./blog/.env.${mode}`),
})

const POSTS_DIR = path.resolve(__dirname, '..', 'posts')
const POSTS_INDEX_PATH = path.join(POSTS_DIR, 'index.md')

// 版权年份自动跟随构建时的当前年份，避免每年手动更新
const SITE_START_YEAR = 2025
const COPYRIGHT_YEAR = new Date().getFullYear()
const COPYRIGHT_YEARS =
  COPYRIGHT_YEAR > SITE_START_YEAR ? `${SITE_START_YEAR}-${COPYRIGHT_YEAR}` : `${SITE_START_YEAR}`

// RSS 中使用的站点地址（与 base 保持一致）
const SITE_ORIGIN = 'https://mqnu00.github.io'
const SITE_BASE = '/blog'
const SITE_URL = `${SITE_ORIGIN}${SITE_BASE}/`

// markdown 图片规则注入的隐藏标记属性名。
// VitePress 的 ClientOnly 在 SSG 阶段渲染为 null，图片不会进入构建产物 HTML，
// 因此用这个标记把图片的源路径带进产物，再由 buildEnd 还原成 RSS 可用的 <img>。
const RSS_IMAGE_MARKER = 'data-rss-src'
const RSS_IMAGE_ALT_MARKER = 'data-rss-alt'

// 转义 HTML 属性值，避免 alt 中的引号破坏标签结构
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 扫描构建产物的 assets 目录，建立「源文件名 → 已带 hash 的公开地址」映射。
 *
 * Vite 会把 markdown 中经 n-image 引用的图片产出为 `assets/<name>.<hash><ext>`。
 * 由于构建产物 HTML 里没有任何图片引用（原因见 RSS_IMAGE_MARKER），
 * 只能反过来用源文件名做匹配。
 */
async function buildAssetUrlMap(outDir: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const dup = new Set<string>()
  const assetsDir = path.join(outDir, 'assets')

  let files: string[]
  try {
    files = await fs.readdir(assetsDir)
  } catch {
    return map
  }

  for (const file of files) {
    // 形如 ie.ClQA5gU0.png → 源文件名 ie.png
    const matched = file.match(/^(.*)\.[A-Za-z0-9_-]{8}(\.[A-Za-z0-9]+)$/)
    if (!matched) continue
    const sourceName = (matched[1] + matched[2]).toLowerCase()
    const url = `${SITE_ORIGIN}${SITE_BASE}/assets/${file}`
    if (map.has(sourceName)) dup.add(sourceName)
    else map.set(sourceName, url)
  }

  if (dup.size > 0) {
    console.warn(
      `[rss] 以下图片重名，RSS 中的图片地址可能指向错误文件，请改用唯一文件名：${[...dup].join(', ')}`,
    )
  }
  return map
}

/** 把 markdown 中的图片路径解析为 RSS 中可用的绝对地址 */
function resolveRssImageUrl(src: string, postRelDir: string, assets: Map<string, string>): string {
  if (!src) return ''
  // 外部图片直接使用
  if (/^https?:\/\//i.test(src)) return src
  // 站点绝对路径，补上域名即可
  if (src.startsWith('/')) return `${SITE_ORIGIN}${src}`

  // 相对路径：先解析成相对 blog/ 的路径，再用文件名到产物 assets 里查 hash 后的地址
  const relPath = path.posix.normalize(path.posix.join(postRelDir, src))
  const sourceName = path.posix.basename(relPath).toLowerCase()

  const assetUrl = assets.get(sourceName)
  if (assetUrl) return assetUrl

  // 兜底：按原始相对位置拼接（可能 404，用于提醒遗漏）
  console.warn(`[rss] 未在构建产物中找到图片 ${src}（${relPath}），RSS 中该图可能无法显示`)
  return `${SITE_ORIGIN}${SITE_BASE}/${relPath}`
}

// 代码块卡片样式：阅读器不会加载站点样式表，这里把关键样式内联回来
const CODE_BLOCK_STYLE =
  'background-color:#f6f8fa;border-radius:6px;padding:12px 16px;overflow-x:auto;font-size:13px;line-height:1.6'
const LANG_LABEL_STYLE = 'color:#6a737d;font-size:12px'
const CUSTOM_BLOCK_STYLES: Record<string, string> = {
  tip: 'border-color:#42b983;background-color:#f3f9f5',
  info: 'border-color:#3b82f6;background-color:#f3f7fb',
  warning: 'border-color:#e7c000;background-color:#fff8e6',
  danger: 'border-color:#cc0000;background-color:#fdf3f3',
}

/**
 * 把构建产物里的正文清洗成适合 RSS 的 HTML。
 *
 * 阅读器不会加载站点的样式表（实测 feed 中既没有 <style> 也没有 stylesheet 链接），
 * 所以正文里留下的 VitePress class 全部无效。这里做四件事：
 *
 * 1. 把 Shiki 的颜色变量解析成真实的 color。
 *    产物里是 `--shiki-light:#X;--shiki-dark:#Y`，而 `--shiki-light` 只是变量声明，
 *    必须靠站点 CSS 的 `color: var(--shiki-light)` 才生效，阅读器拿不到那段 CSS。
 *    RSS 没有暗色模式概念，取 light 一套即可，顺带省掉 `--shiki-dark` 这部分死数据。
 * 2. 内联代码块与提示框的关键样式，让它们在没有 CSS 的阅读器里也像卡片。
 * 3. 去掉纯噪声：class、标题旁的空锚点、tabindex。
 * 4. 把图片标记还原成真正的 <img>。
 */
function cleanRssContent(
  $: CheerioAPI,
  context: { postRelDir: string; assets: Map<string, string> },
): string {
  const doc = $('.vp-doc')

  // 1. Shiki 双主题色值 → 单主题 color
  doc.find('[style]').each((_, el) => {
    const node = $(el)
    const style = node.attr('style') || ''
    const light = style.match(/--shiki-light:\s*([^;]+)/)
    const lightBg = style.match(/--shiki-light-bg:\s*([^;]+)/)

    const inlined: string[] = []
    if (light) inlined.push(`color:${light[1].trim()}`)
    if (lightBg) inlined.push(`background-color:${lightBg[1].trim()}`)

    // 剩下的 style 都是 VitePress 的布局内部值（--vp-vh / display:flex 等），对阅读器无意义
    if (inlined.length > 0) node.attr('style', inlined.join(';'))
    else node.removeAttr('style')
  })

  // 2. 内联代码块与提示框样式（此时 class 还在，可以用它们做选择器）
  doc.find('pre.shiki').attr('style', CODE_BLOCK_STYLE)
  doc.find('span.lang').attr('style', LANG_LABEL_STYLE)
  doc.find('div.custom-block, details.custom-block').each((_, el) => {
    const node = $(el)
    const type = ['tip', 'info', 'warning', 'danger'].find((name) => node.hasClass(name))
    if (!type) return
    node.attr(
      'style',
      `border-left:4px solid;border-radius:4px;padding:8px 16px;${CUSTOM_BLOCK_STYLES[type]}`,
    )
    node.find('.custom-block-title').attr('style', 'font-weight:600;margin:8px 0')
  })

  // 3. 去掉纯噪声
  doc.find('button.copy').remove()
  // 标题旁的空锚点（内容是一个零宽字符），在阅读器里只会显示成奇怪的链接
  doc.find('a.header-anchor').remove()
  doc.find('[tabindex]').removeAttr('tabindex')
  // class 在阅读器里没有任何 CSS 可用，全部去掉
  doc.find('[class]').removeAttr('class')

  // 4. 还原图片
  doc.find(`[${RSS_IMAGE_MARKER}]`).each((_, el) => {
    const marker = $(el)
    const src = marker.attr(RSS_IMAGE_MARKER) || ''
    const alt = marker.attr(RSS_IMAGE_ALT_MARKER) || ''
    const imgUrl = resolveRssImageUrl(src, context.postRelDir, context.assets)
    marker.replaceWith(imgUrl ? `<img src="${imgUrl}" alt="${escapeAttr(alt)}">` : '')
  })

  return doc.html() || ''
}

// 构建/启动前根据 posts 目录重新生成博客文章列表页
try {
  generatePostsIndex({ postsDir: POSTS_DIR, indexPath: POSTS_INDEX_PATH })
} catch (error) {
  console.error('[posts-index] 生成失败，沿用现有 posts/index.md', error)
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blog/',
  title: '广习习的博客',
  description: '分享技术与生活的个人博客',
  markdown: {
    config: (md: MarkdownRenderer) => {
      // 保存默认的 image 渲染
      const defaultRender =
        md.renderer.rules.image ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options)
        }
      // 替换 img 渲染
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const src = token.attrGet('src')
        const alt = token.content || ''
        const title = token.attrGet('title') || ''

        // 这里替换成 n-image
        //
        // 注意：ClientOnly 在 SSG 阶段会渲染为 null（VitePress 的 ClientOnly 要等
        // onMounted 之后才渲染 slot），所以图片根本不会出现在构建产物的 HTML 里。
        // 而 RSS 正文正是从构建产物中提取的，于是订阅里完全没有图片。
        //
        // 这里额外注入一个隐藏标记，把图片的「源路径」带进构建产物。
        // 之所以用 span 而不是 <img>：裸 HTML 里的 src 不会被 Vite 处理（实测原样保留），
        // 真实资源地址由 buildEnd 扫描产物 assets 目录后还原（见 RSS_IMAGE_MARKER）。
        const marker =
          `<span hidden ${RSS_IMAGE_MARKER}="${escapeAttr(src)}"` +
          ` ${RSS_IMAGE_ALT_MARKER}="${escapeAttr(alt)}"></span>`

        return `${marker}<ClientOnly><n-image src="${src}" alt="${alt}"/></ClientOnly>`
      }
    },
  },
  async buildEnd(siteConfig) {
    const feed = new Feed({
      title: siteConfig.site.title,
      description: siteConfig.site.description,
      id: SITE_URL,
      link: SITE_URL,
      language: siteConfig.site.lang,
      copyright: `© ${COPYRIGHT_YEAR} 广习习`,
      image: `${SITE_ORIGIN}${SITE_BASE}/favicon.ico`,
    })

    const pageRoot = path.resolve(__dirname, '..')
    // 产物中带 hash 的图片地址表（用于还原 markdown 里的相对图片路径）
    const assetUrls = await buildAssetUrlMap(siteConfig.outDir)
    // 遍历所有页面
    for (const page of siteConfig.pages) {
      if (!page.startsWith('posts/')) continue

      const filePath = path.join(pageRoot, page)
      const file = await fs.readFile(filePath, 'utf-8')
      const { data } = matter(file)
      const htmlPath = path.join(siteConfig.outDir, page.replace('.md', '.html'))
      const html = await fs.readFile(htmlPath, 'utf-8')

      const $ = load(html)
      const content = cleanRssContent($, {
        postRelDir: path.posix.dirname(page),
        assets: assetUrls,
      })

      if (!data.title) continue
      if (data.publish === false) continue

      const url = `${SITE_ORIGIN}${SITE_BASE}/${page.replace('.md', '.html')}`
      const date = typeof data.date === 'string' ? data.date + '+0800' : data.date || new Date()
      console.log(date)
      console.log(moment(date, 'YYYY-MM-DD HH:mmZ').toDate())

      feed.addItem({
        title: data.title,
        id: url,
        link: url,
        description: data.description,
        content,
        date: moment(date, 'YYYY-MM-DD HH:mmZ').toDate(),
      })
    }

    const outDir = siteConfig.outDir
    const rss = feed.rss2()
    rss.matchAll(/<pubDate>(.*?)<\/pubDate>/g).forEach((match) => {
      console.log('RSS 中的 pubDate:', match[1])
    })
    await fs.writeFile(path.join(outDir, 'rss.xml'), rss, 'utf-8')
  },
  async transformPageData(pageData) {
    if (mode === 'test') return
    const githubPath = '/blog/' + pageData.filePath
    const history = await getGithubHistory({
      owner: 'mqnu00',
      repo: 'blog',
      filePath: githubPath,
      token: process.env.GITHUB_TOKEN,
    }).then((res) => {
      res.forEach((item) => {
        item.date = moment.utc(item.date).utcOffset(8).format('YYYY-MM-DD HH:mm:ss Z') ?? null
      })
      return res
    })

    pageData.git = {
      updated: history.length > 0 ? history[0].date : '',
      history,
    }

    pageData.url = `${SITE_ORIGIN}${SITE_BASE}/${pageData.filePath.replace('.md', '.html')}`

    // -------------------------
    // 写回 Markdown 文件
    // -------------------------
    const mdPath = path.resolve(process.cwd(), 'blog', pageData.filePath)
    const raw = await fs.readFile(mdPath, 'utf-8')

    const parsed = matter(raw)

    // 写入 frontmatter
    // parsed.data.git = pageData.git
    parsed.data.url = pageData.url
    if (pageData.frontmatter.discussion != null)
      parsed.data.discussion = pageData.frontmatter.discussion

    // 重新生成 md 内容
    const newContent = matter.stringify(parsed.content, parsed.data)

    // 写回文件
    await fs.writeFile(mdPath, newContent, 'utf-8')
  },
  vue: {
    template: {
      transformAssetUrls: {
        'n-image': ['src'],
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        '@blog': resolve(__dirname, '..'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      allowedHosts: ['mqnu00.github.io'],
    },
    plugins: [
      // dev 模式下文章增删改后重新生成 posts/index.md
      postsIndexPlugin({ postsDir: POSTS_DIR, indexPath: POSTS_INDEX_PATH }),
      // 自动导入 Vue API（ref、computed 等）
      AutoImport({
        imports: ['vue'],
        resolvers: [NaiveUiResolver()],
        dts: '.vitepress/auto-imports.d.ts',
        eslintrc: {
          enabled: true, // Default `false`
          filepath: './eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
          globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'writable' | 'off')
        },
      }),
      // 自动导入 Naive UI 组件
      Components({
        resolvers: [NaiveUiResolver()],
        dts: '.vitepress/components.d.ts',
      }),
    ],
    optimizeDeps: {
      include: ['naive-ui', 'vueuc'], // 防止预构建再拿 lib/
    },
    ssr: {
      // SSR 阶段也强制 ESM，不再 external 它们
      noExternal: ['naive-ui', 'vueuc'],
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/blog/favicon.ico' }],
    ['meta', { name: 'author', content: '广习习' }],
    [
      'meta',
      {
        name: 'keywords',
        content: '技术博客, Vue, VitePress, 前端开发, JavaScript',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '广习习的博客' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'local',
      options: {
        _render: (src, env, md) => {
          const html = md.render(src, env)
          if (env.frontmatter?.tags) {
            const tags = env.frontmatter.tags as Array<string>
            const title = env.frontmatter?.title as string | undefined

            // 插入到内容最前面，确保被索引
            return md.render(`# ${title ? title + ' > ' : ''} tags: ${tags.join(' ')}`) + html
          }
          return html
        },
      },
    },
    outline: {
      level: [1, 6], // 显示 h2 和 h3 标题
      label: '目录', // 目录标题文字
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/posts/' },
      { text: '关于', link: '/about/about' },
    ],

    sidebar: generateSidebar(),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mqnu00' },
      { icon: 'rss', link: '/blog/rss.xml' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © ${COPYRIGHT_YEARS} 广习习`,
    },

    docFooter: {
      prev: false,
      next: false,
    },
  },
})
