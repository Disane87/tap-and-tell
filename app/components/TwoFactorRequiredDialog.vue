<script setup lang="ts">
/**
 * TwoFactorRequiredDialog
 * A modal dialog that forces the user to set up 2FA before continuing.
 * Cannot be dismissed - user must either set up 2FA or log out.
 */
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

const isOpen = computed(() => {
  return isAuthenticated.value
    && user.value
    && !user.value.twoFactorEnabled
})

async function handleLogout() {
  await logout()
  router.push('/login')
}

function goToSetup() {
  router.push('/profile#security')
}
</script>

<template>
  <Dialog :open="isOpen">
    <DialogContent
      class="sm:max-w-md"
      :hide-close-button="true"
      @escape-key-down.prevent
      @pointer-down-outside.prevent
      @interactOutside.prevent
    >
      <div class="flex flex-col items-center text-center">
        <!-- Icon -->
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
          <ShieldAlert class="h-8 w-8 text-amber-500" />
        </div>

        <!-- Title -->
        <DialogHeader class="space-y-2">
          <DialogTitle class="text-xl">
            {{ t('twoFactor.required.title') }}
          </DialogTitle>
          <DialogDescription class="text-base">
            {{ t('twoFactor.required.description') }}
          </DialogDescription>
        </DialogHeader>

        <!-- Info Box -->
        <div class="mt-6 w-full rounded-lg bg-muted p-4 text-left text-sm text-muted-foreground">
          <p class="font-medium text-foreground mb-2">
            {{ t('twoFactor.required.whyTitle') }}
          </p>
          <ul class="space-y-1 list-disc list-inside">
            <li>{{ t('twoFactor.required.why1') }}</li>
            <li>{{ t('twoFactor.required.why2') }}</li>
            <li>{{ t('twoFactor.required.why3') }}</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex w-full flex-col gap-3">
          <Button class="w-full" size="lg" @click="goToSetup">
            <ShieldAlert class="mr-2 h-4 w-4" />
            {{ t('twoFactor.required.setupButton') }}
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            class="w-full text-muted-foreground"
            @click="handleLogout"
          >
            <LogOut class="mr-2 h-4 w-4" />
            {{ t('twoFactor.required.logoutButton') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
