<template>
  <div style="display: flex; flex-direction: column; margin: 20px;">
    <NCard style="border: 1px solid">
        <template #header>
          <div style="display: flex; flex-direction: row; gap: 10px; align-items: center;">
            <NAvatar :src="avatar" round/> 
            <a :href="url" class="jump-to-friend" >{{ name }}</a>
          </div>
        </template>
        <template #default>
          <slot></slot>
        </template>
    </NCard>
  </div>
</template>
<script setup lang="ts">
import { NAvatar } from 'naive-ui';

const props = defineProps({
  url: String,
  avatar: String,
  name: String,
  owner: String,
  introduction: String
})
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