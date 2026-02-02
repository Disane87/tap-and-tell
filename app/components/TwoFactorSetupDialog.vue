<script setup lang="ts">
/**
 * Two-factor authentication setup dialog.
 *
 * Multi-step flow:
 * 1. Choose method (TOTP or Email)
 * 2. Verify setup code (QR code for TOTP, email code for Email)
 * 3. Show and confirm backup codes
 */
import QRCode from 'qrcode'
import { ShieldCheck, Smartphone, Mail, Copy, Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'completed': []
}>()

const { t } = useI18n()

const step = ref<'method' | 'verify' | 'backup'>('method')
const method = ref<'totp' | 'email'>('totp')
const setupLoading = ref(false)
const verifyLoading = ref(false)
const verifyCode = ref('')
const errorMessage = ref('')

// TOTP setup data
const totpSecret = ref('')
const totpUri = ref('')
const qrDataUrl = ref('')

// Backup codes
const backupCodes = ref<string[]>([])
const codesCopied = ref(false)
const codesConfirmed = ref(false)

/**
 * Initiates 2FA setup by calling the server endpoint.
 */
async function startSetup(): Promise<void> {
  setupLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        method: string
        secret?: string
        uri?: string
      }
    }>('/api/auth/2fa/setup', {
      method: 'POST',
      body: { method: method.value }
    })

    if (response.success && response.data) {
      if (method.value === 'totp' && response.data.secret && response.data.uri) {
        totpSecret.value = response.data.secret
        totpUri.value = response.data.uri
        qrDataUrl.value = await QRCode.toDataURL(response.data.uri, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        })
      }
      step.value = 'verify'
    } else {
      errorMessage.value = t('twoFactor.setupFailed')
    }
  } catch {
    errorMessage.value = t('twoFactor.setupFailed')
  } finally {
    setupLoading.value = false
  }
}

/**
 * Verifies the setup code and retrieves backup codes.
 */
async function verifySetup(): Promise<void> {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    errorMessage.value = t('auth.twoFactorCodeInvalid')
    return
  }

  verifyLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      data?: { backupCodes: string[] }
    }>('/api/auth/2fa/verify-setup', {
      method: 'POST',
      body: { code: verifyCode.value }
    })

    if (response.success && response.data?.backupCodes) {
      backupCodes.value = response.data.backupCodes
      step.value = 'backup'
    } else {
      errorMessage.value = t('auth.twoFactorCodeWrong')
      verifyCode.value = ''
    }
  } catch {
    errorMessage.value = t('auth.twoFactorCodeWrong')
    verifyCode.value = ''
  } finally {
    verifyLoading.value = false
  }
}

/**
 * Copies backup codes to clipboard.
 */
async function copyBackupCodes(): Promise<void> {
  try {
    await navigator.clipboard.writeText(backupCodes.value.join('\n'))
    codesCopied.value = true
    toast.success(t('twoFactor.codesCopied'))
  } catch {
    toast.error(t('twoFactor.codesCopyFailed'))
  }
}

/**
 * Completes setup and closes the dialog.
 */
function finishSetup(): void {
  resetState()
  emit('update:open', false)
  emit('completed')
}

/**
 * Resets all state on dialog close.
 */
function resetState(): void {
  step.value = 'method'
  method.value = 'totp'
  verifyCode.value = ''
  errorMessage.value = ''
  totpSecret.value = ''
  totpUri.value = ''
  qrDataUrl.value = ''
  backupCodes.value = []
  codesCopied.value = false
  codesConfirmed.value = false
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
        <DialogTitle class="flex items-center gap-2">
          <ShieldCheck class="h-5 w-5 text-primary" />
          {{ t('twoFactor.setupTitle') }}
        </DialogTitle>
        <DialogDescription>
          <template v-if="step === 'method'">{{ t('twoFactor.chooseMethod') }}</template>
          <template v-else-if="step === 'verify' && method === 'totp'">{{ t('twoFactor.scanQr') }}</template>
          <template v-else-if="step === 'verify' && method === 'email'">{{ t('twoFactor.emailSent') }}</template>
          <template v-else>{{ t('twoFactor.backupCodesDescription') }}</template>
        </DialogDescription>
      </DialogHeader>

      <!-- Step 1: Choose Method -->
      <div v-if="step === 'method'" class="space-y-3 py-4">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors"
          :class="method === 'totp' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
          @click="method = 'totp'"
        >
          <Smartphone class="h-5 w-5" :class="method === 'totp' ? 'text-primary' : 'text-muted-foreground'" />
          <div>
            <p class="text-sm font-medium text-foreground">{{ t('twoFactor.totpTitle') }}</p>
            <p class="text-xs text-muted-foreground">{{ t('twoFactor.totpDescription') }}</p>
          </div>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors"
          :class="method === 'email' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
          @click="method = 'email'"
        >
          <Mail class="h-5 w-5" :class="method === 'email' ? 'text-primary' : 'text-muted-foreground'" />
          <div>
            <p class="text-sm font-medium text-foreground">{{ t('twoFactor.emailTitle') }}</p>
            <p class="text-xs text-muted-foreground">{{ t('twoFactor.emailDescription') }}</p>
          </div>
        </button>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <!-- Step 2: Verify -->
      <div v-else-if="step === 'verify'" class="space-y-4 py-4">
        <!-- TOTP: QR Code -->
        <template v-if="method === 'totp'">
          <div class="flex justify-center">
            <div class="rounded-xl border bg-white p-3">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="h-48 w-48" />
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('twoFactor.manualEntry') }}</p>
            <code class="block rounded bg-muted px-3 py-2 text-xs break-all select-all">{{ totpSecret }}</code>
          </div>
        </template>

        <!-- Verify Code Input -->
        <div class="space-y-2">
          <Label for="setup-code">{{ t('auth.twoFactorCode') }}</Label>
          <Input
            id="setup-code"
            v-model="verifyCode"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            :placeholder="t('auth.twoFactorCodePlaceholder')"
            autocomplete="one-time-code"
            class="text-center text-lg tracking-widest"
            @keyup.enter="verifySetup"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <!-- Step 3: Backup Codes -->
      <div v-else class="space-y-4 py-4">
        <div class="rounded-lg border bg-muted/30 p-4">
          <div class="grid grid-cols-2 gap-2">
            <code
              v-for="code in backupCodes"
              :key="code"
              class="rounded bg-muted px-3 py-1.5 text-center text-sm font-mono"
            >
              {{ code }}
            </code>
          </div>
        </div>

        <Button variant="outline" class="w-full" @click="copyBackupCodes">
          <component :is="codesCopied ? Check : Copy" class="mr-2 h-4 w-4" />
          {{ codesCopied ? t('twoFactor.codesCopied') : t('twoFactor.copyBackupCodes') }}
        </Button>

        <div class="flex items-center gap-2">
          <Checkbox id="confirm-codes" v-model="codesConfirmed" />
          <Label for="confirm-codes" class="text-sm">{{ t('twoFactor.confirmSaved') }}</Label>
        </div>
      </div>

      <DialogFooter>
        <template v-if="step === 'method'">
          <Button :disabled="setupLoading" @click="startSetup">
            {{ setupLoading ? t('common.loading') : t('common.next') }}
          </Button>
        </template>
        <template v-else-if="step === 'verify'">
          <Button :disabled="verifyLoading || verifyCode.length !== 6" @click="verifySetup">
            {{ verifyLoading ? t('common.loading') : t('auth.verify') }}
          </Button>
        </template>
        <template v-else>
          <Button :disabled="!codesConfirmed" @click="finishSetup">
            {{ t('twoFactor.done') }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
