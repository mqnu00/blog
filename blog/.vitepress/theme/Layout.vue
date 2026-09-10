<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="theme"
    :theme-overrides="themeOverrides"
    :style="cssVars"
  >
    <NMessageProvider>
      <NThemeEditor v-if="isDev">
        <Page />
      </NThemeEditor>
      <Page v-else />
    </NMessageProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import {
  darkTheme,
  dateZhCN,
  GlobalComponentConfig,
  GlobalThemeOverrides,
  NButton,
  NConfigProvider,
  NH1,
  NMessageProvider,
  NP,
  NTag,
  NThemeEditor,
  NTimeline,
  NTimelineItem,
  useMessage,
  zhCN,
} from "naive-ui";
import Page from "./Page.vue";
import { useData } from "vitepress";
import lightThemeOverrides from "./naive-ui-light-theme-overrides.json";
import nightThemeOverrides from "./naive-ui-night-theme-overrides.json";

const { isDark } = useData();
const isClient = ref(false);
const isDev = import.meta.env.DEV;

const theme = computed(() => {
  if (isClient.value) {
    return isDark.value ? darkTheme : undefined;
  }
  return null;
});
const themeOverrides = computed(() => {
  if (isDark.value) {
    return nightThemeOverrides;
  } else return lightThemeOverrides;
});

// 动态生成 CSS 变量
const cssVars = computed(() => {
  if (isClient.value) {
    return {
      // 晴山新霁 v2：浅色取月白冷调，深色取深夜
      "--hint-bg-color": isDark.value
        ? "rgb(19, 30, 44)"
        : "rgb(220, 232, 237)",
      "--discuss-bg-color": isDark.value
        ? "rgb(13, 21, 32)"
        : "rgb(238, 247, 242)",
      "--hint-content-bg-hover": isDark.value
        ? "rgb(25, 35, 50)"
        : "rgb(215, 228, 235)",
    };
  }
  return null;
});

onMounted(() => {
  isClient.value = true;
});
</script>
