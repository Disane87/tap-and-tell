<script setup lang="ts">
/**
 * Polaroid-inspired guest entry card for the guestbook grid.
 *
 * Displays photo, name (handwritten font), truncated message, date,
 * and up to 3 answer preview badges. Emits a click event to open
 * the full entry detail sheet.
 *
 * @emits click - When the card is clicked.
 */
import { useTimeAgo } from '@vueuse/core'
import { Play, Images } from 'lucide-vue-next'
import type { GuestEntry, EntryMedia } from '~/types/guest'
import type { CustomQuestion } from '~/types/guestbook'

const { t, locale } = useI18n()

const props = defineProps<{
  entry: GuestEntry
  cardStyle?: 'polaroid' | 'minimal' | 'rounded' | 'bordered'
  customQuestions?: CustomQuestion[]
}>()

/** CSS class for the card style. */
const cardClass = computed(() => {
  switch (props.cardStyle) {
    case 'minimal': return 'card-minimal'
    case 'rounded': return 'card-rounded'
    case 'bordered': return 'card-bordered'
    default: return 'card-polaroid'
  }
})

defineEmits<{
  click: []
}>()

/**
 * Cover media for the card: the first media item, falling back to the legacy
 * photo URL. May be a video (rendered as a muted preview).
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
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Relative time display with localization.
 * Falls back to absolute date for entries older than 7 days.
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

/**
 * Generates up to 3 answer preview badges from entry answers.
 */
const answerBadges = computed(() => {
  const badges: { text: string; class: string }[] = []
  const a = props.entry.answers
  if (!a) return badges

  if (a.favoriteColor) badges.push({ text: `🎨 ${a.favoriteColor}`, class: 'badge-emerald' })
  if (a.favoriteFood) badges.push({ text: `🍜 ${a.favoriteFood}`, class: 'badge-yellow' })
  if (a.favoriteMovie) badges.push({ text: `🎬 ${a.favoriteMovie}`, class: 'badge-indigo' })
  if (a.superpower) badges.push({ text: `🦸 ${a.superpower}`, class: 'badge-pink' })
  if (a.coffeeOrTea) badges.push({ text: a.coffeeOrTea === 'coffee' ? `☕ ${t('entry.badges.coffee')}` : `🍵 ${t('entry.badges.tea')}`, class: '' })
  if (a.nightOwlOrEarlyBird) badges.push({ text: a.nightOwlOrEarlyBird === 'night_owl' ? `🦉 ${t('entry.badges.nightOwl')}` : `🐦 ${t('entry.badges.earlyBird')}`, class: 'badge-blue' })
  if (a.beachOrMountains) badges.push({ text: a.beachOrMountains === 'beach' ? `🏖️ ${t('entry.badges.beach')}` : `⛰️ ${t('entry.badges.mountains')}`, class: 'badge-orange' })

  // Add custom answer badges
  if (a.customAnswers && props.customQuestions) {
    for (const q of props.customQuestions) {
      const answer = a.customAnswers[q.id]
      if (answer) {
        badges.push({ text: `💬 ${answer}`, class: 'badge-purple' })
      }
    }
  }

  return badges.slice(0, 3)
})
</script>

<template>
  <button
    class="w-full cursor-pointer text-left"
    :class="cardClass"
    @click="$emit('click')"
  >
    <div v-if="cover" class="photo-frame relative mb-3 aspect-square w-full bg-muted">
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
        :alt="$t('entry.photoBy', { name: entry.name })"
        class="h-full w-full object-cover"
      >

      <!-- Video play indicator -->
      <div
        v-if="cover.type === 'video'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
          <Play class="h-5 w-5" />
        </div>
      </div>

      <!-- Media count badge -->
      <div
        v-if="mediaCount > 1"
        class="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white"
      >
        <Images class="h-3 w-3" />
        {{ mediaCount }}
      </div>
    </div>
    <h3 class="font-handwritten text-2xl text-foreground">
      {{ entry.name }}
    </h3>
    <p class="mt-1 line-clamp-3 text-sm text-muted-foreground">
      {{ entry.message }}
    </p>
    <div v-if="answerBadges.length > 0" class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="badge in answerBadges"
        :key="badge.text"
        class="answer-badge"
        :class="badge.class"
      >
        {{ badge.text }}
      </span>
    </div>
    <p
      class="mt-2 text-xs text-muted-foreground/70"
      :title="formatDate(entry.createdAt)"
    >
      {{ relativeTime }}
    </p>
  </button>
</template>
