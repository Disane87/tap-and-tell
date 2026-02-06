<script setup lang="ts">
/**
 * Flat guestbook admin panel for entry moderation and settings.
 * URL: /g/[id]/admin
 * Resolves tenantId dynamically from /api/g/[id]/info.
 * Requires authentication and tenant membership.
 */
import QRCode from 'qrcode'
import { Trash2, QrCode, Check, X, Clock, CheckCircle, XCircle, Settings, Download, Copy, RefreshCw, Eye, BarChart3 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { EntryStatus, GuestEntry } from '~/types/guest'
import type { TenantRole } from '~/types/tenant'
import type { Guestbook } from '~/types/guestbook'
import type { SettingsTab } from '~/components/admin/GuestbookSettings.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const guestbookId = computed(() => route.params.id as string)
const { isAuthenticated } = useAuth()

const resolvedTenantId = ref('')
const tenantId = computed(() => resolvedTenantId.value)

const userRole = ref<TenantRole | null>(null)
const guestbookInfo = ref<Guestbook | null>(null)

const entries = ref<GuestEntry[]>([])
const loading = ref(true)
const selectedIds = ref<string[]>([])
const activeTab = ref<'all' | EntryStatus>('all')
const showSettings = ref(false)
const showQrCode = ref(false)
const settingsRef = ref<InstanceType<typeof AdminGuestbookSettings> | null>(null)
const activeSettingsTab = ref<SettingsTab>('landing')

function handleSettingsTabChange(tab: SettingsTab): void {
  activeSettingsTab.value = tab
}

// QR Code state
const eventName = ref('')
const qrDataUrl = ref('')
const qrSvg = ref('')
const qrCopied = ref(false)
const qrGenerating = ref(false)

const qrBaseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/g/${guestbookId.value}`
  }
  return ''
})

const qrFullUrl = computed(() => {
  let url = qrBaseUrl.value
  if (eventName.value.trim()) {
    url += `?source=nfc&event=${encodeURIComponent(eventName.value.trim())}`
  }
  return url
})

async function generateQrCode(): Promise<void> {
  if (!qrFullUrl.value) return
  qrGenerating.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(qrFullUrl.value, {
      width: 512, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
    qrSvg.value = await QRCode.toString(qrFullUrl.value, {
      type: 'svg', width: 512, margin: 2
    })
  } catch {
    toast.error(t('admin.qr.generateFailed'))
  } finally {
    qrGenerating.value = false
  }
}

function downloadQrPng(): void {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = `guestbook-qr${eventName.value ? `-${eventName.value}` : ''}.png`
  link.href = qrDataUrl.value
  link.click()
}

function downloadQrSvg(): void {
  if (!qrSvg.value) return
  const blob = new Blob([qrSvg.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `guestbook-qr${eventName.value ? `-${eventName.value}` : ''}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

async function copyQrUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(qrFullUrl.value)
    qrCopied.value = true
    toast.success(t('admin.qr.copied'))
    setTimeout(() => { qrCopied.value = false }, 2000)
  } catch {
    toast.error(t('admin.qr.copyFailed'))
  }
}

watch(qrFullUrl, () => { generateQrCode() })
watch(showQrCode, (open) => { if (open && !qrDataUrl.value) generateQrCode() })

const filteredEntries = computed(() => {
  if (activeTab.value === 'all') return entries.value
  return entries.value.filter(e => (e.status || 'pending') === activeTab.value)
})

const statusCounts = computed(() => ({
  all: entries.value.length,
  pending: entries.value.filter(e => e.status === 'pending' || !e.status).length,
  approved: entries.value.filter(e => e.status === 'approved').length,
  rejected: entries.value.filter(e => e.status === 'rejected').length
}))

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadEntries(): Promise<void> {
  loading.value = true
  const { fetchEntries } = useTenantAdmin(tenantId, guestbookId)
  const data = await fetchEntries()
  if (data) {
    entries.value = data
  }
  loading.value = false
}

async function handleDelete(id: string): Promise<void> {
  const { deleteEntry } = useTenantAdmin(tenantId, guestbookId)
  const success = await deleteEntry(id)
  if (success) {
    entries.value = entries.value.filter(e => e.id !== id)
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
    toast.success(t('admin.deleteSuccess'))
  } else {
    toast.error(t('admin.deleteFailed'))
  }
}

async function handleStatusUpdate(id: string, status: EntryStatus): Promise<void> {
  const { updateEntryStatus } = useTenantAdmin(tenantId, guestbookId)
  const updated = await updateEntryStatus(id, status)
  if (updated) {
    const index = entries.value.findIndex(e => e.id === id)
    if (index !== -1) {
      entries.value[index] = updated
    }
    toast.success(t(`admin.moderation.${status}Success`))
  } else {
    toast.error(t('admin.moderation.updateFailed'))
  }
}

