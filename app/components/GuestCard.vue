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
import type { GuestEntry } from '~/types/guest'

const props = defineProps<{
  entry: GuestEntry
}>()

defineEmits<{
  click: []
}>()

/** Formats an ISO date string to a short human-readable format. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/** Generates up to 3 answer preview badges from entry answers. */
const answerBadges = computed(() => {
  const badges: string[] = []
  const a = props.entry.answers
  if (!a) return badges

  if (a.coffeeOrTea) badges.push(a.coffeeOrTea === 'coffee' ? '☕ Coffee' : '🍵 Tea')
  if (a.favoriteSong?.title) badges.push(`🎵 ${a.favoriteSong.title}`)
  if (a.favoriteColor) badges.push(`🎨 ${a.favoriteColor}`)
  if (a.superpower) badges.push(`⚡ ${a.superpower}`)
  if (a.nightOwlOrEarlyBird) badges.push(a.nightOwlOrEarlyBird === 'night_owl' ? '🦉 Night Owl' : '🐦 Early Bird')
  if (a.beachOrMountains) badges.push(a.beachOrMountains === 'beach' ? '🏖️ Beach' : '⛰️ Mountains')

  return badges.slice(0, 3)
})
</script>

<template>
  <button
    class="card-polaroid w-full cursor-pointer text-left"
    @click="$emit('click')"
  >
    <div v-if="entry.photoUrl" class="mb-3">
      <img
        :src="entry.photoUrl"
        :alt="`Photo by ${entry.name}`"
        class="photo-frame aspect-square w-full object-cover"
      >
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
        :key="badge"
        class="answer-badge"
      >
        {{ badge }}
      </span>
    </div>
    <p class="mt-2 text-xs text-muted-foreground/70">
      {{ formatDate(entry.createdAt) }}
    </p>
  </button>
</template>
