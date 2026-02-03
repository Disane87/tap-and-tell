<script setup lang="ts">
/**
 * Guestbook view page - displays all approved entries in a grid.
 * URL: /g/[id]/view
 */
import { Search, X, ArrowUpDown, Play, Download, Loader2 } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'
import type { CustomQuestion } from '~/types/guestbook'

const { locale } = useI18n()
const route = useRoute()
const guestbookId = computed(() => route.params.id as string)

const { entries, loading, fetchEntries } = useGuestbook(guestbookId)
const { searchQuery, sortOrder, filterEntries, clearFilters, hasActiveFilters } = useEntryFilters()
const { apply: applyColorScheme } = useForcedColorScheme()
const { generatePdf, isGenerating } = usePdfExport()

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)
const guestbookInfo = ref<{ settings?: Record<string, unknown> } | null>(null)

/** Computed background styles from guestbook settings. */
const backgroundStyles = computed(() => {
  const settings = guestbookInfo.value?.settings
  if (!settings) return {}
  const styles: Record<string, string> = {}
  const bgColor = settings.backgroundColor as string | undefined
  const bgImage = settings.backgroundImageUrl as string | undefined
  if (bgColor) {
    styles.backgroundColor = bgColor
  }
  if (bgImage) {
    styles.backgroundImage = `url(${bgImage})`
    styles.backgroundSize = 'cover'
    styles.backgroundPosition = 'center'
    styles.backgroundRepeat = 'no-repeat'
    styles.backgroundAttachment = 'fixed'
  }
  return styles
})

/** Card style from guestbook settings. */
const cardStyle = computed(() =>
  (guestbookInfo.value?.settings?.cardStyle as 'polaroid' | 'minimal' | 'rounded' | 'bordered' | undefined) || 'polaroid'
)

/** Custom questions from guestbook settings. */
const customQuestions = computed(() =>
  (guestbookInfo.value?.settings?.customQuestions as CustomQuestion[] | undefined) || []
)

/** View layout from guestbook settings. */
const viewLayout = computed(() =>
  (guestbookInfo.value?.settings?.viewLayout as 'grid' | 'masonry' | 'list' | 'timeline' | undefined) || 'grid'
)

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

/** Apply custom theme and text color from guestbook settings. */
watchEffect(() => {
  const settings = guestbookInfo.value?.settings
  const themeColor = (settings?.themeColor as string) || undefined
  const textColor = (settings?.textColor as string) || undefined
  if (themeColor) {
    document.documentElement.style.setProperty('--color-primary', themeColor)
  }
  if (textColor) {
    document.documentElement.style.setProperty('--color-foreground', textColor)
    document.documentElement.style.setProperty('--color-card-foreground', textColor)
  }
})

onMounted(async () => {
  try {
    const response = await $fetch<{ success: boolean; data?: typeof guestbookInfo.value }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (response.success && response.data) {
      guestbookInfo.value = response.data
      applyColorScheme(response.data.settings?.colorScheme as 'system' | 'light' | 'dark' | undefined)
    }
  } catch {
    // Non-critical, page still works without background
  }

  await fetchEntries()
})

onUnmounted(() => {
  document.documentElement.style.removeProperty('--color-primary')
  document.documentElement.style.removeProperty('--color-foreground')
  document.documentElement.style.removeProperty('--color-card-foreground')
})
</script>

<template>
  <div class="min-h-screen" :style="backgroundStyles">
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

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i" class="overflow-hidden">
        <Skeleton class="h-48 w-full" />
        <CardContent class="p-4 space-y-2">
          <Skeleton class="h-5 w-24" />
          <Skeleton class="h-3 w-full" />
          <Skeleton class="h-3 w-2/3" />
        </CardContent>
      </Card>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="entries.length === 0"
      :title="$t('guestbook.empty')"
    >
      <template #icon>
        <Search class="h-8 w-8 text-muted-foreground" />
      </template>
      <template #action>
        <NuxtLink :to="`/g/${guestbookId}`">
          <Button>{{ $t('guestbook.createFirst') }}</Button>
        </NuxtLink>
      </template>
    </EmptyState>

    <!-- No results -->
    <div v-else-if="filteredEntries.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">{{ $t('guestbook.noResults') }}</p>
      <Button variant="outline" class="mt-4" @click="clearFilters">
        {{ $t('guestbook.clearFilters') }}
      </Button>
    </div>

    <!-- Grid layout (default) -->
    <div v-else-if="viewLayout === 'grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GuestCard
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        :card-style="cardStyle"
        :custom-questions="customQuestions"
        @click="openEntry(entry)"
      />
    </div>

    <!-- Masonry layout -->
    <MasonryGrid v-else-if="viewLayout === 'masonry'">
      <GuestCard
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        :card-style="cardStyle"
        :custom-questions="customQuestions"
        @click="openEntry(entry)"
      />
    </MasonryGrid>

    <!-- List layout -->
    <div v-else-if="viewLayout === 'list'" class="space-y-3">
      <EntryListItem
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        @click="openEntry(entry)"
      />
    </div>

    <!-- Timeline layout -->
    <EntryTimeline
      v-else-if="viewLayout === 'timeline'"
      :entries="filteredEntries"
      @entry-click="openEntry"
    />

    <!-- Detail sheet -->
    <EntrySheet
      :entry="selectedEntry"
      :open="sheetOpen"
      :custom-questions="customQuestions"
      @update:open="sheetOpen = $event"
    />
  </div>
  </div>
</template>
