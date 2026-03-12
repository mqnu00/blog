<template>
  <!-- 保留默认主题的布局 -->
    <DefaultTheme.Layout>
      <!-- 在标题区域插入更新时间 -->
      <template #doc-before >
        <div style="margin-bottom: 30px;">
          <NH1>{{ frontmatter.title }}</NH1>
          <div style="display: flex; flex-direction: column; ">
            <NP>更新时间： {{ frontmatter.date }}</NP>
            <!-- <span>标签：</span> -->
            <div v-if="frontmatter.tags" style="display: flex; gap: 10px; margin-bottom: 10px;">
              <NTag size="small" type="info" v-for="tag in frontmatter.tags">
                {{tag}}
              </NTag>
            </div>
          </div>
          
        </div>
        <!-- <p v-if="page.lastUpdated" class="last-updated">
          最后更新：{{ dayjs(page.lastUpdated).format('YYYY-MM-DD HH:mm') }}
        </p> -->
      </template>
      <template #doc-footer-before>
        
      </template>
      <template #doc-after>
        <div class="prev-next" v-if="page.git" style="display: flex; flex-direction: column; margin: 20px 0; gap: 10px;">
          <div style="font-size: 14px; color: var(--vp-c-text-2);">
            最后一次编辑:
            <NTime :time="new Date(page.git.updated as string)" type="relative" />
          </div>
          <NCollapse 
            :key="page.relativePath"
            style="
                background-color: rgb(233 233 238); 
                border-radius: 8px; 
                line-height: 30px;
                padding: 10px;
            "
          >
            <NCollapseItem title="查看所有历史" name="history">
              <NTimeline>
                <template v-for="history in page.git.history">
                  <NTimelineItem
                    type="info"
                    :title="history.message"
                    :time="history.date"
                  >
                    <a :href="history.url" target="_blank">
                      <NTag style="cursor: pointer;" type="info" size="small">{{ history.sha.slice(0, 7) }}</NTag>
                    </a>
                  </NTimelineItem>
                </template>
              </NTimeline>
            </NCollapseItem>
          </NCollapse>
        </div>
        <div class="prev-next" v-if="page.git" style="display: flex; flex-direction: column; margin: 20px 0; gap: 10px;">
          <NButton @click="githubOauth">github登录</NButton>
        </div>
      </template>
    </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
// import dayjs from 'dayjs'
import { dateZhCN, GlobalComponentConfig, GlobalThemeOverrides, NButton, NConfigProvider, NH1, NMessageProvider, NP, NTag, NTimeline, NTimelineItem, useMessage, zhCN } from 'naive-ui'
import { GithubOauthClient } from '../utils/github/oauth.js'

const { page, frontmatter} = useData()

const message = useMessage()
const env = import.meta.env

const client = new GithubOauthClient(
  env.VITE_GITHUB_REDIRECT_URI,
  env.VITE_GITHUB_CLIENT_ID
)
async function githubOauth () {
  const access_token = localStorage.getItem('access_token')
  if (access_token && access_token !== '') {
    message.success("已登录！")
    return
  }

  const url = client.createAuthorizationURL("public_repo")
  sessionStorage.setItem("callback_blog_url", window.location.href)
  // 跳转 GitHub
  window.location.href = url
}
</script>

<style>
.last-updated {
  font-size: 0.9em;
  color: #888;
  margin-top: -0.5em;
}

.prev-next {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 24px;
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
}

</style>