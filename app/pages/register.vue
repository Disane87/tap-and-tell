<script setup lang="ts">
/**
 * Owner registration page with email, password, name form and password strength indicator.
 */
import { UserPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()
const { register, loading } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

/**
 * Handles form submission for owner registration.
 */
async function handleRegister() {
  errorMessage.value = ''

  if (!name.value || !email.value || !password.value) {
    errorMessage.value = t('auth.fieldsRequired')
    return
  }

  if (password.value.length < 12) {
    errorMessage.value = t('auth.passwordTooShort')
    return
  }

  const success = await register({
    name: name.value,
    email: email.value,
    password: password.value
  })

  if (success) {
    toast.success(t('auth.registerSuccess'))
    router.push('/dashboard')
  } else {
    errorMessage.value = t('auth.registerFailed')
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4">
    <Card class="w-full">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{{ t('auth.registerTitle') }}</CardTitle>
        <CardDescription>{{ t('auth.registerDescription') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleRegister">
          <div class="space-y-2">
            <Label for="name">{{ t('auth.name') }}</Label>
            <Input
              id="name"
              v-model="name"
              type="text"
              :placeholder="t('auth.namePlaceholder')"
              autocomplete="name"
              required
            />
          </div>

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
              autocomplete="new-password"
              required
            />
            <PasswordStrengthIndicator :password="password" />
            <p v-if="!password" class="text-xs text-muted-foreground">{{ t('auth.passwordHintStrong') }}</p>
          </div>

          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>

          <Button type="submit" class="w-full" :disabled="loading">
            <UserPlus v-if="!loading" class="mr-2 h-4 w-4" />
            {{ loading ? t('common.loading') : t('auth.registerButton') }}
          </Button>
        </form>

        <p class="mt-4 text-center text-sm text-muted-foreground">
          {{ t('auth.hasAccount') }}
          <NuxtLink to="/login" class="text-primary hover:underline">
            {{ t('auth.loginLink') }}
          </NuxtLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
