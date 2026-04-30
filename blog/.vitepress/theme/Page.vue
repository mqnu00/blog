<template>
  <!-- 保留默认主题的布局 -->
  <DefaultTheme.Layout>
    <!-- 在标题区域插入更新时间 -->
    <template #doc-before>
      <div style="margin-bottom: 30px">
        <NH1>{{ frontmatter.title }}</NH1>
        <div style="display: flex; flex-direction: column">
          <NP>更新时间： {{ frontmatter.date }}</NP>
          <!-- <span>标签：</span> -->
          <div
            v-if="frontmatter.tags"
            style="display: flex; gap: 10px; margin-bottom: 10px"
          >
            <NTag
              v-for="(tag, index) in frontmatter.tags"
              :key="`tag-${index}`"
              size="small"
              type="info"
            >
              {{ tag }}
            </NTag>
          </div>
        </div>
      </div>
      <!-- <p v-if="page.lastUpdated" class="last-updated">
          最后更新：{{ dayjs(page.lastUpdated).format('YYYY-MM-DD HH:mm') }}
        </p> -->
    </template>
    <template #doc-footer-before />
    <template #doc-after>
      <div
        v-if="page.git"
        class="prev-next"
        style="display: flex; flex-direction: column; margin: 20px 0; gap: 10px"
      >
        <div style="font-size: 14px; color: var(--vp-c-text-2)">
          最后一次编辑:
          <NTime
            :time="new Date(page.git.updated as string)"
            type="relative"
          />
        </div>
        <NCollapse
          :key="page.relativePath"
          style="
            background-color: var(--hint-bg-color);
            border-radius: 8px;
            line-height: 30px;
            padding: 10px;
          "
        >
          <NCollapseItem
            title="查看所有历史"
            name="history"
          >
            <NTimeline>
              <template
                v-for="(history, index) in page.git.history"
                :key="`history-${index}`"
              >
                <NTimelineItem
                  type="info"
                  :title="history.message"
                  :time="history.date"
                >
                  <a
                    :href="history.url"
                    target="_blank"
                  >
                    <NTag
                      style="cursor: pointer"
                      type="info"
                      size="small"
                    >{{
                      history.sha.slice(0, 7)
                    }}</NTag>
                  </a>
                </NTimelineItem>
              </template>
            </NTimeline>
          </NCollapseItem>
        </NCollapse>
      </div>
      <ClientOnly>
        <div
          class="prev-next"
          style="
            display: flex;
            flex-direction: column;
            margin: 20px 0;
            gap: 10px;
          "
        >
          <NButton
            v-if="discussion != null && access_token == null"
            @click="githubOauth"
          >
            github登录
          </NButton>
          <Discussion
            v-else-if="discussion != null && access_token != null"
            :discussion="discussion"
          />
        </div>
      </ClientOnly>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
// import dayjs from 'dayjs'
import {
  dateZhCN,
  GlobalComponentConfig,
  GlobalThemeOverrides,
  NButton,
  NConfigProvider,
  NH1,
  NMessageProvider,
  NP,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage,
  zhCN,
} from "naive-ui";
import { GithubOauthClient } from "../utils/github/oauth.js";
import type { CreateDiscussionMutation } from "@blog/.vitepress/utils/github/graphql/github";
import Discussion from "@blog/.vitepress/theme/views/Discussion/Index.vue";
import { GithubDiscussApi } from "../utils/github/discussion.js";
const { page, frontmatter } = useData();
const discussion = computed(() => {
  return frontmatter.value.discussion as NonNullable<
    NonNullable<CreateDiscussionMutation["createDiscussion"]>["discussion"]
  >;
});
const access_token: Ref<string | null> = ref(null);

const message = useMessage();
const env = import.meta.env;

const client = new GithubOauthClient(
  env.VITE_GITHUB_REDIRECT_URI,
  env.VITE_GITHUB_CLIENT_ID,
);
async function githubOauth() {
  if (access_token.value && access_token.value !== "") {
    message.success("已登录！");
    return;
  }

  const url = client.createAuthorizationURL(
    "public_repo,read:user,read:discussion,write:discussion",
  );
  sessionStorage.setItem("callback_blog_url", window.location.href);
  // 跳转 GitHub
  window.location.href = url;
}

if (typeof window !== "undefined") {
  watch(
    () => localStorage.getItem("access_token"),
    (newVal: string | null) => {
      if (newVal != null && newVal !== "") {
        const testClient = new GithubDiscussApi(
          newVal,
          import.meta.env.VITE_GITHUB_DISCUSS_OWNER,
          import.meta.env.VITE_GITHUB_DISCUSS_REP,
          import.meta.env.VITE_GITHUB_REPO_ID,
        );
        testClient.testToken().then((res) => {
          if (res) {
            access_token.value = newVal;
          } else {
            access_token.value = null;
            localStorage.removeItem("access_token");
          }
        });
      }
    },
    { immediate: true },
  );
}
</script>

<style>
.last-updated {
  font-size: 0.9em;
  color: #888;
  margin-top: -0.5em;
}
</style>
