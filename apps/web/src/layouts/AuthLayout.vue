<script setup lang="ts">
import { APP_DESCRIPTION, APP_TAGLINE } from '@campus/shared'
import { AppIcon } from '@campus/ui'
import type { IconName } from '@campus/ui'
import AppLogo from '@/components/layout/AppLogo.vue'

const HIGHLIGHTS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'location', title: '同校交易', desc: '和同校同学当面完成交易，省去快递和等待。' },
  { icon: 'tag', title: '状态清晰', desc: '在售、已售、下架随时更新，不浪费时间问行情。' },
  { icon: 'heart', title: '收藏夹', desc: '看中的先收藏，想好了再联系卖家。' }
]
</script>

<template>
  <div class="auth">
    <section class="auth__brand">
      <div class="auth__brand-inner">
        <AppLogo />
        <h1 class="auth__headline">{{ APP_TAGLINE }}</h1>
        <p class="auth__desc">{{ APP_DESCRIPTION }}</p>

        <ul class="auth__list">
          <li v-for="item in HIGHLIGHTS" :key="item.title" class="auth__item">
            <span class="auth__item-icon"><AppIcon :name="item.icon" :size="18" /></span>
            <span>
              <span class="auth__item-title">{{ item.title }}</span>
              <span class="auth__item-desc">{{ item.desc }}</span>
            </span>
          </li>
        </ul>
      </div>
    </section>

    <section class="auth__main">
      <div class="auth__card">
        <slot />
      </div>
      <RouterLink class="auth__back" :to="{ name: 'home' }">
        <AppIcon name="chevronLeft" :size="15" />
        <span>返回首页</span>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}

.auth__brand {
  display: none;
  padding: var(--space-10);
  background: linear-gradient(160deg, var(--color-primary-700) 0%, var(--color-primary-500) 100%);
  color: #fff;
}

.auth__brand-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 420px;
  margin: auto;
}

.auth__headline {
  font-size: 2rem;
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.auth__desc {
  color: rgba(255, 255, 255, 0.78);
  line-height: var(--leading-relaxed);
}

.auth__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.auth__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.auth__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.16);
}

.auth__item-title {
  display: block;
  font-weight: var(--weight-semibold);
}

.auth__item-desc {
  display: block;
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.72);
}

.auth__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  padding: var(--space-6) var(--container-padding) var(--space-10);
}

.auth__card {
  width: 100%;
  max-width: 400px;
}

.auth__back {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.auth__back:hover {
  color: var(--color-primary-600);
}

@media (min-width: 1024px) {
  .auth {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .auth__brand {
    display: block;
  }

  .auth__main {
    padding: var(--space-10);
  }
}
</style>
