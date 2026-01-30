<script setup lang="ts">
/**
 * Guestbook page displaying all entries in a responsive grid.
 *
 * Each card can be clicked to open a bottom sheet with full details.
 */
import type { GuestEntry } from '~/types/guest'

const { entries, loading, fetchEntries } = useGuests()

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)

/**
 * Opens the detail sheet for an entry.
 */
function openEntry(entry: GuestEntry): void {
  selectedEntry.value = entry
  sheetOpen.value = true
}

onMounted(() => {
  fetchEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 text-center">
      <h1 class="font-handwritten text-4xl text-foreground">
        Guestbook
      </h1>
      <p class="mt-2 text-muted-foreground">
        {{ entries.length }} {{ entries.length === 1 ? 'Eintrag' : 'Einträge' }}
      </p>
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
      <p class="text-muted-foreground">Noch keine Einträge vorhanden.</p>
      <NuxtLink to="/">
        <Button class="mt-4">
          Ersten Eintrag erstellen
        </Button>
      </NuxtLink>
    </div>

    <!-- Entry grid -->
    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <GuestCard
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @click="openEntry(entry)"
      />
    </div>

    <!-- Detail sheet -->
    <EntrySheet
      :entry="selectedEntry"
      :open="sheetOpen"
      @update:open="sheetOpen = $event"
    />
  </div>
</template>
