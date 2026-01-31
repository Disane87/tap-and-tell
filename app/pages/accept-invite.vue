<script setup lang="ts">
/**
 * Page for accepting a tenant invitation.
 * Reads the invite token from query params, shows invite details,
 * and allows the authenticated user to accept.
 */
import { CheckCircle, XCircle, LogIn } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { TenantInvite } from '~/types/tenant'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()

const token = computed(() => route.query.token as string)
const invite = ref<TenantInvite | null>(null)
const loading = ref(true)
const accepting = ref(false)
const error = ref<string | null>(null)
const accepted = ref(false)

/**
 * Fetches invite details from the API.
 */
async function loadInvite(): Promise<void> {
  if (!token.value) {
    error.value = t('invite.noToken')
    loading.value = false
    return
  }

  try {
    const response = await $fetch<{ success: boolean; data?: TenantInvite }>(
      `/api/invites/${token.value}`
    )
    if (response.success && response.data) {
      invite.value = response.data
    } else {
      error.value = t('invite.notFound')
    }
  } catch (e: unknown) {
    const fetchError = e as { statusCode?: number }
    if (fetchError.statusCode === 410) {
      error.value = t('invite.expired')
    } else {
      error.value = t('invite.notFound')
    }
  } finally {
    loading.value = false
  }
}

/**
 * Accepts the invitation and redirects to the dashboard.
 */
async function handleAccept(): Promise<void> {
  if (!token.value) return
  accepting.value = true

  try {
    const response = await $fetch<{ success: boolean; data?: { tenantId: string } }>(
      '/api/invites/accept',
      { method: 'POST', body: { token: token.value } }
    )
    if (response.success) {
      accepted.value = true
      toast.success(t('invite.acceptSuccess'))
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  } catch (e: unknown) {
    const fetchError = e as { statusCode?: number }
    if (fetchError.statusCode === 409) {
      toast.error(t('invite.alreadyMember'))
    } else {
      toast.error(t('invite.acceptFailed'))
    }
  } finally {
    accepting.value = false
  }
}

onMounted(() => {
  loadInvite()
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>{{ t('invite.title') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Loading -->
        <div v-if="loading" class="py-8 text-center text-muted-foreground">
          {{ t('common.loading') }}
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-8 text-center">
          <XCircle class="mx-auto mb-4 h-12 w-12 text-destructive" />
          <p class="text-muted-foreground">{{ error }}</p>
          <NuxtLink to="/dashboard" class="mt-4 inline-block">
            <Button variant="outline">{{ t('common.back') }}</Button>
          </NuxtLink>
        </div>

        <!-- Accepted -->
        <div v-else-if="accepted" class="py-8 text-center">
          <CheckCircle class="mx-auto mb-4 h-12 w-12 text-green-500" />
          <p class="text-foreground">{{ t('invite.accepted') }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('invite.redirecting') }}</p>
        </div>

        <!-- Invite Details -->
        <div v-else-if="invite" class="space-y-4">
          <div class="rounded-lg bg-muted p-4 text-center">
            <p class="text-sm text-muted-foreground">{{ t('invite.youAreInvited') }}</p>
            <p class="mt-1 text-lg font-semibold text-foreground">{{ invite.tenantName }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t('invite.asRole', { role: t(`members.roles.${invite.role}`) }) }}
            </p>
          </div>

          <!-- Not logged in -->
          <div v-if="!isAuthenticated" class="text-center">
            <p class="mb-3 text-sm text-muted-foreground">{{ t('invite.loginRequired') }}</p>
            <NuxtLink :to="`/login?redirect=/accept-invite?token=${token}`">
              <Button>
                <LogIn class="mr-2 h-4 w-4" />
                {{ t('common.login') }}
              </Button>
            </NuxtLink>
          </div>

          <!-- Logged in -->
          <div v-else class="text-center">
            <Button
              :disabled="accepting"
              class="w-full"
              @click="handleAccept"
            >
              {{ accepting ? t('common.saving') : t('invite.accept') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
