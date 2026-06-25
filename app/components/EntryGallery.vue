<script setup lang="ts">
/**
 * Reusable gallery of approved guest entries.
 *
 * Renders the configured layout variant (grid / masonry / list / timeline)
 * and owns the detail `EntrySheet` opened when an entry is clicked.
 *
 * Extracted from the guestbook view page so the same gallery can be reused
 * on the desktop landing layout. The parent is responsible for loading,
 * empty and no-results states — this component only renders a given list.
 *
 * @props entries - Approved entries to display.
 * @props viewLayout - Layout variant (default: grid).
 * @props cardStyle - Card visual style for grid/masonry (default: polaroid).
 * @props customQuestions - Custom questions used to label answers in the detail sheet.
 */
import type { GuestEntry } from '~/types/guest'
import type { CustomQuestion } from '~/types/guestbook'

withDefaults(defineProps<{
  entries: GuestEntry[]
  viewLayout?: 'grid' | 'masonry' | 'list' | 'timeline'
  cardStyle?: 'polaroid' | 'minimal' | 'rounded' | 'bordered'
  customQuestions?: CustomQuestion[]
}>(), {
  viewLayout: 'grid',
  cardStyle: 'polaroid',
  customQuestions: () => []
})

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)

/** Opens the detail sheet for the given entry. */
function openEntry(entry: GuestEntry): void {
  selectedEntry.value = entry
  sheetOpen.value = true
}
</script>

<template>
  <div>
    <!-- Grid layout (default) -->
    <div v-if="viewLayout === 'grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <GuestCard
        v-for="entry in entries"
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
        v-for="entry in entries"
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
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @click="openEntry(entry)"
      />
    </div>

    <!-- Timeline layout -->
    <EntryTimeline
      v-else-if="viewLayout === 'timeline'"
      :entries="entries"
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
</template>
