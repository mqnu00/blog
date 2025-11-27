<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
// import dayjs from 'dayjs'
import { GlobalComponentConfig, GlobalThemeOverrides, NConfigProvider, NP, NTag } from 'naive-ui'

const { page, frontmatter } = useData()
</script>

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
        <!-- <p v-if="page.lastUpdated" class="last-updated">
          最后更新：{{ dayjs(page.lastUpdated).format('YYYY-MM-DD HH:mm') }}
        </p> -->
      </template>
    </DefaultTheme.Layout>
  </NConfigProvider>
</template>

<style>
.last-updated {
  font-size: 0.9em;
  color: #888;
  margin-top: -0.5em;
}
</style>
