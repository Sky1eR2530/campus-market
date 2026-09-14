<script setup lang="ts">
import { loginSchema } from '@campus/shared'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEMO_ACCOUNT } from '@/config/demo'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { AppButton, AppIcon } from '@campus/ui'
import AppInput from '@/components/ui/AppInput.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@campus/api-client'
import { shouldShowError, validate } from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const submitting = ref(false)

usePageMeta('登录')

function errorFor(field: string): string {
  const message = errors[field] ?? ''
  return shouldShowError(Boolean(touched[field]), submitted.value, message) ? message : ''
}

function touch(field: string): void {
  touched[field] = true
  const result = validate(loginSchema, { ...form })
  for (const key of Object.keys(errors)) delete errors[key]
  if (!result.ok) Object.assign(errors, result.errors)
}

/** 演示环境专用：一键填入演示账号，方便快速体验完整流程 */
function fillDemoAccount(): void {
  form.email = DEMO_ACCOUNT.email
  form.password = DEMO_ACCOUNT.password
  touched.email = true
  touched.password = true
  touch('email')
}

async function onSubmit(): Promise<void> {
  submitted.value = true
  const result = validate(loginSchema, { ...form })
  for (const key of Object.keys(errors)) delete errors[key]
  if (!result.ok) {
    Object.assign(errors, result.errors)
    return
  }

  submitting.value = true
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password })
    toast.success(`欢迎回来，${user.nickname}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    toast.error(toErrorMessage(error, '登录失败，请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <header class="head">
      <h1 class="head__title">登录</h1>
      <p class="head__desc">登录后即可发布闲置、收藏商品并管理你的发布。</p>
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
        @blur="touch('email')"
      />

      <AppInput
        v-model="form.password"
        label="密码"
        type="password"
        placeholder="请输入密码"
        autocomplete="current-password"
        required
        :error="errorFor('password')"
        @blur="touch('password')"
        @enter="onSubmit"
      />

      <AppButton type="submit" size="lg" block :loading="submitting">登录</AppButton>
    </form>

    <div class="demo">
      <div class="demo__text">
        <AppIcon name="info" :size="15" />
        <span>演示账号：{{ DEMO_ACCOUNT.email }} / {{ DEMO_ACCOUNT.password }}</span>
      </div>
      <button class="demo__fill" type="button" @click="fillDemoAccount">一键填入</button>
    </div>

    <p class="foot">
      <span>还没有账号？</span>
      <RouterLink class="foot__link" :to="{ name: 'register', query: route.query }">
        注册新账号
      </RouterLink>
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

.demo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px dashed var(--color-primary-200);
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
}

.demo__text {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-primary-800);
  line-height: var(--leading-normal);
}

.demo__fill {
  flex: none;
  margin-left: auto;
  padding: 5px var(--space-3);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--color-primary-700);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-xs);
}

.demo__fill:hover {
  background: var(--color-primary-100);
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
