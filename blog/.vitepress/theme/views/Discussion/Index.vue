<template>
  <NCard style="height: auto">
    <template #header>
      评论
    </template>
    <template #default>
      <NSkeleton
        v-if="loading === true"
        size="large"
      />
      <template v-else>
        <InputBox v-model:value="commentContent" />
      </template>
    </template>
    <template #footer>
      <NFlex style="justify-content: space-between">
        <div />
        <div>
          <NSkeleton
            v-if="loading === true"
            :width="80"
            round
            size="medium"
          />
          <NButton
            v-else
            :loading="sendCommentLoading"
            @click="sendComment"
          >
            发送
          </NButton>
        </div>
      </NFlex>
    </template>
  </NCard>
  <div>
    <NStatistic
      label="评论数"
      :value="discussionList?.comments.totalCount"
    />
  </div>
  <template
    v-for="(discussion, index) in discussionList?.comments.nodes"
    :key="`discuss-${index}`"
  >
    <NCard
      class="discussion"
      style="background-color: var(--discuss-bg-color)"
    >
      <template #header>
        <div
          style="display: flex; flex-direction: row; gap: 10px; font-size: 14px"
        >
          <NAvatar
            round
            size="small"
            :src="discussion?.userInfo?.avatarUrl"
          />
          <a
            class="username"
            :href="discussion?.userInfo?.url"
          >{{
            discussion?.userInfo?.login
          }}</a>
          <NPopover trigger="hover">
            <template #trigger>
              <NTime
                :time="discussion?.createDate"
                type="relative"
              />
            </template>
            <NTime :time="discussion?.createDate" />
          </NPopover>
          <span
            class="quote-link"
            @click="quoteComment(index)"
          >回复</span>
        </div>
      </template>
      <template #default>
        <div
          style="margin-left: 20px; background-color: var(--discuss-bg-color)"
          class="vp-doc"
          v-html="DOMPurify.sanitize(md.render(discussion?.body || ''))"
        />
      </template>
      <template #footer>
        <NCollapse
          size="large"
          style="
            background-color: var(--hint-bg-color);
            padding-left: 20px;
            padding-top: 10px;
            padding-bottom: 10px;
            padding-right: 20px;
          "
          @item-header-click="expandReply"
        >
          <NCollapseItem
            title="回复"
            :name="index"
          >
            <div>
              <NTimeline class="reply-timeline">
                <template
                  v-for="(reply, reIndex) in discussion?.replies?.nodes"
                  :key="reIndex"
                >
                  <NTimelineItem
                    :time="reply?.createDate?.toLocaleString()"
                    :color="randomColor()"
                  >
                    <template #icon>
                      <NAvatar
                        round
                        size="small"
                        :src="reply?.userInfo?.avatarUrl"
                        style="width: 100%; height: 100%; scale: 2"
                      />
                    </template>
                    <span>{{ `${reply?.author?.login}:` }}</span>
                    <span
                      class="quote-link"
                      @click="quoteReply(index, reIndex)"
                    >回复</span>
                    <div
                      style="
                        padding-left: 20px;
                        padding-top: 20px;
                        padding-bottom: 20px;
                        background-color: var(--hint-bg-color);
                      "
                      class="vp-doc"
                      v-html="DOMPurify.sanitize(md.render(reply?.body || ''))"
                    />
                  </NTimelineItem>
                </template>
                <NTimelineItem v-if="discussion?.replies?.loading ?? true">
                  <template #icon>
                    <NSpin :size="16" />
                  </template>
                  加载中
                </NTimelineItem>
                <NTimelineItem
                  v-else-if="
                    (discussion?.replies?.nodes?.length ?? 0) <
                      (discussion?.replies?.totalCount ?? 0)
                  "
                >
                  <template #icon>
                    <NButton
                      text
                      style="font-size: 18px"
                    >
                      <NIcon>
                        <ChevronCircleDown20Regular />
                      </NIcon>
                    </NButton>
                  </template>
                  <template #default>
                    <a
                      class="reply-expand-text"
                      @click="getDiscussionReply(index)"
                    >展开</a>
                  </template>
                </NTimelineItem>
              </NTimeline>
              <NCard
                style="
                  background-color: var(--hint-bg-color);
                  margin-top: 10px;
                  padding-right: 10px;
                  padding-bottom: 10px;
                  border: 1px solid white;
                "
              >
                <template #header>
                  回复
                </template>
                <template #default>
                  <NSkeleton
                    v-if="loading === true"
                    height="100%"
                    size="large"
                  />
                  <template v-else>
                    <InputBox
                      v-model:comment-content="discussion!.replyContent"
                    />
                  </template>
                </template>
                <template #footer>
                  <NFlex style="justify-content: space-between">
                    <div />
                    <div>
                      <NSkeleton
                        v-if="loading === true"
                        :width="80"
                        round
                        size="medium"
                      />
                      <NButton
                        v-else
                        :loading="sendReplyLoading"
                        @click="sendReply(index)"
                      >
                        发送
                      </NButton>
                    </div>
                  </NFlex>
                </template>
              </NCard>
            </div>
          </NCollapseItem>
        </NCollapse>
      </template>
    </NCard>
  </template>
  <div
    v-if="(count - 1) * 5 < discussionList?.comments.totalCount!"
    style="
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    "
  >
    <div style="width: 47%; border-top: 1px solid rgb(155 167 167)" />
    <NButton
      text
      style="font-size: 24px"
      @click="getDiscussionList"
    >
      <NSpin v-if="discussionListLoading" />
      <NIcon v-else>
        <ChevronCircleDown20Regular />
      </NIcon>
    </NButton>
    <div style="width: 47%; border-top: 1px solid rgb(155 167 167)" />
  </div>
