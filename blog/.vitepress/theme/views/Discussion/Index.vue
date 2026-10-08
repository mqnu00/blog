<template>
  <NCard
    data-comment-box
    style="height: auto"
  >
    <template #header>
      评论
    </template>
    <template #default>
      <NSkeleton
        v-if="loading === true"
        size="large"
      />
      <template v-else>
        <InputBox
          ref="commentBoxRef"
          v-model:comment-content="commentContent"
          placeholder="友善发言，说说你的想法～"
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
      :class="{ 'discussion--flash': flashCommentIndex === index }"
      :data-comment-index="index"
      style="background-color: var(--discuss-bg-color)"
    >
      <template #header>
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 10px;
            font-size: 14px;
            align-items: center;
          "
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
          <NButton
            text
            size="tiny"
            class="reply-link"
            @click="startReply(index, 'comment')"
          >
            <template #icon>
              <NIcon><ArrowReply20Regular /></NIcon>
            </template>
            回复
          </NButton>
        </div>
      </template>
      <template #default>
        <div
          style="margin-left: 20px; background-color: var(--discuss-bg-color)"
          class="vp-doc"
          v-html="renderMarkdown(discussion?.body)"
        />
      </template>
      <template #footer>
        <!--
          这里只负责"看回复"；写回复统一交给底部的共用回复框，
          避免每条评论底下都挂一个默认折叠的输入框（点了「回复」却什么也看不见）。
        -->
        <NCollapse
          v-model:expanded-names="expandedNames"
          size="large"
          style="
            background-color: var(--hint-bg-color);
            padding-left: 20px;
            padding-top: 10px;
            padding-bottom: 10px;
            padding-right: 20px;
          "
          @item-header-click="onCollapseHeaderClick"
        >
          <NCollapseItem
            :title="collapseTitle(index)"
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
                    <NButton
                      text
                      size="tiny"
                      class="reply-link"
                      @click="startReply(index, 'reply', reIndex)"
                    >
                      <template #icon>
                        <NIcon><ArrowReply20Regular /></NIcon>
                      </template>
                      回复
                    </NButton>
                    <div
                      style="
                        padding-left: 20px;
                        padding-top: 20px;
                        padding-bottom: 20px;
                        background-color: var(--hint-bg-color);
                      "
                      class="vp-doc"
                      v-html="renderMarkdown(reply?.body)"
                    />
                  </NTimelineItem>
                </template>
                <NTimelineItem v-if="isRepliesLoading(index)">
                  <template #icon>
                    <NSpin :size="16" />
                  </template>
                  加载中
                </NTimelineItem>
                <NTimelineItem v-else-if="hasMoreReplies(index)">
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
              <div
                v-if="isRepliesEmpty(index)"
                class="reply-empty"
              >
                还没有回复，点上面的「回复」来抢第一个沙发
              </div>
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

  <!--
    共用回复框：吸附在视口底部（sticky 而不是 fixed，手机上不会被输入法顶飞），
    滚出评论区后自动落位。未选择回复对象时只占一条细提示，不占屏幕。
  -->
  <div
    v-if="discussionList != null"
    ref="dockRef"
    class="reply-dock"
    :class="{
      'reply-dock--active': replyTarget !== null,
      'reply-dock--flash': dockFlash,
    }"
  >
    <div
      v-if="replyTarget === null"
      class="reply-dock__empty"
    >
      <NIcon :size="16">
        <Comment20Regular />
      </NIcon>
      <span>想回复谁，就点那条评论或回复右侧的「回复」</span>
      <div style="flex: 1" />
      <NButton
        text
        size="tiny"
        @click="focusCommentBox"
      >
        直接发表评论 ↑
      </NButton>
    </div>
    <template v-else>
      <div class="reply-dock__head">
        <NIcon :size="16">
          <ArrowReply20Regular />
        </NIcon>
        <span class="reply-dock__kind">{{
          replyTarget.kind === "comment" ? "回复评论" : "回复回复"
        }}</span>
        <span class="reply-dock__who">@{{ replyTarget.login }}</span>
        <span
          v-if="replyTarget.kind === 'reply'"
          class="reply-dock__thread"
        >· 在 @{{ replyTarget.threadLogin }} 的评论下</span>
        <div style="flex: 1" />
        <NButton
          text
          size="tiny"
          @click="quoteEnabled = !quoteEnabled"
        >
          {{ quoteEnabled ? "取消引用" : "恢复引用" }}
        </NButton>
        <NButton
          text
          size="tiny"
          @click="scrollToTargetComment"
        >
          查看原评论
        </NButton>
        <NButton
          text
          size="tiny"
          @click="clearReplyTarget"
        >
          关闭
        </NButton>
      </div>
      <InputBox
        ref="replyBoxRef"
        v-model:comment-content="replyDraft"
        :quote="replyQuotePreview"
        placeholder="友善发言……支持 Markdown"
      />
      <NFlex
        justify="space-between"
        align="center"
      >
        <span class="reply-dock__tip">{{ replyTip }}</span>
        <NButton
          type="primary"
          size="small"
          :loading="sendReplyLoading"
          @click="sendReply"
        >
          发送回复
        </NButton>
      </NFlex>
    </template>
  </div>
