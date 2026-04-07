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
  <template v-for="(discussion, index) in discussionList?.comments.nodes">
    <NCard class="discussion">
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
        <p style="margin-left: 20px;">{{ discussion?.body }}</p>
      </template>
      <template #footer>
        <NCollapse style="background-color: rgb(233 233 238); padding-left: 20px; padding-top: 10px; padding-bottom: 10px;" @item-header-click="expandReply">
          <NCollapseItem title="回复" :name="index">
            <div>
              <NTimeline>
                <template v-for="reply in discussion?.replies?.nodes">
                  <NTimelineItem>
                    {{ reply?.body }}
                  </NTimelineItem>
                </template>
              </NTimeline>
            </div>
          </NCollapseItem>
        </NCollapse>
      </template>
    </NCard>
  </template>
  <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between;" v-if="(count - 1) * 5 < discussionList?.comments.totalCount!">
    <div style="width: 47%; border-top: 1px solid rgb(155 167 167)"></div>
    <NButton text style="font-size: 24px" @click="getDiscussionList">
      <NSpin v-if="discussionListLoading"></NSpin>
      <NIcon v-else>
        <ChevronCircleDown20Regular/>
      </NIcon>
    </NButton>
    <div style="width: 47%; border-top: 1px solid rgb(155 167 167)"></div>
  </div>
</template>
<script setup lang="ts">

import type { CreateDiscussionMutation, GetDiscussionByNumberQuery, GetUserInfoQuery, GetDiscussionCommentReplyQuery, Discussion } from "@blog/.vitepress/utils/github/graphql/github";
import { GithubDiscussApi } from "@blog/.vitepress/utils/github/discussion";
import { CollapseItemHeaderSlotProps, CollapseItemProps, NAvatar, NDivider, NIcon, NPopover, NStatistic, NTimeline, NTimelineItem } from "naive-ui";
import { GithubUserApi } from "@blog/.vitepress/utils/github/user";
import {ChevronCircleDown20Regular} from '@vicons/fluent'
import moment from "moment";
import type {CollapseProps} from 'naive-ui'

type DiscussionType = NonNullable<
  NonNullable<GetDiscussionByNumberQuery["repository"]>["discussion"]
>

// type 使用 & 交叉类型扩展
type DiscussionWithUser = Omit<DiscussionType, 'comments'> & {
  comments: Omit<DiscussionType['comments'], 'nodes'> & {
    nodes: Array<
      NonNullable<DiscussionType['comments']['nodes']>[0] & {
        userInfo?: GetUserInfoQuery["user"];
        createDate?: Date;
        startCount?: number;
        limit?: number;
        replies?: NonNullable<GetDiscussionCommentReplyQuery['node']>["replies"]
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
const discussionListLoading = ref(false)
async function getDiscussionList() {
  loading.value = true
  discussionListLoading.value = true
  if (!discussionList.value) {
    discussionList.value = (await discussClient.value?.getDiscussionByNumber(props.discussion.number, (count.value - 1) * 5, 5))
  } else {
    await discussClient.value?.getDiscussionByNumber(props.discussion.number, (count.value - 1) * 5, 5).then((res) => {
      discussionList.value?.comments.nodes?.push(...res?.comments.nodes!)
    })
  }
  discussionListLoading.value = false
  discussionList.value?.comments.nodes?.forEach(async (comment) => {
    if (comment) {
      comment.userInfo = await userClient.value?.getUserInfo(comment?.author?.login as string)
      comment.createDate = moment(comment.createdAt).toDate()
      comment.startCount = 1;
      comment.limit = 5;
    }
  })
  count.value = count.value + 1
  console.log(discussionList.value)
  loading.value = false
}

async function getDiscussionReply(whichOne: number) {
  const comment = discussionList.value?.comments.nodes![whichOne]
  const res = await discussClient.value?.getDiscussionComment(comment?.id!, (comment?.startCount ?? 0 - 1) * 5, comment?.limit)
  if (comment && comment?.replies == null) {
    comment.replies = res
  } else {
    comment?.replies!.nodes?.push(...res?.nodes!)
  }
}
const expandReply: CollapseProps["onItemHeaderClick"] = (data) => {
  if (data.expanded) {
    if (discussionList.value?.comments.nodes![data.name]?.replies == null) {
      getDiscussionReply(data.name)
    }
  }
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

.discussion .n-card__footer {
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
}
</style>