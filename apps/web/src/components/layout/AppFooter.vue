<script setup lang="ts">
import { APP_DESCRIPTION, APP_NAME, CATEGORY_SEED } from '@campus/shared'
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <p class="footer__name">{{ APP_NAME }}</p>
        <p class="footer__desc">{{ APP_DESCRIPTION }}</p>
      </div>

      <nav class="footer__group" aria-label="商品分类">
        <p class="footer__title">商品分类</p>
        <RouterLink
          v-for="category in CATEGORY_SEED"
          :key="category.slug"
          class="footer__link"
          :to="{ name: 'items', query: { category: category.slug } }"
        >
          {{ category.name }}
        </RouterLink>
      </nav>

      <nav class="footer__group" aria-label="平台信息">
        <p class="footer__title">平台</p>
        <RouterLink class="footer__link" :to="{ name: 'categories' }">全部分类</RouterLink>
        <RouterLink class="footer__link" :to="{ name: 'items' }">闲置列表</RouterLink>
        <RouterLink class="footer__link" :to="{ name: 'publish' }">发布闲置</RouterLink>
      </nav>
    </div>

    <div class="container footer__bottom">
      <p>© {{ new Date().getFullYear() }} {{ APP_NAME }} · 校园闲置与生活信息服务平台</p>
      <p class="footer__note">本站为校园项目演示环境，交易请在校内当面完成。</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  background: var(--bg-surface);
  border-top: 1px solid var(--border-default);
}

.footer__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

.footer__name {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--color-primary-600);
}

.footer__desc {
  margin-top: var(--space-2);
  max-width: 44ch;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
}

.footer__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.footer__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.footer__link {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  width: fit-content;
}

.footer__link:hover {
  color: var(--color-primary-600);
}

.footer__bottom {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-8);
  padding-block: var(--space-5);
  border-top: 1px solid var(--color-neutral-100);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.footer__note {
  color: var(--text-tertiary);
}

@media (min-width: 768px) {
  .footer__inner {
    grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
    gap: var(--space-10);
  }

  .footer__bottom {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
