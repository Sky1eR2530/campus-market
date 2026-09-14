<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppIcon, AppSpinner } from '@campus/ui'
import { uploadImage } from '@/api/uploads'
import { useToast } from '@/composables/useToast'
import { toErrorMessage } from '@campus/api-client'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    max?: number
    error?: string
    hint?: string
  }>(),
  { max: 9, error: '', hint: '' }
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const toast = useToast()
const inputRef = ref<HTMLInputElement | null>(null)
const uploadingCount = ref(0)
const isDragging = ref(false)

const canAddMore = computed(() => props.modelValue.length < props.max)
const remaining = computed(() => props.max - props.modelValue.length)
const uid = `uploader-${Math.random().toString(36).slice(2, 9)}`

function openPicker(): void {
  if (!canAddMore.value) {
    toast.info(`最多上传 ${props.max} 张图片`)
    return
  }
  inputRef.value?.click()
}

async function addFiles(files: File[]): Promise<void> {
  if (!files.length) return
  if (!canAddMore.value) {
    toast.info(`最多上传 ${props.max} 张图片，请先删除部分图片`)
    return
  }

  const accepted = files.slice(0, remaining.value)
  if (files.length > accepted.length) {
    toast.info(`最多还能上传 ${remaining.value} 张，已自动忽略多余的图片`)
  }

  uploadingCount.value += accepted.length
  const added: string[] = []

  // 逐张处理：某一张失败不影响其它图片，用户也能看到具体是哪一张出了问题
  for (const file of accepted) {
    try {
      const result = await uploadImage(file)
      added.push(result.url)
    } catch (error) {
      toast.error(toErrorMessage(error, '图片上传失败'))
    } finally {
      uploadingCount.value -= 1
    }
  }

  if (added.length) {
    emit('update:modelValue', [...props.modelValue, ...added])
  }
}

function onSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  void addFiles(Array.from(input.files ?? []))
  // 清空以便再次选择同一个文件时也能触发 change
  input.value = ''
}

function onDrop(event: DragEvent): void {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
    file.type.startsWith('image/')
  )
  if (!files.length) {
    toast.error('请拖入图片文件（JPG / PNG / WebP）')
    return
  }
  void addFiles(files)
}

function removeAt(index: number): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, position) => position !== index)
  )
}

/** 把某张图移到第一位，即设置为列表封面 */
function setCover(index: number): void {
  if (index === 0) return
  const next = [...props.modelValue]
  const [picked] = next.splice(index, 1)
  next.unshift(picked)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="field">
    <div class="field__head">
      <span class="field__label">
        商品图片<span class="field__required" aria-hidden="true">*</span>
      </span>
      <span class="field__counter">{{ modelValue.length }}/{{ max }}</span>
    </div>

    <div
      class="uploader"
      :class="{ 'uploader--dragging': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <ul class="uploader__grid">
        <li v-for="(url, index) in modelValue" :key="`${uid}-${index}`" class="uploader__item">
          <img class="uploader__img" :src="url" :alt="`商品图片 ${index + 1}`" />
          <span v-if="index === 0" class="uploader__cover">封面</span>

          <div class="uploader__actions">
            <button
              v-if="index !== 0"
              class="uploader__action"
              type="button"
              :aria-label="`将第 ${index + 1} 张设为封面`"
              title="设为封面"
              @click="setCover(index)"
            >
              <AppIcon name="sparkle" :size="14" />
            </button>
            <button
              class="uploader__action uploader__action--danger"
              type="button"
              :aria-label="`删除第 ${index + 1} 张图片`"
              title="删除"
              @click="removeAt(index)"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </li>

        <li v-if="uploadingCount > 0" class="uploader__item uploader__item--loading">
          <AppSpinner :size="20" label="图片上传中" />
          <span class="uploader__loading-text">上传中</span>
        </li>

        <li v-if="canAddMore" class="uploader__item uploader__item--add">
          <button class="uploader__add" type="button" @click="openPicker">
            <AppIcon name="camera" :size="22" />
            <span>添加图片</span>
          </button>
        </li>
      </ul>

      <input
        ref="inputRef"
        class="sr-only"
        type="file"
        aria-label="选择商品图片"
        accept="image/jpeg,image/png,image/webp"
        multiple
        tabindex="-1"
        @change="onSelect"
      />
    </div>

    <p v-if="error" class="field__message field__message--error" role="alert">
      <AppIcon name="alert" :size="14" />{{ error }}
    </p>
    <p v-else class="field__message field__message--hint">
      {{ hint || '第一张图作为封面。建议使用真实照片，光线充足、背景干净更容易卖出。' }}
    </p>
  </div>
</template>

<style scoped>
.uploader {
  padding: var(--space-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-25);
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.uploader--dragging {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.uploader__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.uploader__item {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
}

.uploader__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader__cover {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: rgba(20, 26, 34, 0.72);
  color: #fff;
  font-size: var(--text-xs);
}

.uploader__actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 4px;
}

.uploader__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-secondary);
  box-shadow: var(--shadow-xs);
}

.uploader__action:hover {
  color: var(--text-primary);
}

.uploader__action--danger:hover {
  color: var(--color-danger-500);
}

.uploader__item--loading,
.uploader__item--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.uploader__item--loading {
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
}

.uploader__loading-text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.uploader__add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.uploader__add:hover {
  border-color: var(--color-primary-300);
  color: var(--color-primary-600);
}

@media (min-width: 768px) {
  .uploader__grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
