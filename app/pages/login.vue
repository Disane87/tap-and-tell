<script setup lang="ts">
/**
 * Owner login page with email/password form and 2FA verification step.
 */
import { LogIn, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()
const { login, verify2fa, resend2faCode, clear2fa, loading, twoFactorMethod } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loginPhase = ref<'credentials' | '2fa'>('credentials')
const verifyCode = ref('')
const resending = ref(false)

/**
 * Handles form submission for owner login.
 */
async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = t('auth.fieldsRequired')
    return
  }

  const result = await login({ email: email.value, password: password.value })
  if (result === 'success') {
    toast.success(t('auth.loginSuccess'))
    router.push('/dashboard')
  } else if (result === '2fa') {
    loginPhase.value = '2fa'
    errorMessage.value = ''
  } else {
    errorMessage.value = t('auth.loginFailed')
  }
}

/**
 * Handles 2FA code verification.
 */
async function handleVerify() {
  errorMessage.value = ''

  if (!verifyCode.value || verifyCode.value.length !== 6) {
    errorMessage.value = t('auth.twoFactorCodeInvalid')
    return
  }

  const success = await verify2fa(verifyCode.value)
  if (success) {
    toast.success(t('auth.loginSuccess'))
    router.push('/dashboard')
  } else {
    errorMessage.value = t('auth.twoFactorCodeWrong')
    verifyCode.value = ''
  }
}

/**
 * Resends the email OTP code.
 */
async function handleResend() {
  resending.value = true
  const success = await resend2faCode()
  resending.value = false
  if (success) {
    toast.success(t('auth.resendCodeSuccess'))
  } else {
    toast.error(t('auth.resendCodeFailed'))
  }
}

/**
 * Returns to the credentials phase.
 */
function handleBackToLogin() {
  clear2fa()
  loginPhase.value = 'credentials'
  verifyCode.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4">
    <!-- Credentials Phase -->
    <Card v-if="loginPhase === 'credentials'" class="w-full">
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

    <!-- 2FA Phase -->
    <Card v-else class="w-full">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-2xl">{{ t('auth.twoFactorTitle') }}</CardTitle>
        <CardDescription>
          {{ twoFactorMethod === 'email' ? t('auth.twoFactorEmailHint') : t('auth.twoFactorTotpHint') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleVerify">
          <div class="space-y-2">
            <Label for="verify-code">{{ t('auth.twoFactorCode') }}</Label>
            <Input
              id="verify-code"
              v-model="verifyCode"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              :placeholder="t('auth.twoFactorCodePlaceholder')"
              autocomplete="one-time-code"
              class="text-center text-lg tracking-widest"
              required
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>

          <Button type="submit" class="w-full" :disabled="loading || verifyCode.length !== 6">
            <ShieldCheck v-if="!loading" class="mr-2 h-4 w-4" />
            {{ loading ? t('common.loading') : t('auth.verify') }}
          </Button>
        </form>

        <div class="mt-4 flex items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            @click="handleBackToLogin"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            {{ t('auth.backToLogin') }}
          </button>

          <button
            v-if="twoFactorMethod === 'email'"
            type="button"
            class="flex items-center gap-1 text-sm text-primary hover:underline"
            :disabled="resending"
            @click="handleResend"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': resending }" />
            {{ t('auth.resendCode') }}
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
