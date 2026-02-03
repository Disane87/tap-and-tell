<script setup lang="ts">
/**
 * Owner registration page with beta invite token support.
 * In beta mode, requires a valid invite token from URL query param.
 */
import { UserPlus, Gift, Star, Clock, AlertCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { BetaInviteValidation } from '~/types/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { register, loading } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

// Beta invite state
const betaToken = ref<string | null>(null)
const betaInvite = ref<BetaInviteValidation | null>(null)
const validatingToken = ref(false)

/**
 * Validates the beta token from URL query parameter.
 */
async function validateBetaToken() {
  const token = route.query.token as string | undefined
  if (!token) {
    // Check beta status without token
    try {
      const status = await $fetch<BetaInviteValidation>('/api/beta/validate')
      betaInvite.value = status
    } catch {
      betaInvite.value = { betaMode: 'open', betaModeEnabled: false, valid: false }
    }
    return
  }

  betaToken.value = token
  validatingToken.value = true

  try {
    const result = await $fetch<BetaInviteValidation>(`/api/beta/validate?token=${token}`)
    betaInvite.value = result

    if (result.valid && result.email) {
      email.value = result.email
    }
  } catch {
    betaInvite.value = {
      betaMode: 'private',
      betaModeEnabled: true,
      valid: false,
      error: 'Failed to validate invite token'
    }
  } finally {
    validatingToken.value = false
  }
}

// Validate token on mount
onMounted(validateBetaToken)

// Watch for route changes (token might change)
watch(() => route.query.token, validateBetaToken)

/**
 * Whether registration is allowed.
 */
const canRegister = computed(() => {
  if (!betaInvite.value) return false
  if (!betaInvite.value.betaModeEnabled) return true
  return betaInvite.value.valid
})

/**
 * Whether to show the invite-only message.
 */
const showInviteOnly = computed(() => {
  if (!betaInvite.value) return false
  return betaInvite.value.betaModeEnabled && !betaInvite.value.valid
})

/**
 * Formats the expiry date.
 */
const expiresAtFormatted = computed(() => {
  if (!betaInvite.value?.expiresAt) return null
  return new Date(betaInvite.value.expiresAt).toLocaleDateString()
})

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
    password: password.value,
    betaToken: betaToken.value || undefined
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
    <!-- Loading state -->
    <Card v-if="validatingToken" class="w-full">
      <CardContent class="flex flex-col items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p class="mt-4 text-muted-foreground">{{ t('beta.validatingInvite') }}</p>
      </CardContent>
    </Card>

    <!-- Invite-only message -->
    <Card v-else-if="showInviteOnly" class="w-full">
      <CardHeader class="text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Gift class="h-8 w-8 text-primary" />
        </div>
        <CardTitle class="text-2xl">{{ t('beta.inviteOnly') }}</CardTitle>
        <CardDescription>{{ t('beta.inviteOnlyDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <p v-if="betaInvite?.error" class="text-center text-sm text-destructive">
          <AlertCircle class="mr-1 inline h-4 w-4" />
          {{ betaInvite.error }}
        </p>

        <div class="rounded-lg bg-muted p-4 text-center">
          <p class="text-sm text-muted-foreground">
            {{ t('beta.joinWaitlist') }}
          </p>
          <NuxtLink
            v-if="betaInvite?.betaMode === 'waitlist'"
            to="/waitlist"
            class="mt-2 inline-block text-primary hover:underline"
          >
            {{ t('beta.joinWaitlistButton') }}
          </NuxtLink>
        </div>

        <p class="text-center text-sm text-muted-foreground">
          {{ t('auth.hasAccount') }}
          <NuxtLink to="/login" class="text-primary hover:underline">
            {{ t('auth.loginLink') }}
          </NuxtLink>
        </p>
      </CardContent>
    </Card>

    <!-- Registration form -->
    <Card v-else-if="canRegister" class="w-full">
      <CardHeader class="text-center">
        <!-- Founder badge -->
        <div v-if="betaInvite?.isFounder" class="mx-auto mb-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white">
            <Star class="h-3 w-3" />
            {{ t('beta.founderBadge') }}
          </span>
        </div>

        <!-- Beta participant badge -->
        <div v-else-if="betaInvite?.valid" class="mx-auto mb-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Gift class="h-3 w-3" />
            {{ t('beta.betaAccess') }}
          </span>
        </div>

        <CardTitle class="text-2xl">{{ t('auth.registerTitle') }}</CardTitle>
        <CardDescription>{{ t('auth.registerDescription') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Beta invite info -->
        <div v-if="betaInvite?.valid" class="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div class="flex items-start gap-3">
            <Gift class="h-5 w-5 text-primary" />
            <div class="flex-1">
              <p class="text-sm font-medium">
                {{ betaInvite.isFounder ? t('beta.founderInvite') : t('beta.betaInvite') }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('beta.grantedPlan', { plan: betaInvite.grantedPlan }) }}
              </p>
              <p v-if="expiresAtFormatted" class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock class="h-3 w-3" />
                {{ t('beta.expiresAt', { date: expiresAtFormatted }) }}
              </p>
            </div>
          </div>
        </div>

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
              :disabled="betaInvite?.valid && !!betaInvite.email"
              :class="{ 'bg-muted': betaInvite?.valid && !!betaInvite.email }"
            />
            <p v-if="betaInvite?.valid && betaInvite.email" class="text-xs text-muted-foreground">
              {{ t('beta.emailLocked') }}
            </p>
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
