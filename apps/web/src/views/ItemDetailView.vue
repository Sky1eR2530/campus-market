<script setup lang="ts">
import type { Item, ItemStatus } from '@campus/shared'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteItem, fetchItem, fetchItems, updateItemStatus } from '@campus/api-client'
import FavoriteButton from '@/components/business/FavoriteButton.vue'
import ItemGrid from '@/components/business/ItemGrid.vue'
import ItemStatusTag from '@/components/business/ItemStatusTag.vue'
import PriceText from '@/components/business/PriceText.vue'
import SellerCard from '@/components/business/SellerCard.vue'
import { AppButton, AppEmpty, AppErrorState, AppIcon, AppSkeleton, useAsync } from '@campus/ui'
import AppImage from '@/components/ui/AppImage.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isAppError, toErrorMessage } from '@campus/api-client'
import { formatDateTime } from '@campus/shared'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const itemId = computed(() => String(route.params.id ?? ''))
const notFound = ref(false)

const item = useAsync(async () => {
  notFound.value = false
  try {
    return await fetchItem(itemId.value)
  } catch (error) {
    if (isAppError(error) && error.code === 'ITEM_NOT_FOUND') notFound.value = true
    throw error
  }
})

const detail = computed<Item | null>(() => item.data.value)
const isOwner = computed(() => Boolean(detail.value) && detail.value?.sellerId === auth.user?.id)
const images = computed(() => detail.value?.images ?? [])

const activeImage = ref(0)
watch(itemId, () => {
  activeImage.value = 0
})

const seller = computed(() => detail.value?.seller ?? null)

const similar = useAsync<Item[]>(async () => {
  const current = detail.value
  if (!current) return []
  const result = await fetchItems({ category: current.categorySlug, pageSize: 8 })
  return result.data.filter((entry) => entry.id !== current.id).slice(0, 4)
}, { immediate: false })

watch(detail, (value) => {
  if (value) void similar.run()
})

const contactOpen = ref(false)
const confirmDeleteOpen = ref(false)
const statusUpdating = ref(false)
const deleting = ref(false)

usePageMeta(computed(() => detail.value?.title ?? '商品详情'))

const statusNotice = computed(() => {
  if (!detail.value) return null
  if (detail.value.status === 'sold') {
    return { tone: 'warning' as const, text: '这件商品已经卖出。你可以看看同分类下的其它闲置。' }
  }
  if (detail.value.status === 'off_shelf') {
    return { tone: 'neutral' as const, text: '这件商品已下架，暂时无法购买。' }
  }
  return null
})

function selectImage(index: number): void {
  activeImage.value = index
}

function stepImage(offset: number): void {
  if (!images.value.length) return
  const next = (activeImage.value + offset + images.value.length) % images.value.length
  activeImage.value = next
}

