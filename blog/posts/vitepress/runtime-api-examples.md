---
title: VitePress运行时API详解
date: 2025-01-18T00:00:00.000Z
author: 广习习
tags:
  - 技术分享
  - VitePress
  - API
outline: deep
url: 'https://mqnu00.github.io/blog/posts/vitepress/runtime-api-examples.html'
discussion:
  id: D_kwDOQdT3Qc4Alc3u
  number: 62
  title: VitePress运行时API详解
  url: 'https://github.com/mqnu00/blog/discussions/62'
  createdAt: '2026-04-03T05:22:56Z'
---

# VitePress运行时API详解

本文将详细介绍VitePress提供的运行时API，这些API可以帮助我们更好地控制页面行为和获取站点数据。

## useData() API

`useData()` 是VitePress提供的主要运行时API，可用于访问当前页面的站点、主题和页面数据。它在 `.md` 和 `.vue` 文件中都能正常工作：

```md
<script setup>
import { useData } from 'vitepress'

const { theme, page, frontmatter } = useData()
</script>

## 结果

### 主题数据
<pre>{{ theme }}</pre>

### 页面数据
<pre>{{ page }}</pre>

### 页面Frontmatter
<pre>{{ frontmatter }}</pre>
```

<script setup>
import { useData } from 'vitepress'

const { site, theme, page, frontmatter } = useData()
</script>

## 实际结果

### 主题数据
<pre>{{ theme }}</pre>

### 页面数据
<pre>{{ page }}</pre>

### 页面Frontmatter
<pre>{{ frontmatter }}</pre>

## 应用场景

`useData()` API可以用于：

- 根据站点配置动态渲染内容
- 访问页面级的元数据
- 在自定义组件中访问VitePress的内部数据

更多运行时API的详细信息，请查看 [官方文档](https://vitepress.dev/reference/runtime-api#usedata)。
