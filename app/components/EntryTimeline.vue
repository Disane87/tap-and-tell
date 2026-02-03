<script setup lang="ts">
/**
 * Timeline layout for guestbook entries.
 *
 * Displays entries in a vertical timeline with date separators
 * and a connecting line.
 *
 * @props entries - Array of guest entries to display.
 * @emits entry-click - When an entry is clicked.
 */
import type { GuestEntry } from '~/types/guest'

const { locale } = useI18n()

const props = defineProps<{
  entries: GuestEntry[]
}>()

defineEmits<{
  'entry-click': [entry: GuestEntry]
}>()

/**
 * Groups entries by date for timeline separators.
 */
interface TimelineGroup {
  date: string
  label: string
  entries: GuestEntry[]
}

const groupedEntries = computed<TimelineGroup[]>(() => {
  const groups: Map<string, GuestEntry[]> = new Map()

  for (const entry of props.entries) {
    const date = new Date(entry.createdAt)
    const dateKey = date.toISOString().split('T')[0]

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(entry)
  }

  return Array.from(groups.entries()).map(([dateKey, entries]) => ({
    date: dateKey,
    label: formatDateLabel(dateKey),
    entries
  }))
})

/**
 * Formats a date key to a human-readable label.
 */
function formatDateLabel(dateKey: string): string {
  const date = new Date(dateKey)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return locale.value === 'de' ? 'Heute' : 'Today'
  }
  if (diffDays === 1) {
    return locale.value === 'de' ? 'Gestern' : 'Yesterday'
  }

  return date.toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Formats time from ISO string.
 */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="relative">
    <!-- Timeline line -->
    <div class="absolute left-[19px] top-0 h-full w-0.5 bg-border/50" />

    <div class="space-y-6">
      <div v-for="group in groupedEntries" :key="group.date" class="space-y-4">
        <!-- Date separator -->
        <div class="relative flex items-center gap-3">
          <div class="z-10 h-10 w-10 rounded-full bg-primary/10 ring-4 ring-background flex items-center justify-center">
            <span class="text-xs font-medium text-primary">
              {{ new Date(group.date).getDate() }}
            </span>
          </div>
          <span class="text-sm font-medium text-foreground">
            {{ group.label }}
          </span>
        </div>

        <!-- Entries for this date -->
        <div class="ml-5 space-y-3 border-l-2 border-border/30 pl-8">
          <button
            v-for="entry in group.entries"
            :key="entry.id"
            class="relative flex w-full items-start gap-4 rounded-xl border border-border/30 bg-card/50 p-4 text-left transition-colors hover:bg-card/80"
            @click="$emit('entry-click', entry)"
          >
            <!-- Connector dot -->
            <div class="absolute -left-[25px] top-6 h-2 w-2 rounded-full bg-muted-foreground/50" />

            <!-- Photo -->
            <div
              v-if="entry.photoUrl"
              class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted"
            >
              <img
                :src="entry.photoUrl"
                :alt="entry.name"
                class="h-full w-full object-cover"
              >
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <h3 class="truncate font-handwritten text-lg text-foreground">
                  {{ entry.name }}
                </h3>
                <span class="shrink-0 text-xs text-muted-foreground">
                  {{ formatTime(entry.createdAt) }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {{ entry.message }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
