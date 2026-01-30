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

/**
 * Formats an ISO date string to a short human-readable format.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

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
  if (a.coffeeOrTea) badges.push({ text: a.coffeeOrTea === 'coffee' ? '☕ Coffee' : '🍵 Tea', class: '' })
  if (a.nightOwlOrEarlyBird) badges.push({ text: a.nightOwlOrEarlyBird === 'night_owl' ? '🦉 Night Owl' : '🐦 Early Bird', class: 'badge-blue' })
  if (a.beachOrMountains) badges.push({ text: a.beachOrMountains === 'beach' ? '🏖️ Beach' : '⛰️ Mountains', class: 'badge-orange' })

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
        :key="badge.text"
        class="answer-badge"
        :class="badge.class"
      >
        {{ badge.text }}
      </span>
    </div>
    <p class="mt-2 text-xs text-muted-foreground/70">
      {{ formatDate(entry.createdAt) }}
    </p>
  </button>
</template>
