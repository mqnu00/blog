---
title: 在win11开发兼容ie的网页
date: 2025-11-27 11:29
author: 广习习
tags: [ie, 兼容]
---

# 目标是什么

这里指的是语法的兼容，目标版本是ie8。我平时语法用到的比如

- `Arrow functions () => {}` 
- `Optional chaining operator (?.)`

![](./pic/browser-surport.png)

可以在 [语法搜索](https://caniuse.com/?search=%3F.) 查看语法兼容情况

# 开发环境搭建

在 win11 系统，目前来说最简单的方法是使用 `edge` 的 `ie兼容模式` ，缺点是不确定使用的是什么版本的。

有一个方法可以调出ie的原生软件页面。可以参考 [Win11 打开 IE 浏览器 - 简书](https://www.jianshu.com/p/b9e129ec349b)

总结一下：

- 在 edge 允许启用 ie兼容模式
- 创建 vbs 脚本 `CreateObject("InternetExplorer.Application").Visible=true`
- 打开 ie 浏览器 F12，选择 ie8 仿真模式

![ie浏览器 仿真模式设置](./pic/ie.png)

## IE浏览器问题

1. [升级win11后,IE调试工具-网络-网络集合代理无法启动](https://learn.microsoft.com/zh-cn/answers/questions/5560234/win11-ie)，[win11 24H2删除了老的依赖，参考链接评论](https://juejin.cn/post/7447807675273347082)
