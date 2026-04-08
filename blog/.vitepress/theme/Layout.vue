<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <Page/>
    </NMessageProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import { dateZhCN, GlobalComponentConfig, GlobalThemeOverrides, NButton, NConfigProvider, NH1, NMessageProvider, NP, NTag, NTimeline, NTimelineItem, useMessage, zhCN } from 'naive-ui'
import Page from './Page.vue';
</script>