</template>
<script setup lang="ts">
import type {
  CreateDiscussionMutation,
  GetDiscussionByNumberQuery,
  GetUserInfoQuery,
  GetDiscussionCommentReplyQuery,
} from "@blog/.vitepress/utils/github/graphql/github";
import { GithubDiscussApi } from "@blog/.vitepress/utils/github/discussion";
import {
  NAvatar,
  NIcon,
  NPopover,
  NStatistic,
  NTimeline,
  NTimelineItem,
  useMessage,
} from "naive-ui";
import type { CollapseProps } from "naive-ui";
import { GithubUserApi } from "@blog/.vitepress/utils/github/user";
import {
  ArrowReply20Regular,
  ChevronCircleDown20Regular,
  Comment20Regular,
} from "@vicons/fluent";
import moment from "moment";
import MarkdownIt from "markdown-it";
import { useData } from "vitepress";
import { createHighlighter } from "shiki";
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki";
import InputBox from "./InputBox.vue";
import DOMPurify from "isomorphic-dompurify";
import {
  buildReplyBody,
  formatMention,
  formatQuoteBlock,
} from "@blog/.vitepress/utils/discussion/quote";

const highlighter: Ref<
  HighlighterGeneric<BundledLanguage, BundledTheme> | null | undefined
> = ref();
createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "typescript", "vue", "html", "css"],
}).then((res) => {
  highlighter.value = res;
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
});
const message = useMessage();
const { isDark } = useData();
const md: Ref<MarkdownIt | null | undefined> = ref();
provide("md", md);

/** 渲染 Markdown；高亮器就绪前返回空串（md 是 ref，就绪后会自动重渲染） */
function renderMarkdown(body: string | null | undefined) {
  if (!md.value) return "";
  return DOMPurify.sanitize(md.value.render(body || ""));
}

// type 使用 & 交叉类型扩展
type DiscussionType = NonNullable<
  NonNullable<GetDiscussionByNumberQuery["repository"]>["discussion"]
>;
type CommentNode = NonNullable<DiscussionType["comments"]["nodes"]>[0];
type ReplyNode = NonNullable<
  NonNullable<
    NonNullable<GetDiscussionCommentReplyQuery["node"]>["replies"]
  >["nodes"]
