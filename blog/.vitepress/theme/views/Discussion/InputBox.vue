<template>
  <div class="comment-input">
    <div
      v-if="quote"
      class="comment-input__quote"
    >
      <!-- 引用条直接按预览渲染：所见即所发，不用自己脑补 > 号 -->
      <div
        class="vp-doc comment-input__quote-body"
        v-html="quoteHtml"
      />
    </div>
    <NTabs
      v-model:value="activeTab"
      type="line"
    >
      <NTabPane
        display-directive="show"
        name="edit"
        tab="编辑"
      >
        <NInput
          ref="inputRef"
          v-model:value="commentContent"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 10 }"
          :placeholder="placeholder"
        />
      </NTabPane>
      <NTabPane
        display-directive="show"
        name="review"
        tab="预览"
      >
        <div
          class="vp-doc"
          v-html="previewHtml"
        />
      </NTabPane>
    </NTabs>
  </div>
</template>
<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { NInput, NTabPane } from "naive-ui";
import DOMPurify from "isomorphic-dompurify";

const commentContent = defineModel<string>("commentContent");

const props = withDefaults(
  defineProps<{
    /** 只读引用条内容（提及行 + 引用块），空串表示不显示 */
    quote?: string;
    placeholder?: string;
  }>(),
  {
    quote: "",
    placeholder: "",
  },
);

const md = inject<Ref<MarkdownIt | null | undefined> | undefined>("md");

const activeTab = ref<"edit" | "review">("edit");
const inputRef = ref<InstanceType<typeof NInput> | null>(null);

/** 引用条按预览渲染（提及行 + 引用块），与实际发送内容一致 */
const quoteHtml = computed(() =>
  DOMPurify.sanitize(md?.value?.render(props.quote ?? "") ?? ""),
);

/** 预览需要带上引用条，否则「预览」看到的内容和实际发送的不一致 */
const previewHtml = computed(() =>
  DOMPurify.sanitize(
    md?.value?.render(`${props.quote ?? ""}${commentContent.value ?? ""}`) ??
      "",
  ),
);

/**
 * 供外部调用：聚焦输入框。
 * 必须先切回「编辑」页签 —— 用户停在「预览」时 textarea 是隐藏的，直接 focus 无效。
 */
async function focus() {
  activeTab.value = "edit";
  await nextTick();
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>
<style scoped>
.comment-input__quote {
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: var(--hint-bg-color);
}

/*
 * 引用条本身是 markdown 渲染结果（和「预览」页签同一套 vp-doc 样式），
 * 这里只把文档级的大间距和正文字号收小，让它在底部回复框里保持紧凑。
 */
.comment-input__quote-body {
  max-height: 140px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
}

.comment-input__quote-body :deep(p) {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
}

.comment-input__quote-body :deep(p:first-child),
.comment-input__quote-body :deep(blockquote:first-child) {
  margin-top: 0;
}

.comment-input__quote-body :deep(p:last-child),
.comment-input__quote-body :deep(blockquote:last-child) {
  margin-bottom: 0;
}

.comment-input__quote-body :deep(blockquote) {
  margin: 4px 0;
  padding-left: 10px;
}

.comment-input__quote-body :deep(blockquote > p) {
  font-size: 13px;
}

/* 标题按引用条的比例收小，否则一个 # 标题就能顶满整条 */
.comment-input__quote-body :deep(h1),
.comment-input__quote-body :deep(h2),
.comment-input__quote-body :deep(h3),
.comment-input__quote-body :deep(h4),
.comment-input__quote-body :deep(h5),
.comment-input__quote-body :deep(h6) {
  margin: 6px 0;
  padding-top: 0;
  border-top: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.comment-input__quote-body :deep(ul),
.comment-input__quote-body :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.comment-input__quote-body :deep(li) {
  font-size: 13px;
  line-height: 1.6;
}

.comment-input__quote-body :deep(pre),
.comment-input__quote-body :deep(div[class*="language-"]) {
  margin: 4px 0;
}

.comment-input__quote-body :deep(img) {
  max-height: 100px;
}

.comment-input__quote-body :deep(code) {
  font-size: 12px;
}
</style>
