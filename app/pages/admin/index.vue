<script setup lang="ts">
/**
 * Admin dashboard for managing guest entries.
 *
 * Displays all entries with delete functionality.
 * Requires authentication - redirects to login if not authenticated.
 */
import { Trash2, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { GuestEntry } from '~/types/guest'

const { isAuthenticated, initAuth, logout, fetchEntries, deleteEntry } = useAdmin()
const router = useRouter()

const entries = ref<GuestEntry[]>([])
const loading = ref(true)
const deleteConfirmId = ref<string | null>(null)

/**
 * Formats an ISO date string to a short format.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Loads entries from the admin API.
 */
async function loadEntries(): Promise<void> {
  loading.value = true
  const data = await fetchEntries()
  if (data) {
    entries.value = data
  }
  loading.value = false
}

/**
 * Handles entry deletion with confirmation.
 */
async function handleDelete(id: string): Promise<void> {
  const success = await deleteEntry(id)
  if (success) {
    entries.value = entries.value.filter(e => e.id !== id)
    toast.success('Eintrag gelöscht')
  } else {
    toast.error('Löschen fehlgeschlagen')
  }
  deleteConfirmId.value = null
}

/**
 * Handles logout.
 */
function handleLogout(): void {
  logout()
  toast.success('Abgemeldet')
  router.push('/admin/login')
}

onMounted(async () => {
  initAuth()
  // Redirect if not authenticated
  if (!isAuthenticated.value) {
    router.push('/admin/login')
    return
  }
  await loadEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-semibold text-foreground">
          Admin Dashboard
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ entries.length }} {{ entries.length === 1 ? 'Eintrag' : 'Einträge' }}
        </p>
      </div>
      <Button variant="outline" @click="handleLogout">
        <LogOut class="mr-2 h-4 w-4" />
        Abmelden
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <p class="animate-gentle-pulse text-muted-foreground">Lädt...</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="entries.length === 0"
      class="py-12 text-center"
    >
      <p class="text-muted-foreground">Keine Einträge vorhanden.</p>
    </div>

    <!-- Entry list -->
    <div v-else class="space-y-4">
      <Card v-for="entry in entries" :key="entry.id">
        <CardContent class="flex items-start gap-4 p-4">
          <!-- Photo -->
          <div
            v-if="entry.photoUrl"
            class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
          >
            <img
              :src="entry.photoUrl"
              :alt="entry.name"
              class="h-full w-full object-cover"
            >
          </div>
          <div
            v-else
            class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted"
          >
            <span class="font-handwritten text-2xl text-muted-foreground">
              {{ entry.name.charAt(0) }}
            </span>
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-handwritten text-xl text-foreground">
                  {{ entry.name }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(entry.createdAt) }}
                </p>
              </div>

              <!-- Delete button -->
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Der Eintrag von "{{ entry.name }}" wird unwiderruflich gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      @click="handleDelete(entry.id)"
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <p class="mt-1 line-clamp-2 text-sm text-foreground">
              {{ entry.message }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
