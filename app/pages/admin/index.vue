<script setup lang="ts">
/**
 * Admin dashboard page.
 *
 * Displays all guest entries in a list with delete functionality.
 * Protected by admin authentication — redirects to login if not authenticated.
 */
import { Trash2, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { GuestEntry } from '~/types/guest'

const { isAuthenticated, checkAuth, logout, getToken } = useAdmin()
const router = useRouter()

const entries = ref<GuestEntry[]>([])
const isLoading = ref(false)
const deleteTarget = ref<GuestEntry | null>(null)
const showDeleteDialog = ref(false)

/** Fetches entries using the admin-authenticated endpoint. */
async function fetchAdminEntries(): Promise<void> {
  isLoading.value = true
  try {
    const token = getToken()
    const response = await $fetch<{ success: boolean; data?: GuestEntry[] }>('/api/admin/entries', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.success && response.data) {
      entries.value = response.data
    }
  } catch {
    toast.error('Failed to fetch entries')
  } finally {
    isLoading.value = false
  }
}

/** Deletes an entry after confirmation. */
async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return

  try {
    const token = getToken()
    await $fetch(`/api/admin/entries/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    entries.value = entries.value.filter(e => e.id !== deleteTarget.value!.id)
    toast.success('Entry deleted')
  } catch {
    toast.error('Failed to delete entry')
  } finally {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }
}

/** Opens the delete confirmation dialog. */
function promptDelete(entry: GuestEntry): void {
  deleteTarget.value = entry
  showDeleteDialog.value = true
}

function handleLogout(): void {
  logout()
  router.push('/admin/login')
}

/** Formats an ISO date string. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  checkAuth()
  if (!isAuthenticated.value) {
    router.push('/admin/login')
    return
  }
  fetchAdminEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl font-bold">Admin Dashboard</h1>
      <Button variant="ghost" size="sm" @click="handleLogout">
        <LogOut class="mr-1.5 h-4 w-4" />
        Logout
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12 text-center">
      <p class="animate-gentle-pulse text-muted-foreground">Loading entries...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">No guest entries yet.</p>
    </div>

    <!-- Entry list -->
    <div v-else class="space-y-3">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="card-polaroid flex items-start justify-between gap-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <img
              v-if="entry.photoUrl"
              :src="entry.photoUrl"
              :alt="entry.name"
              class="h-10 w-10 rounded-full object-cover"
            >
            <div>
              <h3 class="font-handwritten text-xl">{{ entry.name }}</h3>
              <p class="text-xs text-muted-foreground">{{ formatDate(entry.createdAt) }}</p>
            </div>
          </div>
          <p class="mt-2 line-clamp-2 text-sm text-muted-foreground">{{ entry.message }}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 text-destructive hover:bg-destructive/10"
          @click="promptDelete(entry)"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {{ deleteTarget?.name }}'s entry? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeleteDialog = false">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDelete"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
