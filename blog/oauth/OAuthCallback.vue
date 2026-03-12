<!-- Callback.vue -->
<template>
  <NButton v-if="isDev" @click="isProcessing=!isProcessing">测试错误页面</NButton>
  <div class="callback-processing">
    <n-spin v-if="isProcessing" size="large" />
    <n-result
      v-else
      status="error"
      title="登录流程错误"
      description="请通过博客页面的登录按钮重新尝试"
    >
      <template #footer>
        <n-button @click="goHome">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { GithubOauthClient } from '@blog/.vitepress/utils/github/oauth'

const isProcessing = ref(true)
// 测试配置
const isDev = typeof window !== 'undefined' && window.__ENV__.IsDev;

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const env = import.meta.env

  const client = new GithubOauthClient(
    env.VITE_GITHUB_REDIRECT_URI,
    env.VITE_GITHUB_CLIENT_ID
  )
  
  // 正常处理 OAuth 回调...
  try {
    console.log('开始处理 OAuth 回调...')

    if (code && typeof code === "string" && code !== '') {
      console.log("code 获取成功")
    } else {
      console.log(code)
      throw new Error("code 错误")
    }
    
    // 1. 用 code 和 codeVerifier 换取 access_token
    const res = await client.handleCallback(
      code,
      env.VITE_GITHUB_CLIENT_ID,
      env.VITE_GITHUB_REDIRECT_URI
    )
    if (res.error) throw new Error(res.error)

    localStorage.setItem("access_token", res.access_token)
    console.log('成功获取 access token')

    window.location.href = sessionStorage.getItem("callback_blog_url")
    
  } catch (error) {
    console.error('登录失败:', error)
    isProcessing.value = false
  }
})

function goHome() {
  window.location.href = sessionStorage.getItem("callback_blog_url") || '/'
}
</script>