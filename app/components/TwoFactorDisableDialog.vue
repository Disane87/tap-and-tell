<script setup lang="ts">
/**
 * Dialog for disabling two-factor authentication.
 * Requires password confirmation before disabling.
 */
import { ShieldAlert } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'completed': []
}>()

const { t } = useI18n()

const password = ref('')
const disableLoading = ref(false)
const errorMessage = ref('')

/**
 * Disables 2FA after password confirmation.
 */
async function handleDisable(): Promise<void> {
  if (!password.value) {
    errorMessage.value = t('auth.fieldsRequired')
    return
  }

  disableLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{ success: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      body: { password: password.value }
    })

    if (response.success) {
      toast.success(t('twoFactor.disableSuccess'))
      resetState()
      emit('update:open', false)
      emit('completed')
    } else {
      errorMessage.value = t('twoFactor.disableFailed')
    }
  } catch {
    errorMessage.value = t('twoFactor.disableFailed')
  } finally {
    disableLoading.value = false
  }
}

function resetState(): void {
  password.value = ''
  errorMessage.value = ''
}

function handleOpenChange(value: boolean): void {
  if (!value) resetState()
  emit('update:open', value)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-destructive">
          <ShieldAlert class="h-5 w-5" />
          {{ t('twoFactor.disableTitle') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('twoFactor.disableDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="disable-password">{{ t('auth.password') }}</Label>
          <Input
            id="disable-password"
            v-model="password"
            type="password"
            :placeholder="t('auth.passwordPlaceholder')"
            @keyup.enter="handleDisable"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleOpenChange(false)">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="destructive" :disabled="!password || disableLoading" @click="handleDisable">
          {{ disableLoading ? t('common.loading') : t('twoFactor.disableButton') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
