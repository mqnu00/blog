---
title: 给文章添加tag并支持搜索索引
date: 2025-12-10 15:19
author: 广习习
tags: [技术分享, VitePress, render]
---

# 添加TAG

文档的元数据可以通过`-- --`在文档开头标识。

类似于：
``` 
---
title: 如何给文章添加tag并支持被VitePress自带的本地搜索索引
date: 2025-12-10 15:19
author: 广习习
tags: [技术分享, VitePress]
---
```

vitepress 解析 md 转换成 html 的过程可以使用 Layout.vue 来自定义布局。

看下面的代码，解析 md 文件的元数据（frontmatter）并使用naive-ui 的 tag 组件显示。

这里的文章时间也需要手动更新，而不是根据 git 提交的时间。

``` html
<!-- Layout.vue -->
<template>
  <NConfigProvider >
    <!-- 保留默认主题的布局 -->
    <DefaultTheme.Layout>
      <!-- 在标题区域插入更新时间 -->
      <template #doc-before >
        <div style="margin-bottom: 30px;">
          <NH1>{{ frontmatter.title }}</NH1>
          <div style="display: flex; flex-direction: column; ">
            <NP>更新时间： {{ frontmatter.date }}</NP>
            <!-- <span>标签：</span> -->
            <div v-if="frontmatter.tags" style="display: flex; gap: 10px; margin-bottom: 10px;">
              <NTag size="small" type="info" v-for="tag in frontmatter.tags">
                {{tag}}
              </NTag>
            </div>
          </div>
          
        </div>
      </template>
    </DefaultTheme.Layout>
  </NConfigProvider>
</template>
```

# 如何允许 localsearch 索引 tag

vitepress 的 localsearch 基于 minisearch。喂给搜索的数据是md文件而不是经过layout.vue重新渲染的结果。并且不同的标签有不同的权重，其中 h1~h6 这种标题的权重是比较大的，而 p 标签里的文字就有可能搜不到。

想要喂给搜索数据，并且增大搜索权重，我给出下面的代码示例，也可以参考 [vitepress文档-自定义渲染内容](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-search#custom-content-renderer)

``` ts
// .vitepress/config.mts vitepress搜索配置
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
```

不过有个缺点是 dev 模式不会因为 md 元数据修改而重新生成搜索索引