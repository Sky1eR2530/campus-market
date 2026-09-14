<script setup lang="ts">
import { profileSchema } from '@campus/shared'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { updateProfile } from '@campus/api-client'
import { AppButton, AppIcon } from '@campus/ui'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@campus/api-client'
import { shouldShowError, validate } from '@/utils/validation'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({
  nickname: auth.user?.nickname ?? '',
  school: auth.user?.school ?? '',
  campus: auth.user?.campus ?? '',
  contact: auth.user?.contact ?? '',
  bio: auth.user?.bio ?? ''
})

const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const submitting = ref(false)

function errorFor(field: string): string {
  const message = errors[field] ?? ''
  return shouldShowError(Boolean(touched[field]), submitted.value, message) ? message : ''
}

function runValidation(): void {
  const result = validate(profileSchema, { ...form })
  for (const key of Object.keys(errors)) delete errors[key]
  if (!result.ok) Object.assign(errors, result.errors)
}

function touch(field: string): void {
  touched[field] = true
  runValidation()
}

async function onSubmit(): Promise<void> {
  submitted.value = true
  runValidation()
  if (Object.keys(errors).length > 0) return

  submitting.value = true
  try {
    const user = await updateProfile({
      nickname: form.nickname.trim(),
      school: form.school.trim(),
      campus: form.campus.trim(),
      contact: form.contact.trim(),
      bio: form.bio.trim()
    })
    auth.setUser(user)
    toast.success('资料已保存')
    await router.push({ name: 'me' })
  } catch (error) {
    toast.error(toErrorMessage(error, '保存失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="profile-edit">
    <header class="head">
      <h1 class="head__title">编辑资料</h1>
      <p class="head__desc">信息完整能让交易更顺利，尤其是联系方式和所在校区。</p>
    </header>

    <form class="card card--pad form" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="form.nickname"
        label="昵称"
        placeholder="同学们怎么称呼你"
        required
        :maxlength="20"
        :error="errorFor('nickname')"
        @blur="touch('nickname')"
      />

      <div class="form__row">
        <AppInput
          v-model="form.school"
          label="学校"
          placeholder="例如：云川大学"
          :maxlength="50"
          :error="errorFor('school')"
          @blur="touch('school')"
        />
        <AppInput
          v-model="form.campus"
          label="校区"
          placeholder="例如：东湖校区"
          :maxlength="50"
          :error="errorFor('campus')"
          @blur="touch('campus')"
        />
      </div>

      <AppInput
        v-model="form.contact"
        label="联系方式"
        placeholder="例如：微信 your_wechat"
        :maxlength="100"
        :error="errorFor('contact')"
        hint="仅对已登录用户展示，不会出现在公开列表中"
        @blur="touch('contact')"
      />

      <AppTextarea
        v-model="form.bio"
        label="个人简介"
        placeholder="简单介绍一下自己，例如所在院系、交易习惯"
        :maxlength="200"
        :rows="3"
        :error="errorFor('bio')"
        @blur="touch('bio')"
      />

      <div class="form__readonly">
        <AppIcon name="info" :size="15" />
        <span>登录邮箱 {{ auth.user?.email }} 暂不支持修改。</span>
      </div>

      <footer class="form__actions">
        <AppButton variant="secondary" size="lg" type="button" @click="router.back()">取消</AppButton>
        <AppButton size="lg" type="submit" :loading="submitting">保存修改</AppButton>
      </footer>
    </form>
  </section>
</template>

<style scoped>
.profile-edit {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.head__title {
  font-size: var(--text-lg);
}

.head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.form__readonly {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.form__actions {
  display: flex;
  gap: var(--space-3);
}

.form__actions > :deep(*) {
  flex: 1;
}

@media (min-width: 768px) {
  .head__title {
    font-size: var(--text-xl);
  }

  .form__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form__actions {
    justify-content: flex-end;
  }

  .form__actions > :deep(*) {
    flex: none;
    min-width: 140px;
  }
}
</style>
