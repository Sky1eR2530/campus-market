<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@campus/ui'
import type { IconName } from '@campus/ui'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'search' | 'number'
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    maxlength?: number
    icon?: IconName
    /** 显示字数统计，配合 maxlength 使用 */
    showCount?: boolean
  }>(),
  {
    label: '',
    placeholder: '',
    type: 'text',
    error: '',
    hint: '',
    required: false,
    disabled: false,
    autocomplete: 'off',
    maxlength: undefined,
    icon: undefined,
    showCount: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  enter: []
}>()

/** 稳定的 id，用于 label 与输入框关联，保证点击标签能聚焦到输入框 */
const uid = `input-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${uid}-error`
const hintId = `${uid}-hint`

const describedBy = computed(() => {
  if (props.error) return errorId
  if (props.hint) return hintId
  return undefined
})

/**
 * 邮箱与密码不应该触发拼写检查：红色波浪线既干扰阅读，
 * 也让密码管理器更容易误判字段用途。
 */
const spellcheck = computed(() =>
  props.type === 'email' || props.type === 'password' ? 'false' : undefined
)

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="field">
    <div v-if="label || (showCount && maxlength)" class="field__head">
      <label v-if="label" class="field__label" :for="uid">
        {{ label }}<span v-if="required" class="field__required" aria-hidden="true">*</span>
      </label>
      <span v-if="showCount && maxlength" class="field__counter">{{ modelValue.length }}/{{ maxlength }}</span>
    </div>

    <div class="control-wrap">
      <AppIcon v-if="icon" class="control-icon" :name="icon" :size="18" />
      <input
        :id="uid"
        class="field__control"
        :class="{ 'field__control--error': Boolean(error), 'has-icon': Boolean(icon) }"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :required="required"
        :aria-invalid="Boolean(error) || undefined"
        :aria-describedby="describedBy"
        :spellcheck="spellcheck"
        @input="onInput"
        @blur="emit('blur')"
        @keyup.enter="emit('enter')"
      />
    </div>

    <p v-if="error" :id="errorId" class="field__message field__message--error" role="alert">
      <AppIcon name="alert" :size="14" />{{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="field__message field__message--hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.control-wrap {
  position: relative;
}

.control-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.has-icon {
  padding-left: 38px;
}
</style>
