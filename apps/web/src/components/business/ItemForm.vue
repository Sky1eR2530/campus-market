<script setup lang="ts">
import type { Category, CreateItemPayload, Item } from '@campus/shared'
import {
  CATEGORY_SEED,
  DESCRIPTION_MAX,
  MAX_ITEM_IMAGES,
  TITLE_MAX,
  itemFormSchema
} from '@campus/shared'
import { computed, reactive, ref, watch } from 'vue'
import { fetchCategories } from '@campus/api-client'
import { AppButton, AppIcon, AppSkeleton, CATEGORY_ICON_NAMES, useAsync } from '@campus/ui'
import AppImageUploader from '@/components/ui/AppImageUploader.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import { centsToYuanInput, yuanToCents } from '@campus/shared'
import { shouldShowError, validate } from '@/utils/validation'

/**
 * 发布与编辑共用同一个表单。
 * 两个页面的字段、校验、交互完全一致，差别只有初始值和提交动作，
 * 因此通过 props / emit 区分，而不是复制一份代码。
 */
const props = withDefaults(
  defineProps<{
    /** 编辑时传入，发布时为 null */
    initial?: Item | null
    submitting?: boolean
    submitText?: string
    cancelText?: string
  }>(),
  { initial: null, submitting: false, submitText: '确认发布', cancelText: '取消' }
)

const emit = defineEmits<{
  submit: [payload: CreateItemPayload]
  cancel: []
}>()

const categories = useAsync<Category[]>(fetchCategories)

const form = reactive({
  title: '',
  categorySlug: '',
  price: '',
  description: '',
  images: [] as string[]
})

const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)

const categoryOptions = computed<Category[]>(() => {
  const list = categories.data.value ?? []
  // 分类还在加载时先用种子数据渲染，避免分类区域出现空洞
  if (list.length) return list
  return CATEGORY_SEED.map((item, index) => ({
    id: index + 1,
    slug: item.slug,
    name: item.name,
    icon: item.icon,
    sortOrder: item.sortOrder,
    itemCount: 0
  }))
})

const categoriesLoading = computed(
  () => categories.loading.value && (categories.data.value ?? []).length === 0
)

function fillFrom(item: Item | null | undefined): void {
  if (!item) return
  form.title = item.title
  form.categorySlug = item.categorySlug
  form.price = centsToYuanInput(item.priceCents)
  form.description = item.description
  form.images = item.images.map((image) => image.url)
}

watch(() => props.initial, fillFrom, { immediate: true })

function clearErrors(): void {
  for (const key of Object.keys(errors)) delete errors[key]
}

function validateForm(): boolean {
  const result = validate(itemFormSchema, { ...form })
  clearErrors()
  if (!result.ok) {
    Object.assign(errors, result.errors)
    return false
  }
  return true
}

function errorFor(field: string): string {
  const message = errors[field] ?? ''
  return shouldShowError(Boolean(touched[field]), submitted.value, message) ? message : ''
}

function touch(field: string): void {
  touched[field] = true
  validateForm()
}

function pickCategory(slug: string): void {
  form.categorySlug = slug
  touch('categorySlug')
}

function onSubmit(): void {
  submitted.value = true
  if (!validateForm()) {
    // 长表单出错时把视图滚到第一个出错字段，用户不用自己找
    const firstField = Object.keys(errors)[0]
    if (firstField) {
      document
        .querySelector<HTMLElement>(`[data-field="${firstField}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    priceCents: yuanToCents(form.price),
    categorySlug: form.categorySlug,
    images: [...form.images]
  })
}
</script>

<template>
  <form class="item-form" novalidate @submit.prevent="onSubmit">
    <section class="item-form__block" data-field="images">
      <AppImageUploader v-model="form.images" :max="MAX_ITEM_IMAGES" :error="errorFor('images')" />
    </section>

    <section class="item-form__block" data-field="title">
      <AppInput
        v-model="form.title"
        label="商品名称"
        placeholder="例如：iPad Air 5 64G 深空灰"
        required
        :maxlength="TITLE_MAX"
        show-count
        :error="errorFor('title')"
        hint="写清品牌、型号和成色，买家一眼就能看懂"
        @blur="touch('title')"
      />
    </section>

    <section class="item-form__block" data-field="categorySlug">
      <p class="item-form__label">
        <span>商品分类</span>
        <span class="field__required" aria-hidden="true">*</span>
      </p>

      <div v-if="categoriesLoading" class="item-form__chips">
        <AppSkeleton v-for="index in 6" :key="index" width="88px" height="36px" radius="999px" />
      </div>
      <div v-else class="item-form__chips">
        <button
          v-for="category in categoryOptions"
          :key="category.slug"
          class="chip"
          :class="{ 'chip--active': form.categorySlug === category.slug }"
          type="button"
          :aria-pressed="form.categorySlug === category.slug"
          @click="pickCategory(category.slug)"
        >
          <AppIcon :name="CATEGORY_ICON_NAMES[category.icon] ?? 'box'" :size="15" />
          <span>{{ category.name }}</span>
        </button>
      </div>

      <p v-if="errorFor('categorySlug')" class="field__message field__message--error" role="alert">
        <AppIcon name="alert" :size="14" />
        <span>{{ errorFor('categorySlug') }}</span>
      </p>
    </section>

    <section class="item-form__block" data-field="price">
      <div class="price-field">
        <AppInput
          v-model="form.price"
          label="出售价格"
          placeholder="0.00"
          required
          :error="errorFor('price')"
          hint="单位为元，最多两位小数"
          @blur="touch('price')"
        />
        <span class="price-field__unit">元</span>
      </div>
    </section>

    <section class="item-form__block" data-field="description">
      <AppTextarea
        v-model="form.description"
        label="商品描述"
        placeholder="说明成色、购买时间、配件是否齐全、交易方式等"
        required
        :maxlength="DESCRIPTION_MAX"
        :error="errorFor('description')"
        hint="写清成色、配件和是否支持当面验货，成交会快很多"
        @blur="touch('description')"
      />
    </section>

    <footer class="item-form__actions">
      <AppButton variant="secondary" size="lg" type="button" @click="emit('cancel')">
        {{ cancelText }}
      </AppButton>
      <AppButton size="lg" type="submit" :loading="submitting">{{ submitText }}</AppButton>
    </footer>
  </form>
</template>

<style scoped>
.item-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-form__block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-form__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.item-form__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.price-field {
  position: relative;
}

.price-field__unit {
  position: absolute;
  top: 37px;
  right: 14px;
  font-size: var(--text-base);
  color: var(--text-tertiary);
  pointer-events: none;
}

.item-form__actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.item-form__actions > :deep(*) {
  flex: 1;
}

@media (min-width: 768px) {
  .item-form__actions {
    justify-content: flex-end;
  }

  .item-form__actions > :deep(*) {
    flex: none;
    min-width: 140px;
  }
}
</style>
