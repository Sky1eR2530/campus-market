<script setup lang="ts">
import type { Category, Item } from '@campus/shared'
import { APP_NAME, APP_TAGLINE } from '@campus/shared'
import { fetchCategories, fetchItems } from '@campus/api-client'
import { AppIcon, useAsync } from '@campus/ui'
import type { IconName } from '@campus/ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryCard from '@/components/business/CategoryCard.vue'
import ItemGrid from '@/components/business/ItemGrid.vue'
import SearchBar from '@/components/business/SearchBar.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const keyword = ref('')

const categories = useAsync<Category[]>(fetchCategories)
const latest = useAsync(() => fetchItems({ sort: 'latest', pageSize: 8 }))

usePageMeta(`${APP_NAME} · ${APP_TAGLINE}`)

const latestItems = computed<Item[]>(() => latest.data.value?.data ?? [])
const categoryList = computed<Category[]>(() => categories.data.value ?? [])

interface QuickEntry {
  label: string
  icon: IconName
  to: { name: string }
  /** 需要登录才能使用 */
  private?: boolean
}

const QUICK_ENTRIES: QuickEntry[] = [
  { label: '发布闲置', icon: 'camera', to: { name: 'publish' }, private: true },
  { label: '我的收藏', icon: 'heart', to: { name: 'me-favorites' }, private: true },
  { label: '我的发布', icon: 'inbox', to: { name: 'me-items' }, private: true },
  { label: '全部分类', icon: 'grid', to: { name: 'categories' } }
]

/**
 * 三条平台说明。
 * 这里刻意不用四张一模一样的功能卡片——那是最容易让页面看起来像模板的做法。
 * 用平铺的短句反而更像产品自己在说话。
 */
const INTRO: { title: string; body: string }[] = [
  {
    title: '卖家就在同一个校园里',
    body: '约在宿舍楼下、食堂门口就能看货，不用寄快递，也不用等物流。'
  },
  {
    title: '图片是卖家自己拍的',
    body: '成色和细节一眼就能看清，省掉来回追问的时间。'
  },
  {
    title: '价格就是实价',
    body: '二手就是二手，标多少是多少，不玩先涨后降那一套。'
  }
]

function onSearch(value: string): void {
  void router.push(value ? { name: 'search', query: { q: value } } : { name: 'search' })
}

function goQuick(entry: QuickEntry): void {
  // 需要登录的入口在未登录时先引导登录，登录后自动回到目标页面
  if (entry.private && !auth.isAuthenticated) {
    void router.push({ name: 'login', query: { redirect: '/' } })
    return
  }
  void router.push({ name: entry.to.name })
}
</script>

<template>
  <div class="home">
    <!--
      首屏不放「大数字 + 统计条 + 渐变装饰」那一套。
      这里是个市场，最有说服力的东西是货，所以把最新发布直接提到首屏下面。
    -->
    <section class="hero">
      <div class="container hero__inner">
        <!--
          用两个内联块控制断行位置：中文可以任意字间换行，
          不控制的话标题会在「交」字处断开，把「交给」这个词切开。
        -->
        <h1 class="hero__title">
          <span class="hero__title-part">把用不上的，</span>
          <span class="hero__title-part">交给正需要的同学</span>
        </h1>
        <p class="hero__lede">
          同校当面交易，不用寄快递，也不用等物流。
        </p>

        <div class="hero__search">
          <SearchBar
            v-model="keyword"
            size="lg"
            label="首页搜索"
            placeholder="搜书名、数码、生活用品…"
            @submit="onSearch"
          />
        </div>

        <ul class="quick">
          <li v-for="entry in QUICK_ENTRIES" :key="entry.label">
            <button class="quick__item" type="button" @click="goQuick(entry)">
              <AppIcon :name="entry.icon" :size="16" />
              <span>{{ entry.label }}</span>
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section class="container section">
      <header class="section__head">
        <h2 class="section__title">按分类逛</h2>
        <RouterLink class="section__more" :to="{ name: 'categories' }">全部分类</RouterLink>
      </header>

      <div v-if="categories.loading.value" class="category-grid">
        <span v-for="index in 6" :key="index" class="skeleton category-skeleton" />
      </div>
      <div v-else class="category-grid">
        <CategoryCard v-for="category in categoryList" :key="category.slug" :category="category" />
      </div>
    </section>

    <section class="container section">
      <header class="section__head">
        <h2 class="section__title">最新发布</h2>
        <RouterLink class="section__more" :to="{ name: 'items' }">查看全部</RouterLink>
      </header>

      <ItemGrid
        :items="latestItems"
        :loading="latest.loading.value"
        :error="latest.error.value"
        :skeleton-count="8"
        empty-title="还没有人发布闲置"
        empty-description="成为第一个发布的人，把你的闲置交给需要的同学。"
        @retry="latest.run"
      >
        <template #empty>
          <RouterLink class="btn btn--primary btn--md" :to="{ name: 'publish' }">
            <AppIcon name="plus" :size="16" />
            <span>发布闲置</span>
          </RouterLink>
        </template>
      </ItemGrid>
    </section>

    <section class="container section intro">
      <h2 class="section__title">为什么用{{ APP_NAME }}</h2>
      <div class="intro__grid">
        <div v-for="entry in INTRO" :key="entry.title" class="intro__item">
          <h3 class="intro__title">{{ entry.title }}</h3>
          <p class="intro__body">{{ entry.body }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-block: var(--space-6) var(--space-5);
  background: var(--color-primary-50);
  border-bottom: 1px solid var(--border-default);
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.hero__title {
  font-size: 1.375rem;
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  line-height: 1.28;
}

.hero__title-part {
  display: inline-block;
}

.hero__lede {
  max-width: 38rem;
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.hero__search {
  width: 100%;
  max-width: 560px;
  margin-top: var(--space-1);
}

/* ---------- 快捷入口：一行文字按钮，不做成一组卡片 ---------- */
.quick {
  /* 移动端两列，避免四个按钮断成 3+1 这种像是意外换行的排布 */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-items: start;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.quick__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--color-primary-200);
  color: var(--color-primary-700);
  font-size: var(--text-sm);
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.quick__item:hover {
  background: var(--bg-surface);
  border-color: var(--color-primary-400);
}

/* ---------- 区块 ---------- */
.section {
  margin-top: var(--space-8);
}

.section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.section__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.section__more {
  flex: none;
  font-size: var(--text-sm);
  color: var(--color-primary-600);
}

.section__more:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.category-skeleton {
  height: 104px;
  border-radius: var(--radius-lg);
}

/* ---------- 平台说明：平铺短句，不是一组卡片 ---------- */
.intro__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  margin-top: var(--space-4);
}

.intro__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  margin-bottom: var(--space-1);
}

.intro__body {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

@media (min-width: 768px) {
  .hero {
    padding-block: var(--space-10) var(--space-8);
  }

  .hero__title {
    font-size: 2rem;
  }

  .hero__lede {
    font-size: var(--text-md);
  }

  .category-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .quick {
    grid-template-columns: repeat(4, auto);
    justify-content: start;
  }

  .intro__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-8);
  }

  .section {
    margin-top: var(--space-12);
  }
}
</style>
