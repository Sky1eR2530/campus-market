<script setup lang="ts">
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  toErrorMessage,
  updateAdminCategory
} from '@campus/api-client'
import { createCategorySchema } from '@campus/shared'
import type { AdminCategory } from '@campus/shared'
import {
  AppButton,
  AppErrorState,
  AppIcon,
  AppSkeleton,
  AppTag,
  CATEGORY_ICON_NAMES,
  useAsync
} from '@campus/ui'
import type { IconName } from '@campus/ui'
import { computed, reactive, ref } from 'vue'
import { useAdminToastStore } from '@/stores/toast'

const toast = useAdminToastStore()
const list = useAsync<AdminCategory[]>(fetchAdminCategories)
const rows = computed(() => list.data.value ?? [])

/** 分类图标是自由文本，取不到时回退到通用图标，避免整页因为一个坏值崩掉 */
function categoryIcon(name: string): IconName {
  return CATEGORY_ICON_NAMES[name] ?? 'box'
}

/** 可选图标与共享图标集里的分类图标保持一致 */
const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'device', label: '数码' },
  { value: 'book', label: '书籍' },
  { value: 'mug', label: '生活' },
  { value: 'shirt', label: '服饰' },
  { value: 'pencil', label: '学习' },
  { value: 'box', label: '通用' }
]

// ---------- 新建 ----------
const createForm = reactive({ slug: '', name: '', icon: 'box', sortOrder: 0 })
const createErrors = reactive<Record<string, string>>({})
const creating = ref(false)

async function submitCreate(): Promise<void> {
  const result = createCategorySchema.safeParse({ ...createForm, sortOrder: Number(createForm.sortOrder) })
  for (const key of Object.keys(createErrors)) delete createErrors[key]

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || '_'
      if (!createErrors[field]) createErrors[field] = issue.message
    }
    return
  }

  creating.value = true
  try {
    await createAdminCategory({ ...result.data, isActive: true })
    toast.success(`已新增分类「${result.data.name}」`)
    createForm.slug = ''
    createForm.name = ''
    createForm.icon = 'box'
    createForm.sortOrder = 0
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '新增失败，请重试'))
  } finally {
    creating.value = false
  }
}

// ---------- 行内编辑 ----------
const editingId = ref<number | null>(null)
const editForm = reactive({ name: '', sortOrder: 0 })
const saving = ref(false)

function startEdit(category: AdminCategory): void {
  editingId.value = category.id
  editForm.name = category.name
  editForm.sortOrder = category.sortOrder
}

async function saveEdit(category: AdminCategory): Promise<void> {
  saving.value = true
  try {
    await updateAdminCategory(category.id, {
      name: editForm.name.trim(),
      sortOrder: Number(editForm.sortOrder)
    })
    toast.success('分类已更新')
    editingId.value = null
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '保存失败，请重试'))
  } finally {
    saving.value = false
  }
}

/** 停用后前台不再展示该分类，但已有商品仍然保留，比直接删除安全得多 */
async function toggleActive(category: AdminCategory): Promise<void> {
  try {
    await updateAdminCategory(category.id, { isActive: !category.isActive })
    toast.success(category.isActive ? `已停用「${category.name}」` : `已启用「${category.name}」`)
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '操作失败，请重试'))
  }
}

// ---------- 删除 ----------
const pendingDelete = ref<AdminCategory | null>(null)
const deleting = ref(false)