>[0];
type ReplyNodeWithUser = Omit<NonNullable<ReplyNode>, "reply"> & {
  createDate?: Date;
  userInfo?: GetUserInfoQuery["user"];
};
type DiscussionWithUser = Omit<DiscussionType, "comments"> & {
  comments: Omit<DiscussionType["comments"], "nodes"> & {
    nodes: Array<
      | (CommentNode & {
          userInfo?: GetUserInfoQuery["user"];
          createDate?: Date;
          replies?: Omit<
            NonNullable<GetDiscussionCommentReplyQuery["node"]>["replies"],
            "replies"
          > & {
            loading: boolean;
            nodes: ReplyNodeWithUser[];
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

/** 「回复评论」= 顶层评论；「回复回复」= 二级回复 */
interface ReplyTarget {
  kind: "comment" | "reply";
  commentIndex: number;
  /** 被回复者的登录名 */
  login: string;
  /** 被引用／被回复的正文 */
  body: string;
  /** 该线程顶层评论的作者，用于说明新回复会挂在哪里 */
  threadLogin: string;
}

const loading = ref(false);

const discussClient: Ref<GithubDiscussApi | null> = ref(null);
const userClient: Ref<GithubUserApi | null> = ref(null);
const accessToken: Ref<string | null> = ref(null);
const discussionList: Ref<DiscussionWithUser | null | undefined> = ref();

const count = ref(1);
const discussionListLoading = ref(false);

/** 展开的回复面板（受控，这样「回复」按钮也能把面板打开） */
const expandedNames = ref<Array<string | number>>([]);

/** 共用回复框 */
const replyTarget = ref<ReplyTarget | null>(null);
const replyDraft = ref("");
const quoteEnabled = ref(true);
const replyBoxRef = ref<InstanceType<typeof InputBox> | null>(null);
const commentBoxRef = ref<InstanceType<typeof InputBox> | null>(null);
const dockRef = ref<HTMLElement | null>(null);
const dockFlash = ref(false);
const flashCommentIndex = ref<number | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | null = null;

const REPLY_PAGE_SIZE = 5;

/** 回复某条回复时，GitHub 不接受 replyToId 指向一条回复（只支持两层），
 *  所以「指向谁」只能靠正文里的 @提及 来表达，这里必须带上。 */
const replyMention = computed(() =>
  replyTarget.value?.kind === "reply"
    ? formatMention(replyTarget.value.login)
    : "",
);
const replyQuoteBlock = computed(() =>
  replyTarget.value && quoteEnabled.value
    ? formatQuoteBlock(replyTarget.value.body)
    : "",
);
/** 展示在输入框上方的只读引用条（与实际发送内容保持一致） */
const replyQuotePreview = computed(
  () => `${replyMention.value}${replyQuoteBlock.value}`,
);
const replyBody = computed(() =>
  buildReplyBody({
    mention: replyMention.value,
    quote: replyQuoteBlock.value,
    draft: replyDraft.value,
  }),
);
const replyTip = computed(() => {
  const target = replyTarget.value;
  if (!target) return "";
  if (target.kind === "comment") {
    return quoteEnabled.value
      ? `将引用原文后回复 @${target.login}`
      : `不引用原文，直接回复 @${target.login}`;
  }
  return quoteEnabled.value
    ? `将引用 @${target.login} 的原文；GitHub 讨论只支持两层，新回复会追加在 @${target.threadLogin} 的评论下`
    : `已取消引用，仍保留 @${target.login}（这是唯一能通知到对方的方式）`;
});

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
        const next = res?.comments.nodes;
        if (next) discussionList.value?.comments.nodes?.push(...next);
      });
  }
  discussionListLoading.value = false;
  for (const comment of discussionList.value?.comments.nodes ?? []) {
    if (!comment) continue;
    comment.createDate = moment(comment.createdAt).toDate();
  }
  // 头像单独取，失败也不该拖垮整条评论的展示
  for (const comment of discussionList.value?.comments.nodes ?? []) {
    const login = comment?.author?.login;
    if (!comment || !login) continue;
    userClient.value
      ?.getUserInfo(login)
      .then((user) => {
        if (comment) comment.userInfo = user;
      })
      .catch(() => undefined);
  }
  count.value = count.value + 1;
  loading.value = false;
}

function initDiscussion() {
  count.value = 1;
  discussionList.value = null;
  expandedNames.value = [];
  replyTarget.value = null;
  replyDraft.value = "";
  getDiscussionList();
}

/** 展开某条评论的回复面板（顺带触发首次加载） */
function openThread(commentIndex: number) {
  if (!expandedNames.value.includes(commentIndex)) {
    expandedNames.value = [...expandedNames.value, commentIndex];
  }
  void getDiscussionReply(commentIndex, { skipIfLoaded: true });
}

async function getDiscussionReply(
  whichOne: number,
  options: { skipIfLoaded?: boolean } = {},
) {
  const comment = discussionList.value?.comments.nodes?.[whichOne];
  if (!comment) return;
  if (options.skipIfLoaded && comment.replies != null) return;
  // 用「已加载条数」当偏移量，新增的回复插进来后也不会重复或漏拉
  const offset = comment.replies?.nodes?.length ?? 0;
  if (comment.replies) comment.replies.loading = true;
  try {
    const res = await discussClient.value?.getDiscussionComment(
      comment.id,
      offset,
      REPLY_PAGE_SIZE,
    );
    const nodes: ReplyNodeWithUser[] = [];
    for (const reply of res?.nodes ?? []) {
      if (!reply) continue;
      const node: ReplyNodeWithUser = {
        ...reply,
        createDate: moment(reply.createdAt).toDate(),
      };
      const login = reply.author?.login;
      if (login) {
        node.userInfo = (await userClient.value?.getUserInfo(login)) ?? null;
      }
      nodes.push(node);
    }
    if (comment.replies == null) {
      comment.replies = {
        totalCount: res?.totalCount ?? 0,
        nodes,
        pageInfo: res?.pageInfo ?? { endCursor: null, hasNextPage: false },
        loading: false,
      };
    } else {
      comment.replies.nodes.push(...nodes);
      comment.replies.totalCount =
        res?.totalCount ?? comment.replies.totalCount;
      comment.replies.pageInfo = res?.pageInfo ?? comment.replies.pageInfo;
      comment.replies.loading = false;
    }
  } catch (err) {
    if (comment.replies) comment.replies.loading = false;
    console.error(err);
    message.error(`回复加载失败：${apiErrorMessage(err)}`);
  }
}

const onCollapseHeaderClick: CollapseProps["onItemHeaderClick"] = (data) => {
  if (data.expanded) {
    void getDiscussionReply(Number(data.name), { skipIfLoaded: true });
  }
};

function collapseTitle(index: number) {
  const comment = discussionList.value?.comments.nodes?.[index];
  const total = comment?.replies?.totalCount ?? 0;
  const expanded = expandedNames.value.includes(index);
  if (total > 0)
    return expanded ? `收起 ${total} 条回复` : `查看 ${total} 条回复`;
  return expanded ? "收起回复" : "查看回复";
}

function isRepliesLoading(index: number) {
  const replies = discussionList.value?.comments.nodes?.[index]?.replies;
  return replies == null || replies.loading;
}

function isRepliesEmpty(index: number) {
  const replies = discussionList.value?.comments.nodes?.[index]?.replies;
  return (
    replies != null && !replies.loading && (replies.nodes?.length ?? 0) === 0
  );
}

function hasMoreReplies(index: number) {
  const replies = discussionList.value?.comments.nodes?.[index]?.replies;
  if (replies == null || replies.loading) return false;
  return (replies.nodes?.length ?? 0) < (replies.totalCount ?? 0);
}

/** 点「回复」：锁定目标 → 展开线程 → 引用 + 聚焦底部回复框 */
function startReply(
  commentIndex: number,
  kind: ReplyTarget["kind"],
  replyIndex = 0,
) {
  const comment = discussionList.value?.comments.nodes?.[commentIndex];
  if (!comment) return;
  const threadLogin = comment.author?.login ?? "";
  let target: ReplyTarget | null = null;
  if (kind === "comment") {
    target = {
      kind,
      commentIndex,
      login: threadLogin,
      body: comment.body,
      threadLogin,
    };
  } else {
    const reply = comment.replies?.nodes?.[replyIndex];
    if (reply) {
      target = {
        kind,
        commentIndex,
        login: reply.author?.login ?? "",
        body: reply.body,
        threadLogin,
      };
    }
  }
  if (!target) return;
  replyTarget.value = target;
  quoteEnabled.value = true;
  openThread(commentIndex);
  void revealReplyBox();
}

/** 让底部回复框可见并聚焦：本来就吸在视口里就不滚动，避免抢走用户的滚动 */
async function revealReplyBox() {
  await nextTick();
  const el = dockRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!visible) el.scrollIntoView({ behavior: "smooth", block: "end" });
  }
  await nextTick();
  await replyBoxRef.value?.focus();
  flashDock();
}

