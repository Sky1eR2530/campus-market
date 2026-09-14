<script setup lang="ts">
import type { Category, Item } from '@campus/shared'
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@campus/shared'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCategories, fetchItems } from '@campus/api-client'
import CategoryCard from '@/components/business/CategoryCard.vue'
import ItemGrid from '@/components/business/ItemGrid.vue'
import SearchBar from '@/components/business/SearchBar.vue'
import { AppIcon, useAsync } from '@campus/ui'
import type { IconName } from '@campus/ui'
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
const onSaleTotal = computed(() =>
  categoryList.value.reduce((sum, category) => sum + category.itemCount, 0)
)

interface QuickEntry {
  label: string
  hint: string
  icon: IconName
  to: { name: string }
}

const QUICK_ENTRIES: QuickEntry[] = [
  { label: '发布闲置', hint: '拍照上传，一分钟搞定', icon: 'camera', to: { name: 'publish' } },
  { label: '我的收藏', hint: '随时找回心动好物', icon: 'heart', to: { name: 'me-favorites' } },
  { label: '浏览分类', hint: '按类别快速筛选', icon: 'grid', to: { name: 'categories' } },
  { label: '我的发布', hint: '管理状态与信息', icon: 'inbox', to: { name: 'me-items' } }
]

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'location',
    title: '同校交易',
    desc: '卖家和买家都在同一个校园，约在宿舍楼下或食堂就能当面验货。'
  },
  {
    icon: 'camera',
    title: '真实图片',
    desc: '图片由卖家现场拍摄上传，成色和细节一眼看清，不用来回追问。'
  },
  {
    icon: 'tag',
    title: '状态清晰',
    desc: '在售、已售、下架三种状态由卖家随时更新，不必再问「还在吗」。'
  },
  {
    icon: 'shield',
    title: '免费发布',
    desc: '发布和浏览都不收费，卖出之后把状态改成已售即可。'
  }
]

function onSearch(value: string): void {
  void router.push(value ? { name: 'search', query: { q: value } } : { name: 'search' })
}

function goQuick(entry: QuickEntry): void {
  // 需要登录的入口在未登录时先引导登录，登录后自动回到目标页面
  if (!auth.isAuthenticated && ['publish', 'me-favorites', 'me-items'].includes(entry.to.name)) {
    void router.push({ name: 'login', query: { redirect: `/` } })
    return
  }
  void router.push({ name: entry.to.name })
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="container hero__inner">
        <p class="hero__eyebrow">
          <AppIcon name="sparkle" :size="14" />
          <span>{{ APP_TAGLINE }}</span>
        </p>
        <h1 class="hero__title">把用不上的，交给正需要的同学</h1>
        <p class="hero__desc">{{ APP_DESCRIPTION }}</p>

        <div class="hero__search">
          <SearchBar
            v-model="keyword"
            size="lg"
            placeholder="搜索书名、数码、生活用品…"
            @submit="onSearch"
          />
        </div>

        <p class="hero__stats">
          <span>当前在售 {{ onSaleTotal }} 件</span>
          <span class="hero__dot">·</span>
          <span>{{ categoryList.length }} 个分类</span>
        </p>
      </div>
    </section>

    <section class="container quick">
      <ul class="quick__list">
        <li v-for="entry in QUICK_ENTRIES" :key="entry.label">
          <button class="quick__item" type="button" @click="goQuick(entry)">
            <span class="quick__icon"><AppIcon :name="entry.icon" :size="20" /></span>
            <span class="quick__body">
              <span class="quick__label">{{ entry.label }}</span>
              <span class="quick__hint">{{ entry.hint }}</span>
            </span>
            <AppIcon class="quick__arrow" name="chevronRight" :size="16" />
          </button>
        </li>
      </ul>
    </section>

    <section class="container section">
      <header class="section__head">
        <div>
          <h2 class="section-title">按分类逛</h2>
          <p class="section__desc">先选类别，再挑具体商品，找起来更快。</p>
        </div>
        <RouterLink class="section__more" :to="{ name: 'categories' }">
          <span>全部分类</span>
          <AppIcon name="chevronRight" :size="15" />
        </RouterLink>
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
        <div>
          <h2 class="section-title">最新发布</h2>
          <p class="section__desc">刚刚上架的闲置，可能正好是你需要的。</p>
        </div>
        <RouterLink class="section__more" :to="{ name: 'items' }">
          <span>查看全部</span>
          <AppIcon name="chevronRight" :size="15" />
        </RouterLink>
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

    <section class="container section">
      <header class="section__head">
        <div>
          <h2 class="section-title">为什么用{{ APP_NAME }}</h2>
          <p class="section__desc">不追求功能多，只把「同校闲置流转」这件事做顺。</p>
        </div>
      </header>

      <ul class="feature-grid">
        <li v-for="feature in FEATURES" :key="feature.title" class="feature card card--pad">
          <span class="feature__icon"><AppIcon :name="feature.icon" :size="20" /></span>
          <h3 class="feature__title">{{ feature.title }}</h3>
          <p class="feature__desc">{{ feature.desc }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-block: var(--space-8) var(--space-6);
  background: linear-gradient(180deg, var(--color-primary-50) 0%, var(--bg-page) 100%);
  border-bottom: 1px solid var(--border-default);
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 5px var(--space-3);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-primary-200);
  color: var(--color-primary-700);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.hero__title {
  max-width: 20ch;
  font-size: 1.75rem;
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.hero__desc {
  max-width: 46ch;
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.hero__search {
  width: 100%;
  max-width: 560px;
  margin-top: var(--space-2);
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.hero__dot {
  color: var(--color-neutral-300);
}

.quick {
  margin-top: calc(var(--space-5) * -1);
}

.quick__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  background: var(--bg-surface);
  box-shadow: var(--shadow-md);
}

.quick__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.quick__item:hover {
  background: var(--color-primary-50);
}

.quick__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.quick__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick__label {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.quick__hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick__arrow {
  margin-left: auto;
  color: var(--color-neutral-300);
}

.section {
  margin-top: var(--space-10);
}

.section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.section__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.section__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
  font-size: var(--text-sm);
  color: var(--color-primary-600);
}

.section__more:hover {
  color: var(--color-primary-700);
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.category-skeleton {
  height: 72px;
  border-radius: var(--radius-lg);
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.feature {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feature__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.feature__title {
  font-size: var(--text-md);
}

.feature__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

@media (min-width: 768px) {
  .hero {
    padding-block: var(--space-12) var(--space-8);
  }

  .hero__title {
    max-width: 24ch;
    font-size: 2.25rem;
  }

  .hero__desc {
    font-size: var(--text-md);
  }

  .quick__list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .feature-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
