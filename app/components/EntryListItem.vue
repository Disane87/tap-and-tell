<script setup lang="ts">
/**
 * Compact list view item for guestbook entries.
 *
 * Displays a thumbnail, name, truncated message, and date in a horizontal row.
 *
 * @emits click - When the item is clicked.
 */
import { useTimeAgo } from '@vueuse/core'
import type { GuestEntry } from '~/types/guest'

const { locale } = useI18n()

const props = defineProps<{
  entry: GuestEntry
}>()

defineEmits<{
  click: []
}>()

/**
 * Formats an ISO date string to a short human-readable format.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Relative time display with localization.
 */
const relativeTime = computed(() => {
  const date = new Date(props.entry.createdAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays > 7) {
    return formatDate(props.entry.createdAt)
  }

  return useTimeAgo(date, {
    messages: locale.value === 'de' ? {
      justNow: 'gerade eben',
      past: n => n.match(/\d/) ? `vor ${n}` : n,
      future: n => n.match(/\d/) ? `in ${n}` : n,
      month: (n, past) => n === 1 ? (past ? 'letzten Monat' : 'nächsten Monat') : `${n} Monaten`,
      year: (n, past) => n === 1 ? (past ? 'letztes Jahr' : 'nächstes Jahr') : `${n} Jahren`,
      day: (n, past) => n === 1 ? (past ? 'gestern' : 'morgen') : `${n} Tagen`,
      week: (n, past) => n === 1 ? (past ? 'letzte Woche' : 'nächste Woche') : `${n} Wochen`,
      hour: n => `${n} Stunde${n > 1 ? 'n' : ''}`,
      minute: n => `${n} Minute${n > 1 ? 'n' : ''}`,
      second: n => `${n} Sekunde${n > 1 ? 'n' : ''}`,
      invalid: ''
    } : undefined
  }).value
})
</script>

<template>
  <button
    class="flex w-full items-start gap-4 rounded-xl border border-border/30 bg-card/50 p-4 text-left transition-colors hover:bg-card/80"
    @click="$emit('click')"
  >
    <!-- Thumbnail -->
    <div
      v-if="entry.photoUrl"
      class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
    >
      <img
        :src="entry.photoUrl"
        :alt="entry.name"
        class="h-full w-full object-cover"
      >
    </div>
    <div
      v-else
      class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl"
    >
      {{ entry.name.charAt(0).toUpperCase() }}
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <h3 class="truncate font-handwritten text-xl text-foreground">
          {{ entry.name }}
        </h3>
        <span class="shrink-0 text-xs text-muted-foreground">
          {{ relativeTime }}
        </span>
      </div>
      <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {{ entry.message }}
      </p>
    </div>
  </button>
</template>