function flashDock() {
  dockFlash.value = false;
  if (flashTimer) clearTimeout(flashTimer);
  // 先置空再加类，保证连点同一条时动画能重新播放
  void nextTick(() => {
    dockFlash.value = true;
    flashTimer = setTimeout(() => {
      dockFlash.value = false;
      flashTimer = null;
    }, 900);
  });
}

function clearReplyTarget() {
  replyTarget.value = null;
  quoteEnabled.value = true;
}

async function scrollToTargetComment() {
  const target = replyTarget.value;
  if (!target) return;
  openThread(target.commentIndex);
  await nextTick();
  const el = document.querySelector<HTMLElement>(
    `[data-comment-index="${target.commentIndex}"]`,
  );
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
  flashCommentIndex.value = null;
  await nextTick();
  flashCommentIndex.value = target.commentIndex;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    flashCommentIndex.value = null;
    flashTimer = null;
  }, 900);
}

async function focusCommentBox() {
  await commentBoxRef.value?.focus();
  document
    .querySelector<HTMLElement>("[data-comment-box]")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 发送评论
const commentContent = ref<string>("");
const sendCommentLoading = ref(false);
async function sendComment() {
  if (!commentContent.value || commentContent.value === "") {
    message.error("评论内容为空！");
    return;
  }
  if (!discussionList.value?.id) return;
  sendCommentLoading.value = true;
  try {
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
  } catch (err) {
    console.error(err);
    message.error(`评论发送失败：${apiErrorMessage(err)}`);
  } finally {
    sendCommentLoading.value = false;
  }
}

// 发送回复
const sendReplyLoading = ref(false);
async function sendReply() {
  const target = replyTarget.value;
  if (!target) {
    message.warning("请先点某条评论或回复的「回复」来选择对象");
    return;
  }
  const comment = discussionList.value?.comments.nodes?.[target.commentIndex];
  if (!comment?.id || !discussionList.value?.id) return;
  if (replyBody.value.trim() === "") {
    message.error("回复内容为空！");
    return;
  }
  sendReplyLoading.value = true;
  try {
    const res = await discussClient.value?.addReplyToComment(
      discussionList.value.id,
      comment.id,
      replyBody.value,
    );
    if (res?.id) {
      message.success("回复发送成功！");
      appendReply(target.commentIndex, res);
      replyDraft.value = "";
      clearReplyTarget();
    } else {
      message.error("回复发送失败！");
    }
  } catch (err) {
    console.error(err);
    message.error(`回复发送失败：${apiErrorMessage(err)}`);
  } finally {
    sendReplyLoading.value = false;
  }
}

/**
 * 就地追加新回复，代替整页刷新。
 * 好处：滚动位置、展开状态、已加载的分页都保留，发完立刻能看见自己那条。
 */
function appendReply(
  commentIndex: number,
  created: {
    id: string;
    body: string;
    createdAt: string;
    author: { login: string } | null;
  },
) {
  const comment = discussionList.value?.comments.nodes?.[commentIndex];
  if (!comment) return;
  const node: ReplyNodeWithUser = {
    body: created.body,
    createdAt: created.createdAt,
    url: null,
    author: created.author,
    createDate: moment(created.createdAt).toDate(),
    userInfo: null,
  };
  if (comment.replies == null) {
    comment.replies = {
      totalCount: 1,
      nodes: [node],
      pageInfo: { endCursor: null, hasNextPage: false },
      loading: false,
    };
  } else {
    comment.replies.nodes.push(node);
    comment.replies.totalCount = (comment.replies.totalCount ?? 0) + 1;
  }
  const login = created.author?.login;
  if (login) {
    userClient.value
      ?.getUserInfo(login)
      .then((user) => {
        node.userInfo = user;
      })
      .catch(() => undefined);
  }
}

/** 从 GraphQL 错误里取一句能给人看的话 */
function apiErrorMessage(err: unknown) {
  const errors = (
    err as { response?: { errors?: Array<{ message?: string }> } }
  )?.response?.errors;
  return errors?.[0]?.message ?? "请检查网络或登录状态后重试";
}

onMounted(async () => {
  accessToken.value = localStorage.getItem("access_token");
  if (accessToken.value == null) {
    message.error("登录状态已失效，请重新登录后再评论");
    return;
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
  () => {
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

/* 从底部回复框滚回原评论时，别被顶部导航挡住 */
.discussion {
  scroll-margin-top: calc(var(--vp-nav-height) + 16px);
}

/*
 * 评论卡片 / 发布框
 *
 * naive 默认描边是 #efeff5，落在月白底上几乎看不见；而 bordered 卡片本身不投影，
 * 所以整块"糊"在页面上，既没有边界也没有层次。这里补三件事：
 *   1. 描边换成天青线（--dds-c-card-* 见 style.css），浅色衬白卡 3.0:1、深色衬夜岫 3.2:1；
 *   2. 接触阴影 + 环境阴影两层叠加，卡片才有"浮起来"的立体感；
 *   3. 圆角统一 8px，与底部回复框、文章历史面板保持一致。
 * 深色模式下纯阴影不可见，改由描边 + 顶部内高光把卡片立起来（令牌里已分主题处理）。
 */
.discussion.n-card,
.n-card[data-comment-box] {
  border-color: var(--dds-c-card-border);
  border-radius: 8px;
  /* 卡内面板（回复列表）是直角底色，不裁掉会顶出圆角 */
  overflow: hidden;
  background-color: var(--discuss-bg-color);
  box-shadow: var(--dds-c-card-shadow);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.discussion.n-card:hover,
.n-card[data-comment-box]:hover {
  border-color: var(--dds-c-card-border-hover);
  box-shadow: var(--dds-c-card-shadow-hover);
  transform: translateY(-1px);
}

.discussion--flash {
  animation: discussion-flash 0.9s ease-out;
}

@keyframes discussion-flash {
  0% {
    box-shadow: 0 0 0 3px var(--vp-c-brand-3);
  }

  100% {
    box-shadow: var(--dds-c-card-shadow);
  }
}

.reply-expand-text:hover {
  cursor: pointer;
  text-decoration: underline;
  color: rgb(0, 157, 255);
}

.reply-empty {
  padding: 4px 0 2px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.reply-link {
  margin-left: 10px;
  font-size: 12px;
  color: rgb(0, 157, 255);
}

.reply-link:hover {
  text-decoration: underline;
}

/*
 * 共用回复框：sticky 吸在视口底部。
 * 选 sticky 而不是 fixed —— 手机上 fixed 底栏会和输入法打架，sticky 跟着文档流走。
 * 祖先链上不能有 overflow/transform，否则 sticky 会失效（VitePress 内容区是干净的）。
 */
.reply-dock {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin-top: 12px;
  padding: 10px 12px max(10px, env(safe-area-inset-bottom));
  border: 1px solid var(--dds-c-card-border);
  border-radius: 8px;
  background-color: var(--discuss-bg-color);
  box-shadow: var(--dds-c-card-shadow);
}

.reply-dock--flash {
  animation: reply-dock-flash 0.9s ease-out;
}

@keyframes reply-dock-flash {
  0% {
    box-shadow: 0 0 0 3px var(--vp-c-brand-3);
  }

  100% {
    box-shadow: var(--dds-c-card-shadow);
  }
}

.reply-dock__empty {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.reply-dock__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
}

.reply-dock__kind {
  color: var(--vp-c-text-2);
}

.reply-dock__who {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.reply-dock__thread {
  color: var(--vp-c-text-3);
}

.reply-dock__tip {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
}
</style>
