<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import dayjs from 'dayjs'

const { page } = useData()
</script>

<template>
  <!-- 保留默认主题的布局 -->
  <DefaultTheme.Layout>
    <!-- 在标题区域插入更新时间 -->
    <!-- <template #doc-before>
      <p v-if="page.lastUpdated" class="last-updated">
        最后更新：{{ dayjs(page.lastUpdated).format('YYYY-MM-DD HH:mm') }}
      </p>
    </template> -->
  </DefaultTheme.Layout>
</template>

<style>
.last-updated {
  font-size: 0.9em;
  color: #888;
  margin-top: -0.5em;
}
</style>
