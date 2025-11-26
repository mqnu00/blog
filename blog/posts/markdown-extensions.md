---
title: VitePress中的Markdown扩展功能
date: 2025-01-17
author: 广习习
tags: [技术分享, Markdown, VitePress]
---

# VitePress中的Markdown扩展功能

在使用VitePress搭建博客时，了解其内置的Markdown扩展功能是非常有帮助的。本文将详细介绍一些常用的扩展功能。

## 语法高亮

VitePress提供由 [Shiki](https://github.com/shikijs/shiki) 驱动的语法高亮，还具有行高亮等附加功能：

**示例代码**

````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

**Output**

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

## Custom Containers

**Input**

```md
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::
```

**Output**

::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::

## More

Check out the documentation for the [full list of markdown extensions](https://vitepress.dev/guide/markdown).
