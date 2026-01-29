<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Trash2, LogOut, RefreshCw } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const { isAuthenticated, checkAuth, logout, getToken } = useAdmin()
const router = useRouter()

const entries = ref<GuestEntry[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const entryToDelete = ref<GuestEntry | null>(null)
const deleteDialogOpen = ref(false)

onMounted(() => {
  if (!checkAuth()) {
    router.push('/admin/login')
    return
  }
  fetchEntries()
})

async function fetchEntries() {
  isLoading.value = true
  error.value = null

  try {
    const token = getToken()
    const response = await $fetch<{ success: boolean; data?: GuestEntry[]; count?: number }>('/api/admin/entries', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (response.success && response.data) {
      entries.value = response.data
    }
  } catch (err) {
    error.value = 'Failed to load entries'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

function confirmDelete(entry: GuestEntry) {
  entryToDelete.value = entry
  deleteDialogOpen.value = true
}

async function deleteEntry() {
  if (!entryToDelete.value) return

  try {
    const token = getToken()
    await $fetch(`/api/admin/entries/${entryToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    entries.value = entries.value.filter(e => e.id !== entryToDelete.value?.id)
    toast.success('Entry deleted')
  } catch (err) {
    toast.error('Failed to delete entry')
    console.error(err)
  } finally {
    entryToDelete.value = null
    deleteDialogOpen.value = false
  }
}

function handleLogout() {
  logout()
  router.push('/admin/login')
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p class="text-muted-foreground">
          Manage guestbook entries ({{ entries.length }} total)
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="icon" :disabled="isLoading" @click="fetchEntries">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        </Button>
        <Button variant="outline" @click="handleLogout">
          <LogOut class="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>

    <div v-if="isLoading && entries.length === 0" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
      <p class="text-destructive">{{ error }}</p>
      <Button variant="outline" class="mt-4" @click="fetchEntries">
        Try Again
      </Button>
    </div>

    <div v-else-if="entries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">No entries yet.</p>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="entry in entries" :key="entry.id">
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg">{{ entry.name }}</CardTitle>
              <p class="text-xs text-muted-foreground">{{ formatDate(entry.createdAt) }}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive"
              @click="confirmDelete(entry)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex gap-4">
            <div v-if="entry.photoUrl" class="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img :src="entry.photoUrl" :alt="entry.name" class="h-full w-full object-cover">
            </div>
            <p class="flex-1 text-sm text-muted-foreground line-clamp-3">{{ entry.message }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the entry from "{{ entryToDelete?.name }}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="deleteEntry">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
