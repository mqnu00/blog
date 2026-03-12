---
# 禁用所有主题样式，提供一个空白画布
layout: false
---

<script setup>
import OAuthCallback from './OAuthCallback.vue'
</script>

<ClientOnly>
  <OAuthCallback />
</ClientOnly>