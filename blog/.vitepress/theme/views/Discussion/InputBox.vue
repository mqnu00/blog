<template>
  <div class="comment-input">
    <div
      v-if="quote"
      class="comment-input__quote"
    >
      <pre class="comment-input__quote-text">{{ quote.trimEnd() }}</pre>
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
  padding: 8px 10px;
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 4px;
  background-color: var(--hint-bg-color);
}

.comment-input__quote-text {
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--vp-c-text-2);
}
</style>
