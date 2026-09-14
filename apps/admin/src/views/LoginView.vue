<script setup lang="ts">
import { toErrorMessage } from '@campus/api-client'
import { loginSchema } from '@campus/shared'
import { AppButton, AppIcon } from '@campus/ui'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/auth'

/** 演示环境的管理员账号，由 pnpm db:seed 写入 */
const DEMO_ADMIN = { email: 'admin@campus.edu', password: 'admin1234' }

const auth = useAdminAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const formError = ref('')

function validate(): boolean {
  const result = loginSchema.safeParse({ ...form })
  for (const key of Object.keys(errors)) delete errors[key]
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || '_'
      if (!errors[field]) errors[field] = issue.message
    }
    return false
  }
  return true
}

function fillDemo(): void {
  form.email = DEMO_ADMIN.email
  form.password = DEMO_ADMIN.password
  validate()
}

async function onSubmit(): Promise<void> {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
    void user
  } catch (error) {
    formError.value = toErrorMessage(error, '登录失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login">
    <div class="login__card">
      <div class="login__brand">
        <span class="login__mark"><AppIcon name="shield" :size="22" /></span>
        <div>
          <h1 class="login__title">校园淘管理后台</h1>
          <p class="login__subtitle">仅限管理员登录</p>
        </div>
      </div>

      <form class="login__form" novalidate @submit.prevent="onSubmit">
        <div class="field">
          <label class="field__label" for="admin-email">邮箱</label>
          <input
            id="admin-email"
            v-model="form.email"
            class="field__control"
            :class="{ 'field__control--error': errors.email }"
            type="email"
            autocomplete="email"
            placeholder="admin@campus.edu"
          />
          <p v-if="errors.email" class="field__message field__message--error">
            <AppIcon name="alert" :size="14" />{{ errors.email }}
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="admin-password">密码</label>
          <input
            id="admin-password"
            v-model="form.password"
            class="field__control"
            :class="{ 'field__control--error': errors.password }"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
          <p v-if="errors.password" class="field__message field__message--error">
            <AppIcon name="alert" :size="14" />{{ errors.password }}
          </p>
        </div>

        <p v-if="formError" class="login__error" role="alert">
          <AppIcon name="alert" :size="15" />{{ formError }}
        </p>

        <AppButton type="submit" size="lg" block :loading="submitting">登录</AppButton>
      </form>

      <div class="login__demo">
        <span>演示账号：{{ DEMO_ADMIN.email }} / {{ DEMO_ADMIN.password }}</span>
        <button class="login__fill" type="button" @click="fillDemo">一键填入</button>
      </div>

      <RouterLink class="login__back" :to="{ path: '/' }" @click.prevent="router.push('/')">
        返回前台
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-5);
  background: linear-gradient(160deg, var(--color-neutral-900) 0%, var(--color-neutral-800) 100%);
}

.login__card {
  width: 100%;
  max-width: 380px;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.login__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.login__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: #fff;
}

.login__title {
  font-size: var(--text-lg);
}

.login__subtitle {
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login__error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-danger-50);
  color: var(--color-danger-700);
  font-size: var(--text-sm);
}

.login__demo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px dashed var(--color-primary-200);
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  font-size: var(--text-xs);
  color: var(--color-primary-800);
}

.login__fill {
  flex: none;
  margin-left: auto;
  padding: 4px var(--space-3);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--color-primary-700);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.login__back {
  display: block;
  margin-top: var(--space-5);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.login__back:hover {
  color: var(--color-primary-600);
}
</style>
