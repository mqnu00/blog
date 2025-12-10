import { defineConfig } from 'vitepress'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import type {MarkdownRenderer} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blog/',
  title: "广习习的博客",
  description: "分享技术与生活的个人博客",
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
        return `<ClientOnly><n-image src="${src}" alt="${alt}"/></ClientOnly>`
      }
    }
  },
  vue: {
    template: {
      transformAssetUrls: {
        'n-image': ['src']
      }
    }
  },
  vite: {
    server: {
      host: '0.0.0.0'
    },
    plugins: [
      // 自动导入 Vue API（ref、computed 等）
      AutoImport({
        imports: ['vue'],
        resolvers: [NaiveUiResolver()],
        dts: '.vitepress/auto-imports.d.ts',
      }),
      // 自动导入 Naive UI 组件
      Components({
        resolvers: [NaiveUiResolver()],
        dts: '.vitepress/components.d.ts',
      }),
    ],
    optimizeDeps: {
      include: ['naive-ui', 'vueuc'],                  // 防止预构建再拿 lib/
    },
    ssr: {
      // SSR 阶段也强制 ESM，不再 external 它们
      noExternal: ['naive-ui', 'vueuc'],
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/blog/favicon.ico' }],
    ['meta', { name: 'author', content: '广习习' }],
    ['meta', { name: 'keywords', content: '技术博客, Vue, VitePress, 前端开发, JavaScript' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '广习习的博客' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
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
            return  md.render(`# ${title ? title + ' > ' : ''} tags: ${tags.join(' ')}`) + html
          }
          return html
        }
      }
    },
    outline: {
      level: [1, 6], // 显示 h2 和 h3 标题
      label: '目录'   // 目录标题文字
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/posts/' },
      { text: '关于', link: '/about' }
    ],

    sidebar: {
      '/posts/': [
          {
            text: '前端',
            collapsed: false,
            items: [
              { text: '在win11开发兼容ie的网页', link: '/posts/frontend/develop-ie-win11/develop-ie-win11' },
            ]
          },
          {
            text: 'vitepress示例',
            collapsed: true,
            items: [
              {text: '给文章添加tag并支持搜索索引', link: '/posts/vitepress/article-tag'},
              { text: '我的第一篇博客', link: '/posts/vitepress/my-first-post' },
              { text: 'VitePress使用技巧', link: '/posts/vitepress/vitepress-tips' },
              { text: 'VitePress中的Markdown扩展功能', link: '/posts/vitepress/markdown-extensions' },
              { text: 'VitePress运行时API详解', link: '/posts/vitepress/runtime-api-examples' }
            ]
          },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present 广习习'
    }
  }
})
