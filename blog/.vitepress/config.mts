import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blog/',
  title: "广习习的博客",
  description: "分享技术与生活的个人博客",
  lastUpdated: true,
  vite: {
    server: {
      host: '0.0.0.0'
    }
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
