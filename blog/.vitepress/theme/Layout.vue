<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme="theme" :style="cssVars">
    <NMessageProvider>
      <Page/>
    </NMessageProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import { darkTheme, dateZhCN, GlobalComponentConfig, GlobalThemeOverrides, NButton, NConfigProvider, NH1, NMessageProvider, NP, NTag, NTimeline, NTimelineItem, useMessage, zhCN } from 'naive-ui'
import Page from './Page.vue';
import { useData } from 'vitepress';

const {isDark} = useData()

const theme = computed(() => {
  return isDark.value ? darkTheme : undefined
})

const normalLightTheme = {
  common: {
    replyBackgroundColor: isDark.value ? '#2d2d2d' : '#f0f2f5',
  }
}

// 动态生成 CSS 变量
const cssVars = computed(() => ({
  '--hint-bg-color': isDark.value ? 'rgb(70, 70, 70)' : 'rgb(233, 233, 238)',
  '--hint-content-bg-hover': isDark.value ? 'rgb(95, 95, 95)' : 'rgb(233, 233, 238)',
}))
</script>
