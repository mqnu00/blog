---
title: 统一白天和黑夜主题
date: '2026-05-13 15:49'
author: 广习习
tags:
  - theme
url: >-
  https://mqnu00.github.io/blog/posts/vitepress/unified-theme-for-day-and-night.html
discussion:
  id: D_kwDOQdT3Qc4AmXIm
  number: 103
  title: 统一白天和黑夜主题
  url: 'https://github.com/mqnu00/blog/discussions/103'
  createdAt: '2026-05-13T08:29:50Z'
---

# 存在问题

vitepress 切换白天和黑夜主题，在 vue 文件想要感知到，可以通过以下代码

```ts
import { useData } from "vitepress";

const { isDark } = useData();
```
naive-ui 设置主题时，也要监视 `isDark` 实现主题切换。

但是存在问题：必须确认已经在浏览器环境了，才能获取到 `isDark` 环境变量

# 切换 naive-ui 主题

naive-ui 本身自带 白天主题和黑夜主题

```ts
import {darkTheme} from "naive-ui";
const theme = computed(() => {
  if (isClient.value) {
    return isDark.value ? darkTheme : undefined;
  }
  return null;
});
```

# 对于自定义的颜色想要切换

```ts
const cssVars = computed(() => {
  if (isClient.value) {
    return {
      "--hint-bg-color": isDark.value
        ? "rgb(91, 91, 91)"
        : "rgb(233, 233, 238)",
      "--discuss-bg-color": isDark.value
        ? "rgb(0, 0, 0)"
        : "rgb(255, 255, 255)",
      "--hint-content-bg-hover": isDark.value
        ? "rgb(95, 95, 95)"
        : "rgb(233, 233, 238)",
    };
  }
  return null;
});
```