async function confirmDelete(): Promise<void> {
  const target = pendingDelete.value
  if (!target) return

  deleting.value = true
  try {
    await deleteAdminCategory(target.id)
    toast.success(`已删除分类「${target.name}」`)
    pendingDelete.value = null
    await list.run()
  } catch (error) {
    toast.error(toErrorMessage(error, '删除失败，请重试'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <header class="admin-page-head">
    <div>
      <h1 class="admin-page-head__title">分类管理</h1>
      <p class="admin-page-head__desc">
        分类是数据表而非写死的枚举，新增后前台立即可见，不需要重新部署。
      </p>
    </div>
  </header>

  <section class="admin-card create-card">
    <h2 class="create-card__title">新增分类</h2>
    <form class="create-form" novalidate @submit.prevent="submitCreate">
      <label class="create-form__field">
        <span class="field__label">标识</span>
        <input
          v-model="createForm.slug"
          class="field__control"
          :class="{ 'field__control--error': createErrors.slug }"
          placeholder="英文小写，如 sports"
        />
        <span v-if="createErrors.slug" class="field__message field__message--error">
          <AppIcon name="alert" :size="13" />{{ createErrors.slug }}
        </span>
      </label>

      <label class="create-form__field">
        <span class="field__label">名称</span>
        <input
          v-model="createForm.name"
          class="field__control"
          :class="{ 'field__control--error': createErrors.name }"
          placeholder="如 运动器材"
        />
        <span v-if="createErrors.name" class="field__message field__message--error">
          <AppIcon name="alert" :size="13" />{{ createErrors.name }}
        </span>
      </label>

      <label class="create-form__field create-form__field--narrow">
        <span class="field__label">图标</span>
        <select v-model="createForm.icon" class="admin-toolbar__select">
          <option v-for="option in ICON_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="create-form__field create-form__field--narrow">
        <span class="field__label">排序</span>
        <input v-model.number="createForm.sortOrder" class="field__control" type="number" min="0" />
      </label>

      <AppButton type="submit" :loading="creating">新增</AppButton>
    </form>
  </section>

  <AppErrorState v-if="list.error.value" :message="list.error.value" @retry="list.run" />

  <div v-else class="admin-card">
    <div v-if="list.loading.value" class="skeleton-rows">
      <AppSkeleton v-for="index in 6" :key="index" height="44px" />
    </div>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>标识</th>
            <th>排序</th>
            <th>商品数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="category in rows" :key="category.id">
            <tr>
              <td>
                <div class="category-cell">
                  <span class="category-cell__icon">
                    <AppIcon :name="categoryIcon(category.icon)" :size="16" />
                  </span>
                  <template v-if="editingId === category.id">
                    <input v-model="editForm.name" class="inline-input" />
                  </template>
                  <span v-else>{{ category.name }}</span>
                </div>
              </td>
              <td class="mono">{{ category.slug }}</td>
              <td>
                <input
                  v-if="editingId === category.id"
                  v-model.number="editForm.sortOrder"
                  class="inline-input inline-input--tiny"
                  type="number"
                  min="0"
                />
                <span v-else>{{ category.sortOrder }}</span>
              </td>
              <td>{{ category.itemCount }} 件</td>
              <td>
                <AppTag :tone="category.isActive ? 'success' : 'neutral'">
                  {{ category.isActive ? '启用中' : '已停用' }}
                </AppTag>
              </td>
              <td>
                <div class="admin-table__actions">
                  <template v-if="editingId === category.id">
                    <AppButton size="sm" :loading="saving" @click="saveEdit(category)">保存</AppButton>
                    <AppButton variant="secondary" size="sm" @click="editingId = null">取消</AppButton>
                  </template>
                  <template v-else>
                    <AppButton variant="text" size="sm" @click="toggleActive(category)">
                      <AppIcon :name="category.isActive ? 'eye' : 'refresh'" :size="14" />
                      <span>{{ category.isActive ? '停用' : '启用' }}</span>
                    </AppButton>
                    <AppButton variant="secondary" size="sm" @click="startEdit(category)">
                      <AppIcon name="edit" :size="14" />
                      <span>编辑</span>
                    </AppButton>
                    <AppButton variant="text" size="sm" @click="pendingDelete = category">
                      <AppIcon name="trash" :size="14" />
                      <span>删除</span>
                    </AppButton>
                  </template>
                </div>
              </td>
            </tr>

            <tr v-if="pendingDelete?.id === category.id">
              <td colspan="6" class="inline-cell">
                <div class="admin-inline">
                  <span class="admin-inline__text">
                    确认删除「{{ category.name }}」？分类下还有商品时会拒绝删除。
                  </span>
                  <AppButton variant="danger" size="sm" :loading="deleting" @click="confirmDelete">
                    确认删除
                  </AppButton>
                  <AppButton variant="secondary" size="sm" @click="pendingDelete = null">取消</AppButton>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.create-card {
  padding: var(--space-4);
}

.create-card__title {
  margin-bottom: var(--space-3);
  font-size: var(--text-md);
}

.create-form {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.create-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 160px;
}

.create-form__field--narrow {
  flex: none;
  width: 120px;
}

.create-form > :deep(.btn) {
  margin-top: 22px;
}

.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.inline-cell {
  padding: 0;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.category-cell__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.inline-input {
  width: 140px;
  height: 30px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-primary-300);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  outline: none;
}

.inline-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.inline-input--tiny {
  width: 64px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
</style>
