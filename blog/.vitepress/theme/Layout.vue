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
const isClient = ref(false)

const theme = computed(() => {
  if (isClient.value) {
    return isDark.value ? darkTheme : undefined
  }
})

// 动态生成 CSS 变量
const cssVars = computed(() => {
  if (isClient.value) {
    return {
      '--hint-bg-color': isDark.value ? 'rgb(91, 91, 91)' : 'rgb(233, 233, 238)',
      '--discuss-bg-color': isDark.value ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      '--hint-content-bg-hover': isDark.value ? 'rgb(95, 95, 95)' : 'rgb(233, 233, 238)',
    }
  }
})

onMounted(() => {
  isClient.value = true
})
</script>
