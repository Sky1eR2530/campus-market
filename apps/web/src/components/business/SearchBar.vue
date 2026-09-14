<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon } from '@campus/ui'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    size?: 'md' | 'lg'
    /** 同一页面可能存在多个搜索框时，用不同的无障碍名称区分 */
    label?: string
  }>(),
  { placeholder: '搜索你想要的闲置', size: 'md', label: '搜索商品' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [keyword: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function onSubmit(): void {
  emit('submit', props.modelValue.trim())
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <form
    class="search"
    :class="`search--${size}`"
    role="search"
    :aria-label="label"
    @submit.prevent="onSubmit"
  >
    <AppIcon class="search__icon" name="search" :size="size === 'lg' ? 20 : 18" />
    <input
      ref="inputRef"
      class="search__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      aria-label="搜索商品"
      enterkeyhint="search"
      @input="onInput"
    />
    <button class="search__submit" type="submit">
      <span class="search__submit-text">搜索</span>
      <AppIcon class="search__submit-icon" name="search" :size="16" />
    </button>
  </form>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.search--md {
  height: 40px;
  padding-left: var(--space-3);
}

.search--lg {
  height: 52px;
  padding-left: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.search__icon {
  flex: none;
  color: var(--text-tertiary);
}

.search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-base);
}

.search--lg .search__input {
  font-size: var(--text-md);
}

.search__input::placeholder {
  color: var(--text-placeholder);
}

/* 去掉 search 类型自带的清除按钮，避免和右侧搜索按钮挤在一起 */
.search__input::-webkit-search-cancel-button {
  appearance: none;
}

.search__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 5px;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
  color: #fff;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  transition: background-color var(--transition-fast);
}

.search--md .search__submit {
  width: 32px;
  height: 32px;
}

.search--lg .search__submit {
  height: 42px;
  padding: 0 var(--space-5);
}

.search__submit:hover {
  background: var(--color-primary-700);
}

.search__submit-icon {
  display: block;
}

.search__submit-text {
  display: none;
}

@media (min-width: 768px) {
  .search--md .search__submit {
    width: auto;
    padding: 0 var(--space-4);
  }

  .search__submit-icon {
    display: none;
  }

  .search__submit-text {
    display: block;
  }
}
</style>
