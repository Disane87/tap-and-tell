<script setup lang="ts">
/**
 * Compact list view item for guestbook entries.
 *
 * Displays a thumbnail, name, truncated message, and date in a horizontal row.
 *
 * @emits click - When the item is clicked.
 */
import { useTimeAgo } from '@vueuse/core'
import { Play } from 'lucide-vue-next'
import type { GuestEntry, EntryMedia } from '~/types/guest'

const { locale } = useI18n()

const props = defineProps<{
  entry: GuestEntry
}>()

defineEmits<{
  click: []
}>()

/**
 * Thumbnail media: the first media item, falling back to the legacy photo URL.
 */
const cover = computed<EntryMedia | null>(() => {
  if (props.entry.media && props.entry.media.length > 0) return props.entry.media[0]
  if (props.entry.photoUrl) return { type: 'image', url: props.entry.photoUrl, mime: '' }
  return null
})

/** Total number of media items attached to the entry. */
const mediaCount = computed(() => props.entry.media?.length ?? (props.entry.photoUrl ? 1 : 0))

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
      v-if="cover"
      class="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
    >
      <video
        v-if="cover.type === 'video'"
        :src="cover.url"
        class="h-full w-full bg-black object-cover"
        muted
        playsinline
        preload="metadata"
      />
      <img
        v-else
        :src="cover.url"
        :alt="entry.name"
        class="h-full w-full object-cover"
      >
      <!-- Video indicator -->
      <div
        v-if="cover.type === 'video'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <Play class="h-5 w-5 text-white drop-shadow" />
      </div>
      <!-- Media count badge -->
      <div
        v-if="mediaCount > 1"
        class="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white"
      >
        {{ mediaCount }}
      </div>
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
