<script setup lang="ts">
/**
 * Full-screen entry view matching the mockup design.
 *
 * Layout: Top image (45vh), bottom sheet (scrollable) with:
 * - Sheet grabber
 * - Name and badges
 * - Message
 * - Sections: Favoriten, Fun Facts, Our Story, Date
 * - Spotify/YouTube embeds for media links
 *
 * @props entry - The guest entry to display.
 */
import { ExternalLink, Heart, MessageCircle } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'

const { t, locale } = useI18n()

const props = defineProps<{
  entry: GuestEntry
}>()

/**
 * Formats an ISO date string to a full German date format.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Extracts Spotify track ID from URL for embedding.
 */
function getSpotifyEmbedUrl(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`
  }
  return null
}

/**
 * Extracts YouTube video ID from URL for embedding.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

/**
 * Computed badges for quick display.
 */
const quickBadges = computed(() => {
  const badges: { text: string; class: string }[] = []
  const a = props.entry.answers
  if (!a) return badges

  if (a.favoriteColor) badges.push({ text: `🟢 ${a.favoriteColor}`, class: 'badge-emerald' })
  if (a.favoriteFood) badges.push({ text: `🍜 ${a.favoriteFood}`, class: 'badge-yellow' })
  if (a.favoriteMovie) badges.push({ text: `🎬 ${a.favoriteMovie}`, class: 'badge-indigo' })
  if (a.superpower) badges.push({ text: `🦸 ${a.superpower}`, class: 'badge-pink' })
  if (a.coffeeOrTea) badges.push({ text: a.coffeeOrTea === 'coffee' ? `☕ ${t('entry.badges.coffee')}` : `🍵 ${t('entry.badges.tea')}`, class: '' })

  return badges.slice(0, 5)
})

/**
 * Toggle badges for fun facts.
 */
const toggleBadges = computed(() => {
  const badges: { text: string; class: string }[] = []
  const a = props.entry.answers
  if (!a) return badges

  if (a.coffeeOrTea) badges.push({ text: a.coffeeOrTea === 'coffee' ? `☕ ${t('entry.badges.coffee')}` : `🍵 ${t('entry.badges.tea')}`, class: '' })
  if (a.nightOwlOrEarlyBird) badges.push({ text: a.nightOwlOrEarlyBird === 'night_owl' ? `🦉 ${t('entry.badges.nightOwl')}` : `🐦 ${t('entry.badges.earlyBird')}`, class: 'badge-blue' })
  if (a.beachOrMountains) badges.push({ text: a.beachOrMountains === 'beach' ? `🏖️ ${t('entry.badges.beach')}` : `⛰️ ${t('entry.badges.mountains')}`, class: 'badge-orange' })

  return badges
})

/**
 * Check if there are any favorites to display.
 */
const hasFavorites = computed(() => {
  const a = props.entry.answers
  if (!a) return false
  return a.favoriteColor || a.favoriteFood || a.favoriteMovie || a.favoriteSong || a.favoriteVideo
})

/**
 * Check if there are any fun facts to display.
 */
const hasFunFacts = computed(() => {
  const a = props.entry.answers
  if (!a) return false
  return a.superpower || a.hiddenTalent || a.desertIslandItems || a.coffeeOrTea || a.nightOwlOrEarlyBird || a.beachOrMountains
})

/**
 * Check if there is any "Our Story" content.
 */
const hasOurStory = computed(() => {
  const a = props.entry.answers
  if (!a) return false
  return a.howWeMet || a.bestMemory
})

/**
 * Spotify embed URL if available.
 */
const spotifyEmbed = computed(() => {
  const url = props.entry.answers?.favoriteSong?.url
  return url ? getSpotifyEmbedUrl(url) : null
})

/**
 * YouTube embed URL if available.
 */
const youtubeEmbed = computed(() => {
  const url = props.entry.answers?.favoriteVideo?.url
  return url ? getYouTubeEmbedUrl(url) : null
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- Top image (fixed, no scroll) -->
    <section class="h-[45vh] w-full">
      <img
        v-if="entry.photoUrl"
        :src="entry.photoUrl"
        :alt="$t('entry.photoBy', { name: entry.name })"
        class="h-full w-full object-cover"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600"
      >
        <span class="font-handwritten text-6xl text-white/80">{{ entry.name.charAt(0) }}</span>
      </div>
    </section>

    <!-- Bottom sheet -->
    <section
      class="sheet-scroll absolute bottom-0 left-0 right-0 max-h-[65vh] overflow-y-auto rounded-t-3xl bg-background shadow-xl"
      aria-label="Guest Entry Details"
    >
      <!-- Sheet grabber -->
      <div class="sheet-grabber" />

      <!-- Sheet content -->
      <div class="space-y-6 px-4 pb-8 pt-2">
        <!-- Name & badges -->
        <div class="space-y-2 text-center">
          <h1
            class="font-handwritten text-3xl text-foreground"
            tabindex="0"
            aria-label="Guest Name"
          >
            {{ entry.name }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ $t('entry.subtitle') }}
          </p>

          <!-- Quick badges -->
          <div
            v-if="quickBadges.length > 0"
            class="flex flex-wrap justify-center gap-2"
          >
            <span
              v-for="badge in quickBadges"
              :key="badge.text"
              class="answer-badge"
              :class="badge.class"
            >
              {{ badge.text }}
            </span>
          </div>
        </div>

        <!-- Main message -->
        <p class="whitespace-pre-wrap text-center text-sm leading-relaxed text-foreground">
          {{ entry.message }}
        </p>

        <!-- Action buttons (placeholder for future features) -->
        <div class="flex items-center gap-3">
          <Button class="flex-1" variant="default">
            <Heart class="mr-2 h-4 w-4" />
            {{ $t('entry.likeEntry') }}
          </Button>
          <Button class="flex-1" variant="outline">
            <MessageCircle class="mr-2 h-4 w-4" />
            {{ $t('entry.comment') }}
          </Button>
        </div>

        <hr class="border-border">

        <!-- Favoriten Section -->
        <div v-if="hasFavorites" class="section-card">
          <p class="section-title">{{ $t('entry.sections.favorites') }}</p>
          <ul class="space-y-1 text-sm text-foreground">
            <li v-if="entry.answers?.favoriteColor">
              <span class="font-semibold">{{ $t('entry.labels.color') }}</span> {{ entry.answers.favoriteColor }}
            </li>
            <li v-if="entry.answers?.favoriteFood">
              <span class="font-semibold">{{ $t('entry.labels.food') }}</span> {{ entry.answers.favoriteFood }}
            </li>
            <li v-if="entry.answers?.favoriteMovie">
              <span class="font-semibold">{{ $t('entry.labels.movie') }}</span> {{ entry.answers.favoriteMovie }}
            </li>
            <li v-if="entry.answers?.favoriteSong">
              <span class="font-semibold">{{ $t('entry.labels.song') }}</span>
              <a
                v-if="entry.answers.favoriteSong.url"
                :href="entry.answers.favoriteSong.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline"
              >
                "{{ entry.answers.favoriteSong.title }}"
                <span v-if="entry.answers.favoriteSong.artist"> – {{ entry.answers.favoriteSong.artist }}</span>
              </a>
              <span v-else>
                "{{ entry.answers.favoriteSong.title }}"
                <span v-if="entry.answers.favoriteSong.artist"> – {{ entry.answers.favoriteSong.artist }}</span>
              </span>
            </li>
            <li v-if="entry.answers?.favoriteVideo">
              <span class="font-semibold">{{ $t('entry.labels.video') }}</span>
              <a
                v-if="entry.answers.favoriteVideo.url"
                :href="entry.answers.favoriteVideo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-primary underline"
              >
                {{ entry.answers.favoriteVideo.title }}
                <ExternalLink class="h-3 w-3" />
              </a>
              <span v-else>{{ entry.answers.favoriteVideo.title }}</span>
            </li>
          </ul>

          <!-- Spotify Embed -->
          <div v-if="spotifyEmbed" class="mt-3">
            <iframe
              :src="spotifyEmbed"
              width="100%"
              height="80"
              frameborder="0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              loading="lazy"
              class="rounded-xl"
            />
          </div>

          <!-- YouTube Embed -->
          <div v-if="youtubeEmbed" class="mt-3">
            <iframe
              :src="youtubeEmbed"
              width="100%"
              height="180"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy"
              class="rounded-xl"
            />
          </div>
        </div>

        <!-- Fun Facts Section -->
        <div v-if="hasFunFacts" class="section-card">
          <p class="section-title">{{ $t('entry.sections.funFacts') }}</p>
          <ul class="space-y-1 text-sm text-foreground">
            <li v-if="entry.answers?.superpower">
              <span class="font-semibold">{{ $t('entry.labels.superpower') }}</span> {{ entry.answers.superpower }}
            </li>
            <li v-if="entry.answers?.hiddenTalent">
              <span class="font-semibold">{{ $t('entry.labels.hiddenTalent') }}</span> {{ entry.answers.hiddenTalent }}
            </li>
            <li v-if="entry.answers?.desertIslandItems">
              <span class="font-semibold">{{ $t('entry.labels.desertIsland') }}</span> {{ entry.answers.desertIslandItems }}
            </li>
          </ul>

          <!-- Toggle Badges -->
          <div v-if="toggleBadges.length > 0" class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="badge in toggleBadges"
              :key="badge.text"
              class="answer-badge"
              :class="badge.class"
            >
              {{ badge.text }}
            </span>
          </div>
        </div>

        <!-- Our Story Section -->
        <div v-if="hasOurStory" class="section-card">
          <p class="section-title">{{ $t('entry.sections.ourStory') }}</p>
          <ul class="space-y-2 text-sm text-foreground">
            <li v-if="entry.answers?.howWeMet">
              <span class="font-semibold">{{ $t('entry.labels.howWeMet') }}</span>
              <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.howWeMet }}</p>
            </li>
            <li v-if="entry.answers?.bestMemory">
              <span class="font-semibold">{{ $t('entry.labels.bestMemory') }}</span>
              <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.bestMemory }}</p>
            </li>
          </ul>
        </div>

        <!-- Date Section -->
        <div class="section-card">
          <p class="section-title">{{ $t('entry.sections.date') }}</p>
          <p class="text-sm text-foreground">{{ formatDate(entry.createdAt) }}</p>
        </div>

        <!-- Bottom spacer -->
        <div class="h-8" />
      </div>
    </section>
  </div>
</template>
