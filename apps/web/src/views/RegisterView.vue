<script setup lang="ts">
import { registerSchema } from '@campus/shared'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/utils/error'
import { shouldShowError, validate } from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const submitting = ref(false)

usePageMeta('注册')

/** 密码强度提示：只做引导，不作为硬性门槛（硬性规则在共享 schema 里） */
const passwordHint = computed(() => {
  const value = form.password
  if (!value) return '至少 6 位，建议包含字母和数字'
  const hasLetter = /[a-zA-Z]/.test(value)
  const hasDigit = /\d/.test(value)
  if (value.length >= 8 && hasLetter && hasDigit) return '密码强度：较强'
  if (value.length >= 6 && hasLetter && hasDigit) return '密码强度：中等'
  return '密码强度：较弱，建议再加长一些'
})

function errorFor(field: string): string {
  const message = errors[field] ?? ''
  return shouldShowError(Boolean(touched[field]), submitted.value, message) ? message : ''
}

function runValidation(): void {
  const result = validate(registerSchema, { ...form })
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
    const user = await auth.register({
      email: form.email.trim(),
      nickname: form.nickname.trim(),
      password: form.password
    })
    toast.success(`注册成功，欢迎加入，${user.nickname}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    toast.error(toErrorMessage(error, '注册失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <header class="head">
      <h1 class="head__title">注册</h1>
      <p class="head__desc">用邮箱注册一个账号，就可以发布和管理你的闲置了。</p>
    </header>

    <form class="form" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="form.email"
        label="邮箱"
        type="email"
        placeholder="you@campus.edu"
        autocomplete="email"
        required
        :error="errorFor('email')"
        hint="用于登录，暂不支持找回密码，请牢记"
        @blur="touch('email')"
      />

      <AppInput
        v-model="form.nickname"
        label="昵称"
        placeholder="同学们怎么称呼你"
        autocomplete="nickname"
        required
        :maxlength="20"
        :error="errorFor('nickname')"
        @blur="touch('nickname')"
      />

      <AppInput
        v-model="form.password"
        label="密码"
        type="password"
        placeholder="设置登录密码"
        autocomplete="new-password"
        required
        :error="errorFor('password')"
        :hint="passwordHint"
        @blur="touch('password')"
      />

      <AppInput
        v-model="form.confirmPassword"
        label="确认密码"
        type="password"
        placeholder="再次输入密码"
        autocomplete="new-password"
        required
        :error="errorFor('confirmPassword')"
        @blur="touch('confirmPassword')"
        @enter="onSubmit"
      />

      <AppButton type="submit" size="lg" block :loading="submitting">创建账号</AppButton>
    </form>

    <p class="foot">
      <span>已经有账号了？</span>
      <RouterLink class="foot__link" :to="{ name: 'login', query: route.query }">直接登录</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-5);
}

.head__title {
  font-size: var(--text-xl);
}

.head__desc {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.foot {
  display: flex;
  justify-content: center;
  gap: var(--space-1);
  margin-top: var(--space-5);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.foot__link {
  color: var(--color-primary-600);
  font-weight: var(--weight-medium);
}

.foot__link:hover {
  color: var(--color-primary-700);
}
</style>