async function openContact(): Promise<void> {
  if (!auth.isAuthenticated) {
    toast.info('登录后即可查看卖家联系方式')
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  contactOpen.value = true
}

async function changeStatus(status: ItemStatus): Promise<void> {
  if (!detail.value) return
  statusUpdating.value = true
  try {
    const updated = await updateItemStatus(detail.value.id, status)
    item.data.value = updated
    toast.success(
      status === 'sold' ? '已标记为已售' : status === 'off_shelf' ? '商品已下架' : '商品已重新上架'
    )
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  } finally {
    statusUpdating.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!detail.value) return
  deleting.value = true
  try {
    await deleteItem(detail.value.id)
    confirmDeleteOpen.value = false
    toast.success('商品已删除')
    await router.push({ name: 'me-items' })
  } catch (error) {
    toast.error(toErrorMessage(error, '删除失败，请重试'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="container page">
    <nav class="breadcrumb" aria-label="位置导航">
      <RouterLink class="breadcrumb__link" :to="{ name: 'items' }">
        <AppIcon name="chevronLeft" :size="15" />
        <span>返回列表</span>
      </RouterLink>
      <template v-if="detail">
        <span class="breadcrumb__sep">/</span>
        <RouterLink
          class="breadcrumb__link"
          :to="{ name: 'items', query: { category: detail.categorySlug } }"
        >
          {{ detail.categoryName }}
        </RouterLink>
      </template>
    </nav>

    <div v-if="item.loading.value" class="detail-loading">
      <AppSkeleton height="320px" radius="12px" />
      <div class="detail-loading__side">
        <AppSkeleton height="28px" width="70%" />
        <AppSkeleton height="36px" width="45%" />
        <AppSkeleton height="120px" radius="12px" />
        <AppSkeleton height="88px" radius="12px" />
      </div>
    </div>

    <AppEmpty
      v-else-if="notFound"
      title="商品不存在或已被删除"
      description="它可能已经被卖家删除，或者链接不正确。"
      icon="inbox"
    >
      <RouterLink class="btn btn--primary btn--md" :to="{ name: 'items' }">去看看其它闲置</RouterLink>
    </AppEmpty>

    <AppErrorState
      v-else-if="item.error.value"
      :message="item.error.value"
      @retry="item.run"
    />

    <template v-else-if="detail">
      <div class="detail">
        <section class="gallery" aria-label="商品图片">
          <div class="gallery__main">
            <AppImage
              :src="images[activeImage]?.url ?? ''"
              :alt="detail.title"
              ratio="4 / 3"
              fit="cover"
              eager
            />
            <button
              v-if="images.length > 1"
              class="gallery__nav gallery__nav--prev"
              type="button"
              aria-label="上一张图片"
              @click="stepImage(-1)"
            >
              <AppIcon name="chevronLeft" :size="18" />
            </button>
            <button
              v-if="images.length > 1"
              class="gallery__nav gallery__nav--next"
              type="button"
              aria-label="下一张图片"
              @click="stepImage(1)"
            >
              <AppIcon name="chevronRight" :size="18" />
            </button>
            <span v-if="images.length > 1" class="gallery__counter">
              {{ activeImage + 1 }} / {{ images.length }}
            </span>
          </div>

          <ul v-if="images.length > 1" class="gallery__thumbs">
            <li v-for="(image, index) in images" :key="image.id">
              <button
                class="gallery__thumb"
                :class="{ 'is-active': index === activeImage }"
                type="button"
                :aria-label="`查看第 ${index + 1} 张图片`"
                @click="selectImage(index)"
              >
                <AppImage :src="image.url" :alt="`${detail.title} 图片 ${index + 1}`" ratio="1 / 1" />
              </button>
            </li>
          </ul>
        </section>

        <section class="info">
          <div v-if="statusNotice" class="notice" :class="`notice--${statusNotice.tone}`">
            <AppIcon name="info" :size="16" />
            <span>{{ statusNotice.text }}</span>
          </div>

          <div class="info__head">
            <ItemStatusTag :status="detail.status" size="lg" />
            <span class="info__category">{{ detail.categoryName }}</span>
          </div>

          <h1 class="info__title">{{ detail.title }}</h1>

          <div class="info__price">
            <PriceText :cents="detail.priceCents" size="xl" :muted="detail.status !== 'on_sale'" />
            <span class="info__price-note">
              <AppIcon name="tag" :size="14" />
              <span>校园当面交易，可现场验货</span>
            </span>
          </div>

          <dl class="info__meta">
            <div>
              <dt>发布时间</dt>
              <dd>{{ formatDateTime(detail.publishedAt) }}</dd>
            </div>
            <div>
              <dt>浏览</dt>
              <dd>{{ detail.viewCount }} 次</dd>
            </div>
            <div>
              <dt>收藏</dt>
              <dd>{{ detail.favoriteCount }} 人</dd>
            </div>
            <div v-if="detail.school || detail.campus">
              <dt>交易校区</dt>
              <dd>{{ [detail.school, detail.campus].filter(Boolean).join(' · ') }}</dd>
            </div>
          </dl>

          <div v-if="!isOwner" class="info__actions">
            <AppButton size="lg" @click="openContact">
              <AppIcon name="inbox" :size="18" />
              <span>联系卖家</span>
            </AppButton>
            <FavoriteButton :item="detail" variant="button" />
          </div>

          <div v-else class="owner">
            <p class="owner__title">这是你发布的商品</p>
            <div class="owner__actions">
              <RouterLink
                class="btn btn--secondary btn--md"
                :to="{ name: 'item-edit', params: { id: detail.id } }"
              >
                <AppIcon name="edit" :size="16" />
                <span>编辑信息</span>
              </RouterLink>

              <AppButton
                v-if="detail.status !== 'sold'"
                variant="secondary"
                :loading="statusUpdating"
                @click="changeStatus('sold')"
              >
                <AppIcon name="check" :size="16" />
                <span>标记已售</span>
              </AppButton>

              <AppButton
                v-if="detail.status === 'on_sale'"
                variant="secondary"
                :loading="statusUpdating"
                @click="changeStatus('off_shelf')"
              >
                <AppIcon name="eye" :size="16" />
                <span>下架</span>
              </AppButton>

              <AppButton
                v-else
                variant="secondary"
                :loading="statusUpdating"
                @click="changeStatus('on_sale')"
              >
                <AppIcon name="refresh" :size="16" />
                <span>重新上架</span>
              </AppButton>

              <AppButton variant="text" @click="confirmDeleteOpen = true">
                <AppIcon name="trash" :size="16" />
                <span>删除</span>
              </AppButton>
            </div>
          </div>

          <section class="card card--pad info__desc">
            <h2 class="info__section-title">商品描述</h2>
            <p class="info__desc-text">{{ detail.description }}</p>
          </section>

          <section class="card card--pad info__seller">
            <h2 class="info__section-title">卖家信息</h2>
            <SellerCard v-if="seller" :seller="seller" />
            <p v-else class="info__desc-text">卖家信息不可用。</p>
          </section>
        </section>
      </div>

      <section v-if="similar.data.value?.length" class="similar">
        <header class="similar__head">
          <h2 class="section-title">同类闲置</h2>
          <RouterLink
            class="similar__more"
            :to="{ name: 'items', query: { category: detail.categorySlug } }"
          >
            <span>更多{{ detail.categoryName }}</span>
            <AppIcon name="chevronRight" :size="15" />
          </RouterLink>
        </header>
        <ItemGrid :items="similar.data.value ?? []" />
      </section>
    </template>

    <AppModal :open="contactOpen" title="联系卖家" @close="contactOpen = false">
      <div v-if="seller" class="contact">
        <SellerCard :seller="seller" />
        <div class="contact__box">
          <p class="contact__label">联系方式</p>
          <p v-if="seller.contact" class="contact__value">{{ seller.contact }}</p>
          <p v-else class="contact__value contact__value--empty">卖家暂未填写联系方式</p>
        </div>
        <p class="contact__tip">
          请在校园内当面交易，验货后再付款。平台不会介入交易，请自行注意财物安全。
        </p>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="删除这件商品？"
      message="删除后商品会从你的列表中移除，且无法恢复。如果只是暂时不卖，建议改为「下架」。"
      confirm-text="删除"
      tone="danger"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmDeleteOpen = false"
    />
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.breadcrumb__link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-tertiary);
}

.breadcrumb__link:hover {
  color: var(--color-primary-600);
}

.breadcrumb__sep {
  color: var(--color-neutral-300);
}

.detail-loading {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.detail-loading__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gallery__main {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  background: var(--bg-surface);
}

.gallery__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
}

.gallery__nav:hover {
  color: var(--text-primary);
}

.gallery__nav--prev {
  left: var(--space-2);
}

.gallery__nav--next {
  right: var(--space-2);
}

.gallery__counter {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  padding: 3px var(--space-2);
  border-radius: var(--radius-full);
  background: rgba(20, 26, 34, 0.6);
  color: #fff;
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.gallery__thumbs {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
}

.gallery__thumbs::-webkit-scrollbar {
  display: none;
}

.gallery__thumb {
  display: block;
  width: 68px;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.gallery__thumb.is-active {
  border-color: var(--color-primary-600);
}

.info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.notice--warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.notice--neutral {
  background: var(--color-neutral-100);
  color: var(--text-secondary);
}

.info__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.info__category {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.info__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-normal);
}

.info__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-100);
}

.info__price-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.info__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.info__meta dt {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.info__meta dd {
  margin: 2px 0 0;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.info__actions {
  display: flex;
  gap: var(--space-3);
}

.info__actions > :deep(*:first-child) {
  flex: 1;
}

.owner {
  padding: var(--space-4);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-lg);
  background: var(--color-primary-50);
}

.owner__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-primary-800);
}

.owner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.info__section-title {
  margin-bottom: var(--space-3);
  font-size: var(--text-md);
}

.info__desc-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-break: break-word;
}

.similar {
  margin-top: var(--space-10);
}

.similar__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.similar__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  color: var(--color-primary-600);
}

.contact {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.contact__box {
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--color-neutral-25);
}

.contact__label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.contact__value {
  margin-top: var(--space-1);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  word-break: break-all;
}

.contact__value--empty {
  color: var(--text-tertiary);
  font-weight: var(--weight-regular);
}

.contact__tip {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
}

@media (min-width: 1024px) {
  .detail,
  .detail-loading {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: var(--space-6);
    align-items: start;
  }

  .info {
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
    max-height: calc(100vh - var(--header-height) - var(--space-8));
    overflow-y: auto;
    padding-right: var(--space-2);
  }

  .info__title {
    font-size: var(--text-xl);
  }
}
</style>
