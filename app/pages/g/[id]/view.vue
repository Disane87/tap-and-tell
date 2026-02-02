<script setup lang="ts">
/**
 * Guestbook view page - displays all approved entries in a grid.
 * URL: /g/[id]/view
 */
import { Search, X, ArrowUpDown, Play, Download, Loader2 } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'

const { locale } = useI18n()
const route = useRoute()
const guestbookId = computed(() => route.params.id as string)

const { entries, loading, fetchEntries } = useGuestbook(guestbookId)
const { searchQuery, sortOrder, filterEntries, clearFilters, hasActiveFilters } = useEntryFilters()
const { generatePdf, isGenerating } = usePdfExport()

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)

async function exportToPdf(): Promise<void> {
  if (entries.value.length === 0 || isGenerating.value) return
  await generatePdf(entries.value, undefined, locale.value)
}

const filteredEntries = computed(() => filterEntries(entries.value))

function openEntry(entry: GuestEntry): void {
  selectedEntry.value = entry
  sheetOpen.value = true
}

function toggleSortOrder(): void {
  sortOrder.value = sortOrder.value === 'newest' ? 'oldest' : 'newest'
}

onMounted(() => {
  fetchEntries()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-6 text-center">
      <h1 class="font-handwritten text-4xl text-foreground">
        {{ $t('guestbook.title') }}
      </h1>
      <p class="mt-2 text-muted-foreground">
        {{ filteredEntries.length }}
        <span v-if="hasActiveFilters"> {{ $t('guestbook.of') }} {{ entries.length }}</span>
        {{ entries.length === 1 ? $t('common.entry') : $t('common.entries') }}
      </p>
    </div>

    <!-- Search and Filter Bar -->
    <div v-if="!loading && entries.length > 0" class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('guestbook.searchPlaceholder')"
          class="pl-9 pr-9"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          @click="searchQuery = ''"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="flex items-center gap-2"
        @click="toggleSortOrder"
      >
        <ArrowUpDown class="h-4 w-4" />
        {{ sortOrder === 'newest' ? $t('guestbook.sortNewest') : $t('guestbook.sortOldest') }}
      </Button>

      <Button
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearFilters"
      >
        {{ $t('guestbook.clearFilters') }}
      </Button>

      <div class="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="flex items-center gap-2"
          :disabled="isGenerating"
          @click="exportToPdf"
        >
          <Loader2 v-if="isGenerating" class="h-4 w-4 animate-spin" />
          <Download v-else class="h-4 w-4" />
          {{ $t('guestbook.exportPdf') }}
        </Button>

        <NuxtLink :to="`/g/${guestbookId}/slideshow`">
          <Button variant="outline" size="sm" class="flex items-center gap-2">
            <Play class="h-4 w-4" />
            {{ $t('nav.slideshow') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <p class="animate-gentle-pulse text-muted-foreground">{{ $t('common.loading') }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">{{ $t('guestbook.empty') }}</p>
      <NuxtLink :to="`/g/${guestbookId}`">
        <Button class="mt-4">{{ $t('guestbook.createFirst') }}</Button>
      </NuxtLink>
    </div>

    <!-- No results -->
    <div v-else-if="filteredEntries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">{{ $t('guestbook.noResults') }}</p>
      <Button variant="outline" class="mt-4" @click="clearFilters">
        {{ $t('guestbook.clearFilters') }}
      </Button>
    </div>

    <!-- Entry grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GuestCard
        v-for="entry in filteredEntries"
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