</template>
<script setup lang="ts">
import type {
  CreateDiscussionMutation,
  GetDiscussionByNumberQuery,
  GetUserInfoQuery,
  GetDiscussionCommentReplyQuery,
  Discussion,
} from "@blog/.vitepress/utils/github/graphql/github";
import { GithubDiscussApi } from "@blog/.vitepress/utils/github/discussion";
import {
  NAvatar,
  NDivider,
  NIcon,
  NPopover,
  NStatistic,
  NTimeline,
  NTimelineItem,
  useMessage,
} from "naive-ui";
import type {
  CollapseItemHeaderSlotProps,
  CollapseItemProps,
  CollapseProps,
} from "naive-ui";
import { GithubUserApi } from "@blog/.vitepress/utils/github/user";
import { ChevronCircleDown20Regular, ReceiptBag20Filled } from "@vicons/fluent";
import moment from "moment";
import MarkdownIt from "markdown-it";
import { useData } from "vitepress";
import { createHighlighter } from "shiki";
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki";
import InputBox from "./InputBox.vue";
import DOMPurify from "isomorphic-dompurify";

const highlighter: Ref<
  HighlighterGeneric<BundledLanguage, BundledTheme> | null | undefined
> = ref();
const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});
createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "typescript", "vue", "html", "css"],
}).then((res) => {
  highlighter.value = res
  md.value = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && highlighter.value?.getLoadedLanguages().includes(lang)) {
        const theme = isDark.value ? "github-dark" : "github-light";
        const html = highlighter.value?.codeToHtml(str, {
          lang,
          theme,
        });
        return `<div class="language-${lang}">${html}</div>`;
      }
      return `<div class="language-${lang}"><pre><code>${str}</code></pre>`;
    },
    html: true, // 允许 HTML 标签
    linkify: true, // 自动识别 URL 并转换为链接
    typographer: true, // 优化排版（引号、破折号等）
    breaks: true, // 将换行符转换为 <br>
    xhtmlOut: true, // 使用 XHTML 闭合标签
  });
})
const message = useMessage();
const { isDark } = useData();
const md: Ref<MarkdownIt | null | undefined> = ref()
provide("md", md);

