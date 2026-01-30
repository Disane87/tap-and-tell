<script setup lang="ts">
/**
 * Full-viewport guest entry display for the swipeable guestbook.
 *
 * Renders the entry directly on the gradient background (no card wrapper),
 * matching the Freundebuch screenshot aesthetic: centered photo,
 * handwritten name, scrollable details.
 *
 * @props entry - The guest entry to display.
 */
import { ExternalLink } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'

defineProps<{
  entry: GuestEntry
}>()

/** Formats an ISO date string for display. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="entry-fullscreen">
    <div class="entry-fullscreen-inner">
      <!-- Name -->
      <h2 class="font-handwritten text-4xl text-foreground">
        {{ entry.name }}
      </h2>

      <!-- Photo -->
      <img
        v-if="entry.photoUrl"
        :src="entry.photoUrl"
        :alt="`Photo by ${entry.name}`"
        class="entry-photo"
      >

      <!-- Date -->
      <p class="text-sm text-muted-foreground">
        {{ formatDate(entry.createdAt) }}
      </p>

      <!-- Message -->
      <p class="w-full whitespace-pre-wrap text-center text-foreground">
        {{ entry.message }}
      </p>

      <!-- Favorites -->
      <div
        v-if="entry.answers && (entry.answers.favoriteColor || entry.answers.favoriteFood || entry.answers.favoriteMovie || entry.answers.favoriteSong || entry.answers.favoriteVideo)"
        class="w-full space-y-2 text-center"
      >
        <h4 class="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Favorites
        </h4>
        <p v-if="entry.answers.favoriteColor" class="text-sm">
          <span class="text-muted-foreground">Color:</span> {{ entry.answers.favoriteColor }}
        </p>
        <p v-if="entry.answers.favoriteFood" class="text-sm">
          <span class="text-muted-foreground">Food:</span> {{ entry.answers.favoriteFood }}
        </p>
        <p v-if="entry.answers.favoriteMovie" class="text-sm">
          <span class="text-muted-foreground">Movie:</span> {{ entry.answers.favoriteMovie }}
        </p>
        <div
          v-if="entry.answers.favoriteSong"
          class="mx-auto max-w-xs rounded-lg border border-border/60 p-3"
        >
          <p class="text-sm font-medium">🎵 {{ entry.answers.favoriteSong.title }}</p>
          <p v-if="entry.answers.favoriteSong.artist" class="text-xs text-muted-foreground">
            by {{ entry.answers.favoriteSong.artist }}
          </p>
          <a
            v-if="entry.answers.favoriteSong.url"
            :href="entry.answers.favoriteSong.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Listen <ExternalLink class="h-3 w-3" />
          </a>
        </div>
        <div
          v-if="entry.answers.favoriteVideo"
          class="mx-auto max-w-xs rounded-lg border border-border/60 p-3"
        >
          <p class="text-sm font-medium">🎬 {{ entry.answers.favoriteVideo.title }}</p>
          <a
            v-if="entry.answers.favoriteVideo.url"
            :href="entry.answers.favoriteVideo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Watch <ExternalLink class="h-3 w-3" />
          </a>
        </div>
      </div>

      <!-- Fun Facts -->
      <div
        v-if="entry.answers && (entry.answers.superpower || entry.answers.hiddenTalent || entry.answers.desertIslandItems || entry.answers.coffeeOrTea || entry.answers.nightOwlOrEarlyBird || entry.answers.beachOrMountains)"
        class="w-full space-y-2 text-center"
      >
        <h4 class="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fun Facts
        </h4>
        <p v-if="entry.answers.superpower" class="text-sm">
          <span class="text-muted-foreground">Superpower:</span> {{ entry.answers.superpower }}
        </p>
        <p v-if="entry.answers.hiddenTalent" class="text-sm">
          <span class="text-muted-foreground">Hidden Talent:</span> {{ entry.answers.hiddenTalent }}
        </p>
        <p v-if="entry.answers.desertIslandItems" class="text-sm">
          <span class="text-muted-foreground">Desert Island Items:</span> {{ entry.answers.desertIslandItems }}
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <span v-if="entry.answers.coffeeOrTea" class="answer-badge">
            {{ entry.answers.coffeeOrTea === 'coffee' ? 'Coffee' : 'Tea' }}
          </span>
          <span v-if="entry.answers.nightOwlOrEarlyBird" class="answer-badge">
            {{ entry.answers.nightOwlOrEarlyBird === 'night_owl' ? 'Night Owl' : 'Early Bird' }}
          </span>
          <span v-if="entry.answers.beachOrMountains" class="answer-badge">
            {{ entry.answers.beachOrMountains === 'beach' ? 'Beach' : 'Mountains' }}
          </span>
        </div>
      </div>

      <!-- Our Story -->
      <div
        v-if="entry.answers && (entry.answers.bestMemory || entry.answers.howWeMet)"
        class="w-full space-y-2 text-center"
      >
        <h4 class="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Our Story
        </h4>
        <div v-if="entry.answers.howWeMet" class="text-sm">
          <span class="text-muted-foreground">How We Met:</span>
          <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.howWeMet }}</p>
        </div>
        <div v-if="entry.answers.bestMemory" class="text-sm">
          <span class="text-muted-foreground">Best Memory:</span>
          <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.bestMemory }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
