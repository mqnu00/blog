---
title: 基于github的discussion为博客添加评论
date: '2026-04-09 16:16'
author: 广习习
tags:
  - github discussion
  - ouath
  - graphql
url: >-
  https://mqnu00.github.io/blog/posts/vitepress/blog-comment-by-github-discussion.html
discussion:
  id: D_kwDOQdT3Qc4AlvPk
  number: 85
  title: 基于github的discussion为博客添加评论
  url: 'https://github.com/mqnu00/blog/discussions/85'
  createdAt: '2026-04-16T06:42:12Z'
---

# 前期调研

## 参考已有的项目

实际上这样想法已经有人实现，并且已封装成简单配置即可使用的依赖，比如 [giscus](https://github.com/giscus/giscus)。

但是分析了相关功能，其中一个功能 `可以不为文章创建 discussion，等到有人评论再创建 discussion` 让我感到疑惑。

因为使用的是静态网页，并且想要创建 `github discussion` 是需要 `discussion id` 和 `access_token` 去请求 API 的。ID 不可能说有人创建评论就重新构建静态网页然后重新写入；token 也不建议保存在静态网页，因为不论怎么混淆也是能找到的。当然 gisgus 也不是把 token 保存在前端，而是走他们自己的 `github bot` 帮你创建评论，而它讨论的 API 是可以重复调用的，我有提 [重复创建讨论](https://github.com/giscus/giscus/issues/1702) 询问了一下，确实理解是设计需要。

因为不希望自己项目的评论区随地大小便，所以我决定自己写评论模块。

## 查看 github graphql 和 oauth api 

### oauth api

由于是静态网页，纯前端项目，我开始寻找有没有无需后端就能通过 oauth 并且 github 支持的协议。当然一开始找到了，是 [`PKCE`](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/) 。

但是尝试跑通失败，最重要的一点是 github 验证不支持跨域，必须要有后端去转发请求。那这还不如正常的去走 ouath 呢。

正常走 oauth 是：

```text
┌─────────┐      (1) 请求授权 (scope, client_id等)       ┌─────────────┐
│         │ ─────────────────────────────────────────> │             │
│  前端    │                                            │   GitHub    │
│ (浏览器) │ <───────────────────────────────────────── │   服务器     │
│         │      (2) 重定向到github的用户登录并授权页面     │             │
└─────────┘                                            └─────────────┘
     │                                                       │
     │ (3) 重定向回前端并返回 code                              │
     │ <─────────────────────────────────────────────────────┘
     │
     │ (4) 传递 code 
     ▼
┌─────────┐                                            ┌─────────────┐
│         │      (5) 发送请求 (code + client_secret)    |			  |
│         │				client_secret不能泄露			|			  |
│  后端    │ ─────────────────────────────────────────> │   GitHub    │
│ (我们的) │                                            │   服务器     │
│  服务    │ <───────────────────────────────────────── │             │
│         │      (6) 返回 access_token                  │             │
└─────────┘                                            └─────────────┘
     │
     │ (7) 返回 access_token
     ▼
┌─────────┐
│  前端    │
└─────────┘
```

### graphql

请求数据，请求参数类似于 sql 语句，无论请求什么，请求对象固定为同一个网址，很有意思的一个设计思路。

详细信息参考 [使用 GraphQL API 进行讨论](https://docs.github.com/zh/graphql/guides/using-the-graphql-api-for-discussions)

## 后端选择

选择了 cloudflare 免费的 worker

# 具体实现

## 固定文章对应的讨论

用户第一次评论时再创建文章对应的讨论，这个功能虽然好，但是很麻烦。

因此选择另一个方法：每有一篇新文章，就自动创建一个对应的讨论。这个写在了 vitepress 构建过程中。

```ts
async transformPageData(pageData) {
    var baseUrl = 'https://mqnu00.github.io/blog'
    const githubPath = '/blog/' + pageData.filePath

    pageData.url = `${baseUrl}/${pageData.filePath.replace('.md', '.html')}`
    //   配置讨论
    if(pageData.frontmatter.discussion == null && pageData.title != null && pageData.title !== '') {
      console.log(`创建讨论： ${pageData.title}`)
      const discuss = await discussClient.createDiscussion(
          pageData.title,
          pageData.url,
          process.env.VITE_GITHUB_DISCUSS_TYPE_ID
      )
      if (discuss) {
        pageData.frontmatter.discussion = discuss
      } else {
        throw new Error("创建讨论失败")
      }
    }

    // -------------------------
    // 写回 Markdown 文件
    // -------------------------
    const mdPath = path.resolve(process.cwd(), 'blog', pageData.filePath)
    const raw = await fs.readFile(mdPath, 'utf-8')

    const parsed = matter(raw)

    // 写入 frontmatter
    parsed.data.url = pageData.url
    if (pageData.frontmatter.discussion != null) parsed.data.discussion = pageData.frontmatter.discussion

    // 重新生成 md 内容
    const newContent = matter.stringify(parsed.content, parsed.data)

    // 写回文件
    await fs.writeFile(mdPath, newContent, 'utf-8')
  },
```

这里要注意重新写入数据会重新触发该文章的从 md 到 html 的构建过程。

## graphql sdk

用graphql请求数据，实际是发送一串字符串出去，不好维护 graphql语句。

于是考虑单独创建 graphql文件，有类型提示，也可以像 mssql ssms一样直接执行语句。然后通过 codegen 生成 查询的 sdk。