// type 使用 & 交叉类型扩展
type DiscussionType = NonNullable<NonNullable<GetDiscussionByNumberQuery["repository"]>["discussion"]>
type CommentNode = NonNullable<DiscussionType["comments"]["nodes"]>[0]
type ReplyNode = NonNullable<NonNullable<NonNullable<GetDiscussionCommentReplyQuery["node"]>["replies"]>["nodes"]>[0]
type DiscussionWithUser = Omit<DiscussionType, "comments"> & {
  comments: Omit<DiscussionType["comments"], "nodes"> & {
    nodes: Array<
      | (CommentNode & {
          userInfo?: GetUserInfoQuery["user"];
          createDate?: Date;
          startCount?: number;
          limit?: number;
          replyContent?: string;
          replies?: Omit<
            NonNullable<GetDiscussionCommentReplyQuery["node"]>["replies"],
            "replies"
          > & {
            loading: boolean;
            nodes: Array<
              | null
              | (Omit<ReplyNode,"reply"> & {
                  createDate?: number;
                  userInfo?: GetUserInfoQuery["user"];
                })
            > | null;
          };
        })
      | null
    > | null; // 保持可以为 null
  };
};

const props = defineProps<{
  discussion: NonNullable<
    NonNullable<CreateDiscussionMutation["createDiscussion"]>["discussion"]
  >;
}>();

const loading = ref(false);

const discussClient: Ref<GithubDiscussApi | null> = ref(null);
const userClient: Ref<GithubUserApi | null> = ref(null);
const accessToken: Ref<string | null> = ref(null);
const discussionList: Ref<DiscussionWithUser | null | undefined> = ref();

const count = ref(1);
const discussionListLoading = ref(false);
async function getDiscussionList() {
  loading.value = true;
  discussionListLoading.value = true;
  if (!discussionList.value) {
    discussionList.value = await discussClient.value?.getDiscussionByNumber(
      props.discussion.number,
      (count.value - 1) * 5,
      5,
    );
  } else {
    await discussClient.value
      ?.getDiscussionByNumber(props.discussion.number, (count.value - 1) * 5, 5)
      .then((res) => {
        discussionList.value?.comments.nodes?.push(...res?.comments.nodes!);
      });
  }
  discussionListLoading.value = false;
  discussionList.value?.comments.nodes?.forEach(async (comment) => {
    if (comment) {
      comment.userInfo = await userClient.value?.getUserInfo(
        comment?.author?.login as string,
      );
      comment.createDate = moment(comment.createdAt).toDate();
      comment.startCount = 1;
      comment.limit = 5;
      comment.replyContent = "";
    }
  });
  count.value = count.value + 1;
  // console.log(discussionList.value)
  loading.value = false;
}
function initDiscussion() {
  count.value = 1;
  discussionList.value = null;
  getDiscussionList();
}

async function getDiscussionReply(whichOne: number) {
  const comment = discussionList.value?.comments.nodes![whichOne];
  if (comment?.replies) {
    comment.replies.loading = true;
  }
  let res = await discussClient.value?.getDiscussionComment(
    comment?.id!,
    ((comment?.startCount ?? 1) - 1) * 5,
    comment?.limit,
  );
  for (var reply of res?.nodes ?? []) {
    if (reply) {
      reply.createDate = moment(reply?.createdAt).toDate();
      if (reply.author?.login) {
        reply.userInfo = await userClient.value?.getUserInfo(
          reply.author?.login,
        );
      }
    }
  }
  if (comment && comment?.replies == null) {
    if (res) {
      comment.replies = {
        ...res,
        loading: false,
      };
    }
    if (comment.replies) {
      comment.replies.loading = false;
    }
  } else {
    comment?.replies!.nodes?.push(...res?.nodes!);
    comment!.replies!.loading = false;
  }
  if (discussionList.value) {
    discussionList.value.comments.nodes![whichOne]!.startCount =
      (discussionList.value.comments.nodes![whichOne]!.startCount ?? 1) + 1;
  }
}
const expandReply: CollapseProps["onItemHeaderClick"] = (data) => {
  if (data.expanded) {
    if (discussionList.value?.comments.nodes![data.name]?.replies == null) {
      getDiscussionReply(data.name);
    }
  }
};

