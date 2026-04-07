<template>
  <NCard style="height: 300px;">
    <template #header>
      评论
    </template>
    <template #default>
      <NSkeleton height="100%" size="large" v-if="loading === true" />
      <template v-else>
        <NInput style="height: 100%" type="textarea" />
      </template>
    </template>
    <template #footer>

      <NFlex style="justify-content: space-between">
        <div></div>
        <div>
          <NSkeleton :width="80" round size="medium" v-if="loading === true" />
          <NButton v-else>发送</NButton>
        </div>
      </NFlex>
    </template>
  </NCard>
  <div>
    <NStatistic label="评论数" :value="discussionList?.comments.totalCount" />
  </div>
  <template v-for="discussion in discussionList?.comments.nodes">
    <NCard>
      <template #header>
        <div style="display: flex; flex-direction: row; gap: 10px; font-size: 14px;">
          <NAvatar round size="small" :src="discussion?.userInfo?.avatarUrl"/>
          <a class="username" :href="discussion?.userInfo?.url">{{ discussion?.userInfo?.login }}</a>
          <NPopover trigger="hover">
            <template #trigger>
              <NTime :time="discussion?.createDate" type="relative"/>
            </template>
            <NTime :time="discussion?.createDate"/>
          </NPopover>
        </div>
      </template>
      <template #default>
        <p>{{ discussion?.body }}</p>
      </template>
    </NCard>
  </template>
  <div class="prev-next"></div>
</template>
<script setup lang="ts">

import type { CreateDiscussionMutation, GetDiscussionByNumberQuery, GetUserInfoQuery, Discussion } from "@blog/.vitepress/utils/github/graphql/github";
import { GithubDiscussApi } from "@blog/.vitepress/utils/github/discussion";
import { NAvatar, NPopover, NStatistic } from "naive-ui";
import { GithubUserApi } from "@blog/.vitepress/utils/github/user";
import moment from "moment";

type DiscussionType = NonNullable<
  NonNullable<GetDiscussionByNumberQuery["repository"]>["discussion"]
>

// type 使用 & 交叉类型扩展
type DiscussionWithUser = Omit<DiscussionType, 'comments'> & {
  comments: Omit<DiscussionType['comments'], 'nodes'> & {
    nodes: Array<
      NonNullable<DiscussionType['comments']['nodes']>[0] & {
        userInfo?: GetUserInfoQuery["user"];
        createDate?: Date
      } | null
    > | null;  // 保持可以为 null
  };
}

const props = defineProps<{
  discussion: NonNullable<
    NonNullable<CreateDiscussionMutation["createDiscussion"]>["discussion"]
  >,
}>()

const loading = ref(false)

const discussClient: Ref<GithubDiscussApi | null> = ref(null)
const userClient: Ref<GithubUserApi | null> = ref(null)
const accessToken: Ref<string | null> = ref(null)
const discussionList: Ref<DiscussionWithUser | null | undefined> = ref()

const count = ref(1)
async function getDiscussionList() {
  loading.value = true
  discussionList.value = (await discussClient.value?.getDiscussionByNumber(props.discussion.number, (count.value - 1) * 5, 5))
  discussionList.value?.comments.nodes?.forEach(async (comment) => {
    if (comment) {
      console.log(comment?.author?.login)
      comment.userInfo = await userClient.value?.getUserInfo(comment?.author?.login as string)
      comment.createDate = moment(comment.createdAt).toDate()
    }
  })
  count.value = count.value + 1
  console.log(discussionList.value)
  loading.value = false
}

onMounted(async () => {
  accessToken.value = localStorage.getItem("access_token")
  if (accessToken.value == null) {
    throw new Error("access_token 为空")
  }
  discussClient.value = new GithubDiscussApi(
    accessToken.value,
    import.meta.env.VITE_GITHUB_DISCUSS_OWNER,
    import.meta.env.VITE_GITHUB_DISCUSS_REP,
    import.meta.env.VITE_GITHUB_REPO_ID,
  )
  userClient.value = new GithubUserApi(
    accessToken.value,
    import.meta.env.VITE_GITHUB_DISCUSS_OWNER,
    import.meta.env.VITE_GITHUB_DISCUSS_REP
  )
  await getDiscussionList()
})
</script>
<style>
.username {
  font-size: 14px;
}

.username:hover {
  text-decoration: underline;
  color: rgb(0, 157, 255)
}
</style>