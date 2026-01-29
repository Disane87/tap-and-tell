<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'

const { entries, isLoading, error, fetchEntries } = useGuests()

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)

function openEntry(entry: GuestEntry) {
  selectedEntry.value = entry
  sheetOpen.value = true
}

onMounted(() => {
  fetchEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Guestbook</h1>
        <p class="text-muted-foreground">
          Messages from our guests
        </p>
      </div>
      <NuxtLink to="/">
        <Button>Leave a Message</Button>
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
      <p class="text-destructive">{{ error }}</p>
      <Button variant="outline" class="mt-4" @click="fetchEntries">
        Try Again
      </Button>
    </div>

    <div v-else-if="entries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">No messages yet. Be the first to leave one!</p>
      <NuxtLink to="/">
        <Button class="mt-4">Leave a Message</Button>
      </NuxtLink>
    </div>

    <div v-else class="stagger-enter grid gap-6 md:grid-cols-2">
      <GuestCard
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        class="card-enter-active"
        @click="openEntry"
      />
    </div>

    <EntrySheet
      :entry="selectedEntry"
      :open="sheetOpen"
      @update:open="sheetOpen = $event"
    />
  </div>
</template>