function formatQuote(body: string | null | undefined, author?: string | null) {
  const raw = body ?? "";
  const header = author ? `@${author}\n` : "";
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => `> ${line}`);
  return [header, ...lines, "", ""].filter(Boolean).join("\n");
}

function quoteComment(commentIndex: number) {
  const comment = discussionList.value?.comments.nodes?.[commentIndex];
  if (!comment) return;
  const quote = formatQuote(comment.body, comment.author?.login);
  comment.replyContent = quote;
}

function quoteReply(commentIndex: number, replyIndex: number) {
  const comment = discussionList.value?.comments.nodes?.[commentIndex];
  const reply = comment?.replies?.nodes?.[replyIndex];
  if (!comment || !reply) return;
  const quote = formatQuote(reply.body, reply.author?.login);
  comment.replyContent = quote;
}

// 发送评论
const commentContent = ref();
const sendCommentLoading = ref(false);
async function sendComment() {
  if (!commentContent.value || commentContent.value === "") {
    message.error("评论内容为空！");
  } else if (discussionList.value?.id) {
    sendCommentLoading.value = true;
    const res = await discussClient.value?.addDiscussionComment(
      discussionList.value.id,
      commentContent.value,
    );
    if (res?.id) {
      message.success("评论发送成功！");
      commentContent.value = "";
      initDiscussion();
    } else {
      message.error("评论发送失败！");
    }
  }
  sendCommentLoading.value = false;
}
// 发送回复
const sendReplyLoading = ref(false);
async function sendReply(commentIndex: number) {
  const comments = discussionList.value?.comments.nodes!;
  if (
    !comments[commentIndex]?.replyContent ||
    comments[commentIndex]?.replyContent === ""
  ) {
    message.error("回复内容为空！");
  } else if (comments[commentIndex]?.id) {
    sendReplyLoading.value = true;
    const res = await discussClient.value?.addReplyToComment(
      discussionList.value?.id!,
      comments[commentIndex].id,
      comments[commentIndex].replyContent!,
    );
    if (res?.id) {
      message.success("回复发送成功！");
      comments[commentIndex].replyContent! = "";
      initDiscussion();
    } else {
      message.error("回复发送失败！");
    }
  }
  sendReplyLoading.value = false;
}

onMounted(async () => {
  accessToken.value = localStorage.getItem("access_token");
  if (accessToken.value == null) {
    throw new Error("access_token 为空");
  }
  discussClient.value = new GithubDiscussApi(
    accessToken.value,
    import.meta.env.VITE_GITHUB_DISCUSS_OWNER,
    import.meta.env.VITE_GITHUB_DISCUSS_REP,
    import.meta.env.VITE_GITHUB_REPO_ID,
  );
  userClient.value = new GithubUserApi(
    accessToken.value,
    import.meta.env.VITE_GITHUB_DISCUSS_OWNER,
    import.meta.env.VITE_GITHUB_DISCUSS_REP,
  );
  await getDiscussionList();
});

watch(
  () => props.discussion,
  (newVal) => {
    initDiscussion();
  },
);

function randomColor() {
  const rand = () => Math.floor(Math.random() * 156) + 100; // 100~255，避免太暗
  return `rgb(${rand()}, ${rand()}, ${rand()})`;
}
</script>
<style>
.username {
  font-size: 14px;
}

.username:hover {
  text-decoration: underline;
  color: rgb(0, 157, 255);
}

.discussion .n-card__footer {
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
}

.reply-expand-text:hover {
  cursor: pointer;
  text-decoration: underline;
  color: rgb(0, 157, 255);
}

.quote-link {
  cursor: pointer;
  margin-left: 10px;
  color: rgb(0, 157, 255);
  font-size: 12px;
}

.quote-link:hover {
  text-decoration: underline;
}

.reply-timeline .n-timeline-item-content__meta {
  /* padding-left: 10px; */
}
</style>
