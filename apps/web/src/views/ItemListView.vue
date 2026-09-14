<script setup lang="ts">
import type { Category, ItemQuery, SortOption } from '@campus/shared'
import { DEFAULT_SORT, PAGE_SIZE, SORT_OPTIONS } from '@campus/shared'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCategories } from '@/api/categories'
import { fetchItems } from '@/api/items'
import ItemGrid from '@/components/business/ItemGrid.vue'
import SearchBar from '@/components/business/SearchBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'

/**
 * 商品列表。
 * /items 与 /search 复用同一个组件：数据来源、筛选、排序、分页完全一致，
 * 差别只在标题文案和是否常驻搜索框，没必要写两份。
 * 所有筛选条件都同步到 URL，刷新或分享链接都能还原同样的结果。
 */
const route = useRoute()
const router = useRouter()

const isSearchMode = computed(() => route.name === 'search')

const categories = useAsync<Category[]>(fetchCategories)
const categoryList = computed<Category[]>(() => categories.data.value ?? [])

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function normalizeSort(value: unknown): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : DEFAULT_SORT
}

const query = computed<ItemQuery>(() => {
  const page = Number(str(route.query.page) ?? 1)
  return {
    q: str(route.query.q),
    category: str(route.query.category),
    sort: normalizeSort(str(route.query.sort)),
    status: str(route.query.status) === 'on_sale' ? 'on_sale' : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE
  }
})

const list = useAsync(() => fetchItems(query.value))

// 地址栏变了就重新拉数据（切换分类、排序、翻页、搜索都走这条路径）
watch(() => route.fullPath, () => void list.run())

const keywordInput = ref(str(route.query.q) ?? '')
watch(
  () => route.query.q,
  (value) => {
    keywordInput.value = str(value) ?? ''
  }
)

const items = computed(() => list.data.value?.data ?? [])
const meta = computed(() => list.data.value?.meta ?? null)

const activeCategory = computed(() =>
  categoryList.value.find((category) => category.slug === query.value.category)
)

const heading = computed(() => {
  if (query.value.q) return `“${query.value.q}” 的搜索结果`
  if (activeCategory.value) return activeCategory.value.name
  return isSearchMode.value ? '搜索闲置' : '全部闲置'
})

const emptyTitle = computed(() => {
  if (query.value.q) return '没有找到相关闲置'
  if (activeCategory.value) return `${activeCategory.value.name}下暂时没有闲置`
  return '还没有符合条件的闲置'
})

const emptyDescription = computed(() => {
  if (query.value.q) {
    return '换个关键词试试，例如「键盘」「考研」「自行车」，或者到分类里翻一翻。'
  }
  if (activeCategory.value) {
    return '这个分类暂时还没有人发布，你可以成为第一个。'
  }
  return '换个筛选条件，或者发布你的第一件闲置。'
})

const hasFilters = computed(
  () => Boolean(query.value.q || query.value.category || query.value.status)
)

usePageMeta(computed(() => (isSearchMode.value ? '搜索' : (activeCategory.value?.name ?? '闲置列表'))))

function queryRecord(): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string') result[key] = value
  }
  return result
}

function replaceQuery(next: Record<string, string | undefined>): void {
  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string' && value) cleaned[key] = value
  }
  void router.replace({ name: String(route.name), query: cleaned })
}

/** 改动筛选条件时自动回到第一页，否则会停在一个空页面上 */
function setFilter(patch: Record<string, string | undefined>): void {
  const next = { ...queryRecord(), ...patch }
  delete next.page
  replaceQuery(next)
}

function setPage(page: number): void {
  replaceQuery({ ...queryRecord(), page: page > 1 ? String(page) : undefined })
}

function onSearch(value: string): void {
  setFilter({ q: value || undefined })
}

function onSortChange(event: Event): void {
  setFilter({ sort: (event.target as HTMLSelectElement).value })
}

function onStatusChange(event: Event): void {
  setFilter({ status: (event.target as HTMLInputElement).checked ? 'on_sale' : undefined })
}

function clearFilters(): void {
  keywordInput.value = ''
  replaceQuery({})
}
</script>

<template>
  <div class="container page">
    <div class="list__search" :class="{ 'list__search--always': isSearchMode }">
      <SearchBar
        v-model="keywordInput"
        :placeholder="isSearchMode ? '搜索书名、数码、生活用品…' : '搜索闲置'"
        @submit="onSearch"
      />
    </div>

    <header class="list__head">
      <div>
        <h1 class="list__title">{{ heading }}</h1>
        <p v-if="meta" class="list__count">共 {{ meta.total }} 件闲置</p>
      </div>

      <div class="list__tools">
        <label class="toggle">
          <input
            type="checkbox"
            :checked="query.status === 'on_sale'"
            @change="onStatusChange"
          />
          <span>只看在售</span>
        </label>

        <label class="sort">
          <span class="sr-only">排序方式</span>
          <select class="sort__select" :value="query.sort" @change="onSortChange">
            <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <AppIcon class="sort__icon" name="chevronDown" :size="15" />
        </label>
      </div>
    </header>

    <div class="chip-row list__chips">
      <button
        class="chip"
        :class="{ 'chip--active': !query.category }"
        type="button"
        @click="setFilter({ category: undefined })"
      >
        全部
      </button>
      <button
        v-for="category in categoryList"
        :key="category.slug"
        class="chip"
        :class="{ 'chip--active': query.category === category.slug }"
        type="button"
        @click="setFilter({ category: category.slug })"
      >
        <span>{{ category.name }}</span>
        <span class="chip__count">{{ category.itemCount }}</span>
      </button>
    </div>

    <ItemGrid
      class="list__grid"
      :items="items"
      :loading="list.loading.value"
      :error="list.error.value"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      @retry="list.run"
    >
      <template #empty>
        <button v-if="hasFilters" class="btn btn--secondary btn--md" type="button" @click="clearFilters">
          清除筛选条件
        </button>
        <RouterLink v-else class="btn btn--primary btn--md" :to="{ name: 'publish' }">
          <AppIcon name="plus" :size="16" />
          <span>发布闲置</span>
        </RouterLink>
      </template>
    </ItemGrid>

    <AppPagination
      v-if="meta && !list.loading.value && !list.error.value"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      @update:page="setPage"
    />
  </div>
</template>

<style scoped>
.list__search {
  display: block;
  margin-bottom: var(--space-4);
}

.list__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}

.list__title {
  font-size: var(--text-lg);
}

.list__count {
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.list__tools {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary-600);
  cursor: pointer;
}

.sort {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.sort__select {
  appearance: none;
  height: 36px;
  padding: 0 34px 0 var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.sort__select:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.sort__icon {
  position: absolute;
  right: 11px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.list__chips {
  margin-bottom: var(--space-4);
  padding-bottom: 2px;
}

.chip__count {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.chip--active .chip__count {
  color: rgba(255, 255, 255, 0.75);
}

@media (min-width: 768px) {
  .list__search:not(.list__search--always) {
    display: none;
  }

  .list__title {
    font-size: var(--text-xl);
  }
}
</style>
