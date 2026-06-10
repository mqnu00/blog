<template>
  <div style="display: flex; flex-direction: column; margin: 20px">
    <NCard
      style="border: 1px solid; cursor: pointer;"
      @click="jumpToFriend"
    >
      <template #header>
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 10px;
            align-items: center;
          "
        >
          <NAvatar
            :src="avatar"
            round
          />
          <template v-if="hideInfo">
            <ClientOnly>
              <NPopover placement="right">
                <template #trigger>
                  <a
                    :href="url"
                    class="jump-to-friend"
                  >{{ name }}</a>
                </template>
                <div>
                  <slot name="hideInfo" />
                </div>
              </NPopover>
            </ClientOnly>
          </template>
          <template v-else>
            <a
              :href="url"
              class="jump-to-friend"
            >{{ name }}</a>
          </template>
          <div
            v-if="introduction != null && introduction != ''"
            style="margin-left: 20px; font-size: 14px;"
          >
            {{ introduction }}
          </div>
        </div>
      </template>
      <template #default>
        <slot />
      </template>
    </NCard>
  </div>
</template>
<script setup lang="ts">
import { NAvatar, NPopover } from "naive-ui";

const props = defineProps({
  url: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  owner: {
    type: String,
    default: "",
  },
  introduction: {
    type: String,
    default: "",
  },
  hideInfo: {
    type: Boolean,
    default: false,
  },
});

const jumpToFriend = () => {
  window.open(props.url)
}
</script>
<style>
.jump-to-friend {
  font-size: 14px;
  color: inherit !important;
  text-decoration: inherit !important;
}

.jump-to-friend:hover {
  text-decoration: underline !important;
  color: rgb(0, 157, 255) !important;
}
</style>
