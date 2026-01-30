<script setup lang="ts">
/**
 * Tenant-scoped admin panel for managing entries.
 * Requires authentication and tenant ownership.
 */
import { Trash2, LogOut, QrCode, Check, X, Clock, CheckCircle, XCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { EntryStatus, GuestEntry } from '~/types/guest'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.uuid as string)
const { isAuthenticated } = useAuth()
const { fetchEntries, deleteEntry, updateEntryStatus, bulkUpdateStatus } = useTenantAdmin(tenantId)

const entries = ref<GuestEntry[]>([])
const loading = ref(true)
const selectedIds = ref<Set<string>>(new Set())
const activeTab = ref<'all' | EntryStatus>('all')

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
  const data = await fetchEntries()
  if (data) {
    entries.value = data
  }
  loading.value = false
}

async function handleDelete(id: string): Promise<void> {
  const success = await deleteEntry(id)
  if (success) {
    entries.value = entries.value.filter(e => e.id !== id)
    selectedIds.value.delete(id)
    toast.success(t('admin.deleteSuccess'))
  } else {
    toast.error(t('admin.deleteFailed'))
  }
}

async function handleStatusUpdate(id: string, status: EntryStatus): Promise<void> {
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
  const ids = Array.from(selectedIds.value)
  if (ids.length === 0) return

  const count = await bulkUpdateStatus(ids, status)
  if (count > 0) {
    await loadEntries()
    selectedIds.value.clear()
    toast.success(t('admin.moderation.bulkSuccess', { count }))
  } else {
    toast.error(t('admin.moderation.updateFailed'))
  }
}

function toggleSelection(id: string): void {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll(): void {
  if (selectedIds.value.size === filteredEntries.value.length) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(filteredEntries.value.map(e => e.id))
  }
}

function getStatusColor(status?: EntryStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
}

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  await loadEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-semibold text-foreground">
          {{ $t('admin.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ entries.length }} {{ entries.length === 1 ? $t('common.entry') : $t('common.entries') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/t/${tenantId}/admin/qr`">
          <Button variant="outline" size="sm">
            <QrCode class="mr-2 h-4 w-4" />
            {{ $t('admin.qr.title') }}
          </Button>
        </NuxtLink>
        <NuxtLink to="/dashboard">
          <Button variant="outline" size="sm">
            {{ $t('common.back') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="mb-6 flex flex-wrap gap-2">
      <Button
        v-for="tab in (['all', 'pending', 'approved', 'rejected'] as const)"
        :key="tab"
        :variant="activeTab === tab ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = tab; selectedIds.clear()"
      >
        <Clock v-if="tab === 'pending'" class="mr-1.5 h-3.5 w-3.5" />
        <CheckCircle v-else-if="tab === 'approved'" class="mr-1.5 h-3.5 w-3.5" />
        <XCircle v-else-if="tab === 'rejected'" class="mr-1.5 h-3.5 w-3.5" />
        {{ $t(`admin.moderation.tabs.${tab}`) }}
        <span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{{ statusCounts[tab] }}</span>
      </Button>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedIds.size > 0" class="mb-4 flex items-center gap-2 rounded-lg bg-muted p-3">
      <span class="text-sm text-muted-foreground">
        {{ $t('admin.moderation.selected', { count: selectedIds.size }) }}
      </span>
      <div class="ml-auto flex gap-2">
        <Button size="sm" variant="outline" @click="handleBulkAction('approved')">
          <Check class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('admin.moderation.approveAll') }}
        </Button>
        <Button size="sm" variant="outline" @click="handleBulkAction('rejected')">
          <X class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('admin.moderation.rejectAll') }}
        </Button>
      </div>
    </div>

    <!-- Select All -->
    <div v-if="!loading && filteredEntries.length > 0" class="mb-4 flex items-center gap-2">
      <Checkbox
        :checked="selectedIds.size === filteredEntries.length && filteredEntries.length > 0"
        @update:checked="toggleSelectAll"
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
    <div v-else class="space-y-4">
      <Card v-for="entry in filteredEntries" :key="entry.id">
        <CardContent class="flex items-start gap-4 p-4">
          <Checkbox
            :checked="selectedIds.has(entry.id)"
            class="mt-5"
            @update:checked="toggleSelection(entry.id)"
          />

          <div
            v-if="entry.photoUrl"
            class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
          >
            <img :src="entry.photoUrl" :alt="entry.name" class="h-full w-full object-cover">
          </div>
          <div
            v-else
            class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted"
          >
            <span class="font-handwritten text-2xl text-muted-foreground">{{ entry.name.charAt(0) }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-handwritten text-xl text-foreground">{{ entry.name }}</h3>
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="getStatusColor(entry.status)"
                  >
                    {{ $t(`admin.moderation.status.${entry.status || 'pending'}`) }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground">{{ formatDate(entry.createdAt) }}</p>
              </div>

              <div class="flex items-center gap-1">
                <Button
                  v-if="entry.status !== 'approved'"
                  variant="ghost"
                  size="icon"
                  class="text-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30"
                  @click="handleStatusUpdate(entry.id, 'approved')"
                >
                  <Check class="h-4 w-4" />
                </Button>
                <Button
                  v-if="entry.status !== 'rejected'"
                  variant="ghost"
                  size="icon"
                  class="text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
                  @click="handleStatusUpdate(entry.id, 'rejected')"
                >
                  <X class="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{{ $t('admin.deleteEntry') }}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {{ $t('admin.deleteConfirm', { name: entry.name }) }}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
                      <AlertDialogAction
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        @click="handleDelete(entry.id)"
                      >
                        {{ $t('common.delete') }}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p class="mt-1 line-clamp-2 text-sm text-foreground">{{ entry.message }}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
