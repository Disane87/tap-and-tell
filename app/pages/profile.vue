<script setup lang="ts">
/**
 * Profile page for managing user account settings.
 *
 * Sections: Avatar, Personal Info, Plan, Security (password + 2FA), Danger Zone.
 * Auth-guarded: redirects to /login if not authenticated.
 */
import {
  User, Upload, Trash2, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  AlertTriangle, Eye, EyeOff
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const router = useRouter()
const { public: { betaMode } } = useRuntimeConfig()

/** Whether we're in beta mode (not open) - hides plan section */
const isBeta = computed(() => betaMode !== 'open')
const {
  user, isAuthenticated, initialized, fetchMe,
  updateProfile, changePassword, deleteAccount, uploadAvatar, deleteAvatar
} = useAuth()

// ── Auth guard ──
onMounted(async () => {
  if (!initialized.value) await fetchMe()
  if (!isAuthenticated.value) {
    await navigateTo('/login', { replace: true })
  }
})

watch(isAuthenticated, (val) => {
  if (!val && initialized.value) navigateTo('/login', { replace: true })
})

// ── Personal info ──
const profileName = ref('')
const profileEmail = ref('')
const savingProfile = ref(false)

watch(user, (u) => {
  if (u) {
    profileName.value = u.name
    profileEmail.value = u.email
  }
}, { immediate: true })

async function handleSaveProfile(): Promise<void> {
  savingProfile.value = true
  const success = await updateProfile({
    name: profileName.value,
    email: profileEmail.value
  })
  savingProfile.value = false
  if (success) {
    toast.success(t('profile.saved'))
  } else {
    toast.error(t('profile.saveFailed'))
  }
}

// ── Avatar ──
const avatarInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)

function triggerAvatarUpload(): void {
  avatarInput.value?.click()
}

async function handleAvatarUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingAvatar.value = true
  const success = await uploadAvatar(file)
  uploadingAvatar.value = false

  if (success) {
    toast.success(t('profile.avatarUploaded'))
  } else {
    toast.error(t('profile.avatarUploadFailed'))
  }

  // Reset input so same file can be re-selected
  target.value = ''
}

async function handleAvatarDelete(): Promise<void> {
  const success = await deleteAvatar()
  if (success) {
    toast.success(t('profile.avatarDeleted'))
  } else {
    toast.error(t('profile.avatarDeleteFailed'))
  }
}

// ── Password ──
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

async function handleChangePassword(): Promise<void> {
  if (newPassword.value !== confirmPassword.value) {
    toast.error(t('profile.passwordMismatch'))
    return
  }

  changingPassword.value = true
  const success = await changePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value
  })
  changingPassword.value = false

  if (success) {
    toast.success(t('profile.passwordChanged'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } else {
    toast.error(t('profile.passwordChangeFailed'))
  }
}

// ── 2FA Status ──
const twoFactorEnabled = ref(false)
const twoFactorMethodDisplay = ref<string | null>(null)
const loadingTwoFactor = ref(true)
const showSetupDialog = ref(false)
const showDisableDialog = ref(false)

async function loadTwoFactorStatus(): Promise<void> {
  loadingTwoFactor.value = true
  try {
    const response = await $fetch<{
      success: boolean
      data?: { enabled: boolean; method?: string }
    }>('/api/auth/2fa/status')
    if (response.success && response.data) {
      twoFactorEnabled.value = response.data.enabled
      twoFactorMethodDisplay.value = response.data.method ?? null
    }
  } catch {
    // Ignore — 2FA status is optional display
  } finally {
    loadingTwoFactor.value = false
  }
}

onMounted(() => { loadTwoFactorStatus() })

function handleTwoFactorCompleted(): void {
  loadTwoFactorStatus()
}

// ── Plan ──
const tenantPlan = ref('free')
const tenantName = ref('')
const loadingPlan = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch<{
      success: boolean
      data?: Array<{ name: string; plan?: string }>
    }>('/api/tenants')
    if (response.success && response.data && response.data.length > 0) {
      tenantName.value = response.data[0].name
      tenantPlan.value = response.data[0].plan || 'free'
    }
  } catch {
    // Ignore
  } finally {
    loadingPlan.value = false
  }
})