async function handleBulkAction(status: EntryStatus): Promise<void> {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  const { bulkUpdateStatus } = useTenantAdmin(tenantId, guestbookId)
  const count = await bulkUpdateStatus(ids, status)
  if (count > 0) {
    await loadEntries()
    selectedIds.value = []
    toast.success(t('admin.moderation.bulkSuccess', { count }))
  } else {
    toast.error(t('admin.moderation.updateFailed'))
  }
}

async function handleBulkDelete(): Promise<void> {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  const { bulkDeleteEntries } = useTenantAdmin(tenantId, guestbookId)
  const count = await bulkDeleteEntries(ids)
  if (count > 0) {
    const deletedSet = new Set(ids)
    entries.value = entries.value.filter(e => !deletedSet.has(e.id))
    selectedIds.value = []
    toast.success(t('admin.moderation.bulkDeleteSuccess', { count }))
  } else {
    toast.error(t('admin.deleteFailed'))
  }
}

function toggleSelection(id: string): void {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function toggleSelectAll(): void {
  if (selectedIds.value.length === filteredEntries.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredEntries.value.map(e => e.id)
  }
}

function getStatusBadgeColor(status?: EntryStatus): string {
  switch (status) {
    case 'approved':
      return 'badge-emerald'
    case 'rejected':
      return 'badge-pink'
    default:
      return 'badge-yellow'
  }
}

async function reloadGuestbookInfo(): Promise<void> {
  try {
    const gbResponse = await $fetch<{ success: boolean; data?: Guestbook }>(
      `/api/tenants/${tenantId.value}/guestbooks/${guestbookId.value}`
    )
    if (gbResponse.data) {
      guestbookInfo.value = gbResponse.data
    }
  } catch {
    // Ignore reload errors
  }
}

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }

  // Resolve tenantId from guestbook info
  try {
    const infoResponse = await $fetch<{ success: boolean; data?: { id: string; name: string; tenantId: string } }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (infoResponse.data?.tenantId) {
      resolvedTenantId.value = infoResponse.data.tenantId
    } else {
      router.push('/dashboard')
      return
    }
  } catch {
    router.push('/dashboard')
    return
  }

  // Fetch role and guestbook details
  try {
    const [tenantResponse, gbResponse] = await Promise.all([
      $fetch<{ success: boolean; data?: { role?: TenantRole } }>(
        `/api/tenants/${tenantId.value}`
      ),
      $fetch<{ success: boolean; data?: Guestbook }>(
        `/api/tenants/${tenantId.value}/guestbooks/${guestbookId.value}`
      )
    ])
    if (tenantResponse.data?.role) {
      userRole.value = tenantResponse.data.role
    }
    if (gbResponse.data) {
      guestbookInfo.value = gbResponse.data
    }
  } catch {
    router.push('/dashboard')
    return
  }

  await loadEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-semibold text-foreground">
          {{ guestbookInfo?.name || $t('admin.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ entries.length }} {{ entries.length === 1 ? $t('common.entry') : $t('common.entries') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink :to="`/g/${guestbookId}`" target="_blank">
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 rounded-xl border-border/20 backdrop-blur-md hover:bg-muted/50"
          >
            <Eye class="h-4 w-4" />
            <span class="hidden sm:inline">{{ $t('dashboard.viewGuestbook') }}</span>
          </Button>
        </NuxtLink>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 rounded-xl border-border/20 backdrop-blur-md hover:bg-muted/50"
          @click="showSettings = true"
        >
          <Settings class="h-4 w-4" />
          <span class="hidden sm:inline">{{ $t('settings.title') }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 rounded-xl border-border/20 backdrop-blur-md hover:bg-muted/50"
          @click="showQrCode = true"
        >
          <QrCode class="h-4 w-4" />
          <span class="hidden sm:inline">{{ $t('admin.qr.title') }}</span>
        </Button>
        <NuxtLink :to="`/g/${guestbookId}/analytics`">
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 rounded-xl border-border/20 backdrop-blur-md hover:bg-muted/50"
          >
            <BarChart3 class="h-4 w-4" />
            <span class="hidden sm:inline">{{ $t('analytics.title') }}</span>
          </Button>
        </NuxtLink>
        <NuxtLink to="/dashboard">
          <Button variant="outline" size="sm" class="gap-1.5 rounded-xl border-border/20 backdrop-blur-md hover:bg-muted/50">
            <span class="hidden sm:inline">{{ $t('common.back') }}</span>
            <span class="sm:hidden">←</span>
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Settings Modal -->
    <Dialog v-model:open="showSettings">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle class="font-display text-lg">{{ $t('settings.title') }}</DialogTitle>
          <DialogDescription>{{ $t('settings.description') }}</DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="overflow-y-auto md:max-h-[65vh] md:pr-4">
            <AdminGuestbookSettings
              v-if="guestbookInfo && resolvedTenantId"
              ref="settingsRef"
              :guestbook="guestbookInfo"
              :tenant-id="resolvedTenantId"
              @saved="reloadGuestbookInfo"
              @tab-change="handleSettingsTabChange"
            />
          </div>
          <div class="sticky top-0 hidden md:block">
            <!-- Landing Page Preview -->
            <AdminGuestbookPreview
              v-if="guestbookInfo && settingsRef?.localSettings && activeSettingsTab === 'landing'"
              :settings="settingsRef.localSettings"
              :guestbook-name="guestbookInfo.name"
            />
            <!-- Card Preview for Cards & Display tab -->
            <AdminCardPreview
              v-else-if="guestbookInfo && settingsRef?.localSettings && activeSettingsTab === 'cards'"
              :settings="settingsRef.localSettings"
            />
            <!-- Form Preview for Form tab -->
            <AdminFormPreview
              v-else-if="settingsRef?.localSettings && activeSettingsTab === 'form'"
              :settings="settingsRef.localSettings"
            />
            <!-- Slideshow Preview for Advanced tab -->
            <AdminSlideshowPreview
              v-else-if="settingsRef?.localSettings && activeSettingsTab === 'advanced'"
              :settings="settingsRef.localSettings"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- QR Code Modal -->
    <Dialog v-model:open="showQrCode">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-display text-lg">{{ $t('admin.qr.title') }}</DialogTitle>
          <DialogDescription>{{ $t('admin.qr.description') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-5">
          <div class="space-y-2">
            <Label for="eventName">{{ $t('admin.qr.eventName') }}</Label>
            <Input id="eventName" v-model="eventName" :placeholder="$t('admin.qr.eventPlaceholder')" />
            <p class="text-xs text-muted-foreground">{{ $t('admin.qr.eventHint') }}</p>
          </div>

          <div class="space-y-2">
            <Label>{{ $t('admin.qr.urlPreview') }}</Label>
            <div class="flex items-center gap-2">
              <code class="flex-1 rounded-lg bg-muted px-3 py-2 text-xs break-all">{{ qrFullUrl }}</code>
              <Button variant="outline" size="icon" class="shrink-0" @click="copyQrUrl">
                <Check v-if="qrCopied" class="h-4 w-4 text-emerald-500" />
                <Copy v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex flex-col items-center space-y-4">
            <div class="rounded-2xl border border-border/20 bg-white p-4 shadow-sm" :class="{ 'animate-pulse': qrGenerating }">
              <img v-if="qrDataUrl" :src="qrDataUrl" :alt="$t('admin.qr.title')" class="h-56 w-56">
              <div v-else class="flex h-56 w-56 items-center justify-center">
                <RefreshCw class="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
            <div class="flex gap-3">
              <Button variant="outline" size="sm" @click="downloadQrPng">
                <Download class="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button variant="outline" size="sm" @click="downloadQrSvg">
                <Download class="mr-2 h-4 w-4" /> SVG
              </Button>
            </div>
          </div>

          <div class="rounded-xl bg-muted/50 p-4">
            <p class="text-sm font-medium text-foreground">{{ $t('admin.qr.instructions') }}</p>
            <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>{{ $t('admin.qr.instruction1') }}</li>
              <li>{{ $t('admin.qr.instruction2') }}</li>
              <li>{{ $t('admin.qr.instruction3') }}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Status Tabs -->
    <div class="mb-6 flex flex-wrap gap-2">
      <Button
        v-for="tab in (['all', 'pending', 'approved', 'rejected'] as const)"
        :key="tab"
        :variant="activeTab === tab ? 'default' : 'outline'"
        size="sm"
        class="rounded-xl backdrop-blur-md"
        :class="activeTab === tab ? 'shadow-lg' : 'border-border/20 hover:bg-muted/50'"
        @click="activeTab = tab; selectedIds = []"
      >
        <Clock v-if="tab === 'pending'" class="mr-1.5 h-3.5 w-3.5" />
        <CheckCircle v-else-if="tab === 'approved'" class="mr-1.5 h-3.5 w-3.5" />
        <XCircle v-else-if="tab === 'rejected'" class="mr-1.5 h-3.5 w-3.5" />
        {{ $t(`admin.moderation.tabs.${tab}`) }}
        <Badge variant="secondary" class="ml-2">{{ statusCounts[tab] }}</Badge>
      </Button>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedIds.length > 0" class="mb-4 flex items-center gap-2 rounded-2xl bg-muted/50 backdrop-blur-md p-4 border border-border/10 shadow-md animate-scale-in">
      <span class="text-sm font-medium text-foreground">
        {{ $t('admin.moderation.selected', { count: selectedIds.length }) }}
      </span>
      <div class="ml-auto flex gap-2">
        <Button size="sm" variant="outline" class="rounded-xl border-border/20 hover:bg-green-500/10 hover:border-green-500/30" @click="handleBulkAction('approved')">
          <Check class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('admin.moderation.approveAll') }}
        </Button>
        <Button size="sm" variant="outline" class="rounded-xl border-border/20 hover:bg-red-500/10 hover:border-red-500/30" @click="handleBulkAction('rejected')">
          <X class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('admin.moderation.rejectAll') }}
        </Button>
        <Button size="sm" variant="outline" class="rounded-xl border-border/20 hover:bg-red-500/10 hover:border-red-500/30" @click="handleBulkDelete">
          <Trash2 class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('admin.moderation.deleteAll') }}
        </Button>
      </div>
    </div>

    <!-- Select All -->
    <div v-if="!loading && filteredEntries.length > 0" class="mb-4 flex items-center gap-2">
      <Checkbox
        :model-value="selectedIds.length === filteredEntries.length && filteredEntries.length > 0"
        @update:model-value="toggleSelectAll"
      />
      <span class="text-sm text-muted-foreground">{{ $t('admin.moderation.selectAll') }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <p class="animate-gentle-pulse text-muted-foreground">{{ $t('common.loading') }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">{{ $t('admin.noEntries') }}</p>
    </div>

    <!-- No results -->
    <div v-else-if="filteredEntries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">{{ $t('admin.moderation.noEntries') }}</p>
    </div>

    <!-- Entry list -->
    <div v-else class="space-y-3">
      <div
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="flex items-start gap-4 rounded-3xl p-6 transition-all duration-300"
        :class="selectedIds.includes(entry.id)
          ? 'bg-primary/10 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/20'
          : 'bg-card/70 backdrop-blur-xl border border-border/20 shadow-lg hover:shadow-xl hover:-translate-y-1'"
        style="backdrop-filter: blur(20px) saturate(180%)"
      >
        <Checkbox
          :model-value="selectedIds.includes(entry.id)"
          class="mt-5"
          @update:model-value="toggleSelection(entry.id)"
        />

        <div
          v-if="entry.photoUrl"
          class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-md transition-transform hover:scale-105"
        >
          <img :src="entry.photoUrl" :alt="entry.name" class="h-full w-full object-cover">
        </div>
        <div
          v-else
          class="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform hover:scale-105"
          style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))"
        >
          <span class="font-handwritten text-3xl text-primary">{{ entry.name.charAt(0) }}</span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-handwritten text-2xl text-foreground">{{ entry.name }}</h3>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all"
                  :class="{
                    'bg-green-500/15 text-green-700 border border-green-500/30 dark:text-green-400': entry.status === 'approved',
                    'bg-red-500/15 text-red-700 border border-red-500/30 dark:text-red-400': entry.status === 'rejected',
                    'bg-yellow-500/15 text-yellow-700 border border-yellow-500/30 dark:text-yellow-400': !entry.status || entry.status === 'pending'
                  }"
                >
                  <span
                    class="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                    :class="{
                      'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]': entry.status === 'approved',
                      'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]': entry.status === 'rejected',
                      'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]': !entry.status || entry.status === 'pending'
                    }"
                  ></span>
                  {{ $t(`admin.moderation.status.${entry.status || 'pending'}`) }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDate(entry.createdAt) }}</p>
            </div>

            <div class="flex items-center gap-1.5">
              <Button
                v-if="entry.status !== 'approved'"
                variant="ghost"
                size="icon"
                class="h-10 w-10 rounded-xl backdrop-blur-md text-green-600 hover:bg-green-500/15 hover:shadow-lg transition-all dark:text-green-400"
                @click="handleStatusUpdate(entry.id, 'approved')"
              >
                <Check class="h-5 w-5" />
              </Button>
              <Button
                v-if="entry.status !== 'rejected'"
                variant="ghost"
                size="icon"
                class="h-10 w-10 rounded-xl backdrop-blur-md text-red-600 hover:bg-red-500/15 hover:shadow-lg transition-all dark:text-red-400"
                @click="handleStatusUpdate(entry.id, 'rejected')"
              >
                <X class="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-10 w-10 rounded-xl backdrop-blur-md text-muted-foreground hover:bg-red-500/15 hover:text-red-600 hover:shadow-lg transition-all dark:hover:text-red-400"
                @click="handleDelete(entry.id)"
              >
                <Trash2 class="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">{{ entry.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
