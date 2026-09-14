<script setup lang="ts">
import { AppIcon } from '@campus/ui'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    rows?: number
    maxlength?: number
  }>(),
  {
    label: '',
    placeholder: '',
    error: '',
    hint: '',
    required: false,
    disabled: false,
    rows: 5,
    maxlength: undefined
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string]; blur: [] }>()

const uid = `textarea-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${uid}-error`
const hintId = `${uid}-hint`

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="field">
    <div v-if="label || maxlength" class="field__head">
      <label v-if="label" class="field__label" :for="uid">
        {{ label }}<span v-if="required" class="field__required" aria-hidden="true">*</span>
      </label>
      <span v-if="maxlength" class="field__counter">{{ modelValue.length }}/{{ maxlength }}</span>
    </div>

    <textarea
      :id="uid"
      class="field__control"
      :class="{ 'field__control--error': Boolean(error) }"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error) || undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      @input="onInput"
      @blur="emit('blur')"
    />

    <p v-if="error" :id="errorId" class="field__message field__message--error" role="alert">
      <AppIcon name="alert" :size="14" />{{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="field__message field__message--hint">{{ hint }}</p>
  </div>
</template>
