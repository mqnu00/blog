<template>
  <NTabs default-value="edit">
    <NTabPane display-directive="show" name="edit" tab="编辑">
      <NInput type="textarea" v-model:value="commentContent"/>
    </NTabPane>
    <NTabPane display-directive="show" name="review" tab="预览">
      <div class="vp-doc" v-html="md ? md.render(commentContent || '') : ''"/>
    </NTabPane>
  </NTabs>
</template>
<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { NTabPane } from 'naive-ui';

const commentContent = defineModel<string>('commentContent')
const md: ComputedRef<MarkdownIt> | undefined = inject('md')
const focusOn = ref('编辑')
</script>