<script setup lang="ts">
/**
 * Admin login page.
 *
 * Simple password form that authenticates against the admin API.
 * Redirects to admin dashboard on successful login.
 */
import { toast } from 'vue-sonner'

const { t } = useI18n()
const { isAuthenticated, login, initAuth } = useAdmin()
const router = useRouter()

const password = ref('')
const loading = ref(false)
const error = ref('')

/**
 * Handles login form submission.
 */
async function handleLogin(): Promise<void> {
  if (!password.value.trim()) {
    error.value = t('admin.login.passwordRequired')
    return
  }

  loading.value = true
  error.value = ''

  const success = await login(password.value)

  if (success) {
    toast.success(t('admin.login.loginSuccess'))
    router.push('/admin')
  } else {
    error.value = t('admin.login.wrongPassword')
    toast.error(t('admin.login.loginFailed'))
  }

  loading.value = false
}

onMounted(() => {
  initAuth()
  // Redirect if already authenticated
  if (isAuthenticated.value) {
    router.push('/admin')
  }
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="font-display text-2xl">{{ $t('admin.login.title') }}</CardTitle>
        <CardDescription>
          {{ $t('admin.login.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="password">{{ $t('admin.login.password') }}</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              :placeholder="$t('admin.login.passwordPlaceholder')"
              :class="{ 'border-destructive': error }"
              :disabled="loading"
            />
            <p v-if="error" class="text-sm text-destructive">
              {{ error }}
            </p>
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? $t('admin.login.loggingIn') : $t('admin.login.loginButton') }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
