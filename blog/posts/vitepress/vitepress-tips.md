---
title: VitePress使用技巧
date: 2025-01-16T00:00:00.000Z
author: 广习习
tags:
  - 技术分享
  - VitePress
  - Markdown
url: 'https://mqnu00.github.io/blog/posts/vitepress/vitepress-tips.html'
discussion:
  id: D_kwDOQdT3Qc4Alc3v
  number: 63
  title: VitePress使用技巧
  url: 'https://github.com/mqnu00/blog/discussions/63'
  createdAt: '2026-04-03T05:23:01Z'
---

# VitePress使用技巧

在这篇文章中，我想分享一些使用VitePress的实用技巧。

## Markdown扩展功能

VitePress提供了丰富的Markdown扩展功能：

### 代码块高亮
````
```js
export default {
  name: "MyComponent",
  data() {
    return {
      msg: "Hello VitePress!"
    }
  }
}
```
````

### 自定义容器
::: tip
这是一个提示信息。
:::

::: warning
这是一个警告信息。
:::

### 代码行高亮
````
```js{4}
export default {
  data() {
    return {
      msg: "Highlighted!"
    }
  }
}
```
````

## 主题定制

VitePress允许你通过CSS变量来定制主题样式，这使得个性化变得非常简单。

希望这些技巧对你有帮助！

