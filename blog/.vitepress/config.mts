import { defineConfig } from 'vitepress'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blog/',
  title: "广习习的博客",
  description: "分享技术与生活的个人博客",
  lastUpdated: true,
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
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/posts/' },
      { text: '关于', link: '/about' }
    ],

    sidebar: {
      '/posts/': [
          {
          text: 'vitepress示例',
          collapsed: true,
          items: [
            { text: '我的第一篇博客', link: '/posts/vitepress/my-first-post' },
            { text: 'VitePress使用技巧', link: '/posts/vitepress/vitepress-tips' },
            { text: 'VitePress中的Markdown扩展功能', link: '/posts/vitepress/markdown-extensions' },
            { text: 'VitePress运行时API详解', link: '/posts/vitepress/runtime-api-examples' }
          ]
        }
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
