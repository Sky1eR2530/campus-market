<script setup lang="ts">
import AppIcon from './AppIcon.vue'

export interface SelectOption {
  value: string
  label: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    label: '',
    placeholder: '请选择',
    error: '',
    hint: '',
    required: false,
    disabled: false
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string]; blur: [] }>()

const uid = `select-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${uid}-error`
const hintId = `${uid}-hint`

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="field">
    <div v-if="label" class="field__head">
      <label class="field__label" :for="uid">
        {{ label }}<span v-if="required" class="field__required" aria-hidden="true">*</span>
      </label>
    </div>

    <select
      :id="uid"
      class="field__control"
      :class="{ 'field__control--error': Boolean(error) }"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-invalid="Boolean(error) || undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      @change="onChange"
      @blur="emit('blur')"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" :id="errorId" class="field__message field__message--error" role="alert">
      <AppIcon name="alert" :size="14" />{{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="field__message field__message--hint">{{ hint }}</p>
  </div>
</template>
