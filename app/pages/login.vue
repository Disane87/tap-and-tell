<script setup lang="ts">
/**
 * Owner login page with email and password form.
 */
import { LogIn } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()
const { login, loading } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

/**
 * Handles form submission for owner login.
 */
async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = t('auth.fieldsRequired')
    return
  }

  const success = await login({ email: email.value, password: password.value })
  if (success) {
    toast.success(t('auth.loginSuccess'))
    router.push('/dashboard')
  } else {
    errorMessage.value = t('auth.loginFailed')
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4">
    <Card class="w-full">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{{ t('auth.loginTitle') }}</CardTitle>
        <CardDescription>{{ t('auth.loginDescription') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="email">{{ t('auth.email') }}</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              :placeholder="t('auth.emailPlaceholder')"
              autocomplete="email"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">{{ t('auth.password') }}</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              :placeholder="t('auth.passwordPlaceholder')"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>

          <Button type="submit" class="w-full" :disabled="loading">
            <LogIn v-if="!loading" class="mr-2 h-4 w-4" />
            {{ loading ? t('common.loading') : t('common.login') }}
          </Button>
        </form>

        <p class="mt-4 text-center text-sm text-muted-foreground">
          {{ t('auth.noAccount') }}
          <NuxtLink to="/register" class="text-primary hover:underline">
            {{ t('auth.registerLink') }}
          </NuxtLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
