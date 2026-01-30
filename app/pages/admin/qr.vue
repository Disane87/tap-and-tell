<script setup lang="ts">
/**
 * Admin QR Code Generator page.
 *
 * Generates QR codes linking to the guestbook for devices without NFC.
 * Allows customizing URL parameters and downloading as PNG/SVG.
 */
import QRCode from 'qrcode'
import { Download, Copy, Check, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const { isAuthenticated, initAuth } = useAdmin()
const router = useRouter()
const config = useRuntimeConfig()

const eventName = ref('')
const qrDataUrl = ref('')
const qrSvg = ref('')
const copied = ref(false)
const generating = ref(false)

/**
 * Base URL for the guestbook.
 */
const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
})

/**
 * Full URL with optional event parameter.
 */
const fullUrl = computed(() => {
  let url = baseUrl.value
  if (eventName.value.trim()) {
    url += `?source=nfc&event=${encodeURIComponent(eventName.value.trim())}`
  }
  return url
})

/**
 * Generates QR code as both PNG data URL and SVG.
 */
async function generateQrCode(): Promise<void> {
  if (!fullUrl.value) return

  generating.value = true
  try {
    // Generate PNG data URL
    qrDataUrl.value = await QRCode.toDataURL(fullUrl.value, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Generate SVG string
    qrSvg.value = await QRCode.toString(fullUrl.value, {
      type: 'svg',
      width: 512,
      margin: 2
    })
  } catch (error) {
    console.error('QR code generation failed:', error)
    toast.error(t('admin.qr.generateFailed'))
  } finally {
    generating.value = false
  }
}

/**
 * Downloads the QR code as PNG.
 */
function downloadPng(): void {
  if (!qrDataUrl.value) return

  const link = document.createElement('a')
  link.download = `tap-and-tell-qr${eventName.value ? `-${eventName.value}` : ''}.png`
  link.href = qrDataUrl.value
  link.click()
}

/**
 * Downloads the QR code as SVG.
 */
function downloadSvg(): void {
  if (!qrSvg.value) return

  const blob = new Blob([qrSvg.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `tap-and-tell-qr${eventName.value ? `-${eventName.value}` : ''}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Copies the URL to clipboard.
 */
async function copyUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(fullUrl.value)
    copied.value = true
    toast.success(t('admin.qr.copied'))
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    toast.error(t('admin.qr.copyFailed'))
  }
}

// Generate initial QR code
watch(fullUrl, () => {
  generateQrCode()
}, { immediate: true })

onMounted(() => {
  initAuth()
  if (!isAuthenticated.value) {
    router.push('/admin/login')
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <div class="mb-8">
      <h1 class="font-display text-2xl font-semibold text-foreground">
        {{ $t('admin.qr.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('admin.qr.description') }}
      </p>
    </div>

    <Card>
      <CardContent class="space-y-6 p-6">
        <!-- Event Name Input -->
        <div class="space-y-2">
          <Label for="eventName">{{ $t('admin.qr.eventName') }}</Label>
          <Input
            id="eventName"
            v-model="eventName"
            :placeholder="$t('admin.qr.eventPlaceholder')"
          />
          <p class="text-xs text-muted-foreground">
            {{ $t('admin.qr.eventHint') }}
          </p>
        </div>

        <!-- URL Preview -->
        <div class="space-y-2">
          <Label>{{ $t('admin.qr.urlPreview') }}</Label>
          <div class="flex items-center gap-2">
            <code class="flex-1 rounded-lg bg-muted px-3 py-2 text-sm break-all">
              {{ fullUrl }}
            </code>
            <Button variant="outline" size="icon" @click="copyUrl">
              <Check v-if="copied" class="h-4 w-4 text-green-500" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- QR Code Display -->
        <div class="flex flex-col items-center space-y-4">
          <div
            class="relative rounded-xl border bg-white p-4"
            :class="{ 'animate-pulse': generating }"
          >
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR Code"
              class="h-64 w-64"
            >
            <div
              v-else
              class="flex h-64 w-64 items-center justify-center"
            >
              <RefreshCw class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>

          <!-- Download Buttons -->
          <div class="flex gap-3">
            <Button variant="outline" @click="downloadPng">
              <Download class="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" @click="downloadSvg">
              <Download class="mr-2 h-4 w-4" />
              SVG
            </Button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="rounded-lg bg-muted/50 p-4">
          <p class="text-sm font-medium text-foreground">
            {{ $t('admin.qr.instructions') }}
          </p>
          <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• {{ $t('admin.qr.instruction1') }}</li>
            <li>• {{ $t('admin.qr.instruction2') }}</li>
            <li>• {{ $t('admin.qr.instruction3') }}</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <!-- Back Link -->
    <div class="mt-6">
      <NuxtLink
        to="/admin"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {{ $t('admin.qr.backToAdmin') }}
      </NuxtLink>
    </div>
  </div>
</template>
