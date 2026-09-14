<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AppButton, AppIcon } from '@campus/ui'
import { usePageMeta } from '@/composables/usePageMeta'

const router = useRouter()

usePageMeta('页面不存在')
</script>

<template>
  <div class="container page not-found">
    <!-- 纯装饰：下方的标题已经说明了页面不存在，这里对读屏软件隐藏 -->
    <p class="not-found__code" aria-hidden="true">404</p>
    <h1 class="not-found__title">这个页面不存在</h1>
    <p class="not-found__desc">
      链接可能已经失效，或者商品已被卖家删除。你可以回到首页，或去闲置列表看看。
    </p>

    <div class="not-found__actions">
      <AppButton @click="router.push({ name: 'home' })">
        <AppIcon name="home" :size="16" />
        <span>回到首页</span>
      </AppButton>
      <AppButton variant="secondary" @click="router.push({ name: 'items' })">
        <AppIcon name="grid" :size="16" />
        <span>浏览闲置</span>
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-16);
  text-align: center;
}

.not-found__code {
  font-size: 4rem;
  font-weight: var(--weight-bold);
  /* 大号装饰文字同样需要 3:1 的对比度，浅色水印达不到 */
  color: var(--color-primary-500);
  letter-spacing: -0.04em;
  line-height: 1;
}

.not-found__title {
  font-size: var(--text-xl);
}

.not-found__desc {
  max-width: 40ch;
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
</style>
