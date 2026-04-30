<template>
  <NTabs default-value="edit">
    <NTabPane
      display-directive="show"
      name="edit"
      tab="编辑"
    >
      <NInput
        v-model:value="commentContent"
        type="textarea"
      />
    </NTabPane>
    <NTabPane
      display-directive="show"
      name="review"
      tab="预览"
    >
      <div
        class="vp-doc"
        v-html="DOMPurify.sanitize(md ? md.render(commentContent || '') : '')"
      />
    </NTabPane>
  </NTabs>
</template>
<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { NTabPane } from "naive-ui";
import DOMPurify from "isomorphic-dompurify";

const commentContent = defineModel<string>("commentContent");
const md: ComputedRef<MarkdownIt> | undefined = inject("md");
</script>