const planBadgeClass = computed(() => {
  switch (tenantPlan.value) {
    case 'pro': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'business': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
  }
})

const planLabel = computed(() => {
  switch (tenantPlan.value) {
    case 'pro': return t('profile.planPro')
    case 'business': return t('profile.planBusiness')
    default: return t('profile.planFree')
  }
})

// ── Delete Account ──
const deletePassword = ref('')
const deletingAccount = ref(false)
const showDeleteConfirm = ref(false)

async function handleDeleteAccount(): Promise<void> {
  deletingAccount.value = true
  const success = await deleteAccount(deletePassword.value)
  deletingAccount.value = false

  if (success) {
    toast.success(t('profile.accountDeleted'))
    router.push('/')
  } else {
    toast.error(t('profile.accountDeleteFailed'))
  }
}

/**
 * User initials for avatar fallback.
 */
const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-8 text-2xl font-bold text-foreground">{{ t('profile.title') }}</h1>

    <div class="space-y-6">
      <!-- Avatar Section -->
      <Card class="p-6">
        <div class="flex items-center gap-6">
          <Avatar class="h-20 w-20" size="lg">
            <AvatarImage
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              :alt="user?.name"
            />
            <AvatarFallback class="bg-primary/15 text-2xl font-medium text-primary">
              {{ initials }}
            </AvatarFallback>
          </Avatar>

          <div class="flex flex-col gap-2">
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleAvatarUpload"
            >
            <Button
              variant="outline"
              size="sm"
              :disabled="uploadingAvatar"
              @click="triggerAvatarUpload"
            >
              <Upload class="mr-2 h-4 w-4" />
              {{ uploadingAvatar ? t('common.loading') : t('profile.avatar.upload') }}
            </Button>
            <Button
              v-if="user?.avatarUrl"
              variant="ghost"
              size="sm"
              @click="handleAvatarDelete"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              {{ t('profile.avatar.delete') }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- Personal Information -->
      <Card class="p-6">
        <h2 class="mb-4 text-lg font-semibold text-foreground">{{ t('profile.personalInfo') }}</h2>
        <form class="space-y-4" @submit.prevent="handleSaveProfile">
          <div class="space-y-2">
            <Label for="profile-name">{{ t('profile.name') }}</Label>
            <Input
              id="profile-name"
              v-model="profileName"
              :placeholder="t('auth.namePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label for="profile-email">{{ t('profile.email') }}</Label>
            <Input
              id="profile-email"
              v-model="profileEmail"
              type="email"
              :placeholder="t('auth.emailPlaceholder')"
            />
          </div>
          <Button
            type="submit"
            :disabled="savingProfile"
          >
            {{ savingProfile ? t('common.saving') : t('profile.save') }}
          </Button>
        </form>
      </Card>

      <!-- Plan (hidden in beta) -->
      <Card v-if="!isBeta" class="p-6">
        <h2 class="mb-4 text-lg font-semibold text-foreground">{{ t('profile.plan') }}</h2>
        <div v-if="loadingPlan" class="space-y-3">
          <Skeleton class="h-8 w-24 rounded-full" />
          <Skeleton class="h-4 w-48" />
        </div>
        <div v-else class="flex items-center justify-between">
          <div>
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
              :class="planBadgeClass"
            >
              {{ planLabel }}
            </span>
            <p v-if="tenantName" class="mt-1 text-sm text-muted-foreground">
              {{ tenantName }}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            {{ t('profile.planUpgrade') }}
          </Button>
        </div>
      </Card>

      <!-- Security -->
      <Card class="p-6">
        <h2 class="mb-4 text-lg font-semibold text-foreground">{{ t('profile.security') }}</h2>

        <!-- Change Password -->
        <div class="mb-6">
          <h3 class="mb-3 text-sm font-medium text-foreground">{{ t('profile.changePassword') }}</h3>
          <form class="space-y-3" @submit.prevent="handleChangePassword">
            <div class="relative">
              <Input
                v-model="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                :placeholder="t('profile.currentPassword')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                <component :is="showCurrentPassword ? EyeOff : Eye" class="h-4 w-4" />
              </button>
            </div>
            <div class="relative">
              <Input
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                :placeholder="t('profile.newPassword')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showNewPassword = !showNewPassword"
              >
                <component :is="showNewPassword ? EyeOff : Eye" class="h-4 w-4" />
              </button>
            </div>
            <Input
              v-model="confirmPassword"
              type="password"
              :placeholder="t('profile.confirmPassword')"
            />
            <Button
              type="submit"
              variant="outline"
              :disabled="changingPassword || !currentPassword || !newPassword || !confirmPassword"
            >
              {{ changingPassword ? t('common.saving') : t('profile.changePassword') }}
            </Button>
          </form>
        </div>

        <!-- 2FA Status -->
        <Separator class="my-4" />
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <component
              :is="twoFactorEnabled ? ShieldCheck : ShieldAlert"
              class="h-5 w-5"
              :class="twoFactorEnabled ? 'text-green-500' : 'text-amber-500'"
            />
            <div>
              <p class="text-sm font-medium text-foreground">{{ t('profile.twoFactor') }}</p>
              <p class="text-xs text-muted-foreground">
                <template v-if="loadingTwoFactor">
                  <Skeleton class="mt-1 h-3 w-20 inline-block" />
                </template>
                <template v-else-if="twoFactorEnabled">
                  {{ t('profile.twoFactorEnabled') }}
                  <span v-if="twoFactorMethodDisplay">({{ twoFactorMethodDisplay.toUpperCase() }})</span>
                </template>
                <template v-else>{{ t('profile.twoFactorDisabled') }}</template>
              </p>
            </div>
          </div>
          <Button
            v-if="!loadingTwoFactor && !twoFactorEnabled"
            variant="outline"
            size="sm"
            @click="showSetupDialog = true"
          >
            <Shield class="mr-2 h-4 w-4" />
            {{ t('profile.twoFactorSetup') }}
          </Button>
          <Button
            v-if="!loadingTwoFactor && twoFactorEnabled"
            variant="outline"
            size="sm"
            class="text-destructive hover:text-destructive"
            @click="showDisableDialog = true"
          >
            <ShieldOff class="mr-2 h-4 w-4" />
            {{ t('profile.twoFactorDisable') }}
          </Button>
        </div>
      </Card>

      <!-- Danger Zone -->
      <Card class="border-destructive/50 p-6">
        <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold text-destructive">
          <AlertTriangle class="h-5 w-5" />
          {{ t('profile.dangerZone') }}
        </h2>
        <p class="mb-4 text-sm text-muted-foreground">
          {{ t('profile.deleteAccountDescription') }}
        </p>

        <AlertDialog v-model:open="showDeleteConfirm">
          <AlertDialogTrigger as-child>
            <Button variant="destructive">
              {{ t('profile.deleteAccount') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('profile.deleteAccount') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ t('profile.deleteAccountDescription') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div class="py-4">
              <Label for="delete-password">{{ t('profile.deleteAccountConfirm') }}</Label>
              <Input
                id="delete-password"
                v-model="deletePassword"
                type="password"
                class="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
              <Button
                variant="destructive"
                :disabled="!deletePassword || deletingAccount"
                @click="handleDeleteAccount"
              >
                {{ deletingAccount ? t('common.loading') : t('profile.deleteAccountButton') }}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>

    <!-- 2FA Dialogs -->
    <TwoFactorSetupDialog
      :open="showSetupDialog"
      @update:open="showSetupDialog = $event"
      @completed="handleTwoFactorCompleted"
    />
    <TwoFactorDisableDialog
      :open="showDisableDialog"
      @update:open="showDisableDialog = $event"
      @completed="handleTwoFactorCompleted"
    />
  </div>
</template>
