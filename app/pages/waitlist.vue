<script setup lang="ts">
/**
 * Waitlist landing page for public beta signup.
 * Users can join the waitlist and get a referral code to share.
 */
import { Sparkles, Copy, Share2, CheckCircle, Users, ArrowRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const route = useRoute()

// Form state
const email = ref('')
const name = ref('')
const useCase = ref('')
const referralCode = ref((route.query.ref as string) || '')
const loading = ref(false)
const error = ref('')

// Result state
const joined = ref(false)
const position = ref(0)
const myReferralCode = ref('')
const alreadyExists = ref(false)

/**
 * Joins the waitlist.
 */
async function joinWaitlist() {
  if (!email.value) {
    error.value = t('auth.fieldsRequired')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = t('auth.loginFailed')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await $fetch<{
      success: boolean
      data: {
        position: number
        referralCode: string
        alreadyExists: boolean
      }
    }>('/api/waitlist/join', {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value || undefined,
        useCase: useCase.value || undefined,
        referralCode: referralCode.value || undefined,
        source: 'waitlist_page'
      }
    })

    if (result.success) {
      joined.value = true
      position.value = result.data.position
      myReferralCode.value = result.data.referralCode
      alreadyExists.value = result.data.alreadyExists

      if (alreadyExists.value) {
        toast.info(t('beta.waitlist.alreadyOnList'))
      } else {
        toast.success(t('beta.waitlist.success'))
      }
    }
  } catch (err: any) {
    error.value = err.data?.message || t('toast.saveFailed')
  } finally {
    loading.value = false
  }
}

/**
 * Copies the referral code to clipboard.
 */
async function copyReferralCode() {
  try {
    await navigator.clipboard.writeText(myReferralCode.value)
    toast.success(t('beta.waitlist.copied'))
  } catch {
    toast.error(t('members.copyFailed'))
  }
}

/**
 * Shares the referral link.
 */
async function shareReferralLink() {
  const url = `${window.location.origin}/waitlist?ref=${myReferralCode.value}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Tap & Tell',
        text: t('beta.waitlist.referralDescription'),
        url
      })
    } catch {
      // User cancelled
    }
  } else {
    await navigator.clipboard.writeText(url)
    toast.success(t('beta.waitlist.copied'))
  }
}

// Check for referral code in URL
const hasReferral = computed(() => !!route.query.ref)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
    <div class="mx-auto max-w-2xl px-4 py-16">
      <!-- Header -->
      <div class="mb-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles class="h-8 w-8 text-primary" />
        </div>
        <h1 class="font-display text-3xl font-bold md:text-4xl">
          {{ t('beta.waitlist.title') }}
        </h1>
        <p class="mt-4 text-lg text-muted-foreground">
          {{ t('beta.waitlist.subtitle') }}
        </p>
      </div>

      <!-- Success State -->
      <Card v-if="joined" class="border-primary/20 bg-primary/5">
        <CardContent class="pt-6">
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle class="h-8 w-8 text-primary" />
            </div>
            <h2 class="text-xl font-semibold">
              {{ alreadyExists ? t('beta.waitlist.alreadyOnList') : t('beta.waitlist.success') }}
            </h2>
            <p class="mt-2 text-3xl font-bold text-primary">
              {{ t('beta.waitlist.position', { position }) }}
            </p>
          </div>

          <!-- Referral Section -->
          <div class="mt-8 rounded-lg border border-primary/20 bg-card p-6">
            <div class="flex items-start gap-3">
              <Users class="h-5 w-5 text-primary" />
              <div class="flex-1">
                <h3 class="font-semibold">{{ t('beta.waitlist.referralTitle') }}</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ t('beta.waitlist.referralDescription') }}
                </p>
              </div>
            </div>

            <div class="mt-4">
              <Label class="text-sm text-muted-foreground">{{ t('beta.waitlist.yourReferralCode') }}</Label>
              <div class="mt-2 flex gap-2">
                <Input
                  :model-value="myReferralCode"
                  readonly
                  class="font-mono text-lg font-bold"
                />
                <Button variant="outline" size="icon" @click="copyReferralCode">
                  <Copy class="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" @click="shareReferralLink">
                  <Share2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Login Link -->
          <p class="mt-6 text-center text-sm text-muted-foreground">
            {{ t('auth.hasAccount') }}
            <NuxtLink to="/login" class="text-primary hover:underline">
              {{ t('auth.loginLink') }}
            </NuxtLink>
          </p>
        </CardContent>
      </Card>

      <!-- Signup Form -->
      <Card v-else>
        <CardContent class="pt-6">
          <form class="space-y-4" @submit.prevent="joinWaitlist">
            <!-- Email -->
            <div class="space-y-2">
              <Label for="email">{{ t('auth.email') }} *</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                :placeholder="t('beta.waitlist.emailPlaceholder')"
                required
              />
            </div>

            <!-- Name (optional) -->
            <div class="space-y-2">
              <Label for="name">{{ t('auth.name') }}</Label>
              <Input
                id="name"
                v-model="name"
                type="text"
                :placeholder="t('beta.waitlist.namePlaceholder')"
              />
            </div>

            <!-- Use Case (optional) -->
            <div class="space-y-2">
              <Label for="useCase">{{ t('beta.waitlist.useCase') }}</Label>
              <Input
                id="useCase"
                v-model="useCase"
                type="text"
                :placeholder="t('beta.waitlist.useCasePlaceholder')"
              />
            </div>

            <!-- Referral Code (optional) -->
            <div class="space-y-2">
              <Label for="referralCode">{{ t('beta.waitlist.referralCode') }}</Label>
              <Input
                id="referralCode"
                v-model="referralCode"
                type="text"
                :placeholder="t('beta.waitlist.referralCodePlaceholder')"
                class="font-mono uppercase"
              />
              <p v-if="hasReferral" class="text-xs text-primary">
                <CheckCircle class="mr-1 inline h-3 w-3" />
                Referral code applied!
              </p>
            </div>

            <!-- Error Message -->
            <p v-if="error" class="text-sm text-destructive">
              {{ error }}
            </p>

            <!-- Submit Button -->
            <Button type="submit" class="w-full" :disabled="loading">
              <Sparkles v-if="!loading" class="mr-2 h-4 w-4" />
              {{ loading ? t('beta.waitlist.joining') : t('beta.waitlist.join') }}
              <ArrowRight v-if="!loading" class="ml-2 h-4 w-4" />
            </Button>
          </form>

          <!-- Login Link -->
          <p class="mt-6 text-center text-sm text-muted-foreground">
            {{ t('auth.hasAccount') }}
            <NuxtLink to="/login" class="text-primary hover:underline">
              {{ t('auth.loginLink') }}
            </NuxtLink>
          </p>
        </CardContent>
      </Card>

      <!-- Features Preview -->
      <div class="mt-12 grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border bg-card p-4 text-center">
          <div class="text-2xl">📸</div>
          <p class="mt-2 text-sm font-medium">{{ t('landing.features.photo.title') }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center">
          <div class="text-2xl">📱</div>
          <p class="mt-2 text-sm font-medium">{{ t('landing.features.nfc.title') }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center">
          <div class="text-2xl">🎨</div>
          <p class="mt-2 text-sm font-medium">{{ t('landing.features.theme.title') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
