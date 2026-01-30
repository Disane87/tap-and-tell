<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'

interface Props {
  entry: GuestEntry
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', entry: GuestEntry): void
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/** Builds up to 3 preview badges from the entry's answers. */
function getAnswerBadges(entry: GuestEntry): { icon: string; text: string }[] {
  const badges: { icon: string; text: string }[] = []
  const a = entry.answers
  if (!a) return badges

  if (a.coffeeOrTea) badges.push({ icon: a.coffeeOrTea === 'coffee' ? '☕' : '🍵', text: a.coffeeOrTea === 'coffee' ? 'Coffee' : 'Tea' })
  if (a.beachOrMountains) badges.push({ icon: a.beachOrMountains === 'beach' ? '🏖️' : '🏔️', text: a.beachOrMountains === 'beach' ? 'Beach' : 'Mountains' })
  if (a.nightOwlOrEarlyBird) badges.push({ icon: a.nightOwlOrEarlyBird === 'night_owl' ? '🌙' : '🌅', text: a.nightOwlOrEarlyBird === 'night_owl' ? 'Night Owl' : 'Early Bird' })
  if (a.favoriteSong) badges.push({ icon: '🎵', text: a.favoriteSong.title })
  if (a.favoriteColor) badges.push({ icon: '🎨', text: a.favoriteColor })
  if (a.superpower) badges.push({ icon: '⚡', text: a.superpower })

  return badges.slice(0, 3)
}
</script>

<template>
  <div
    class="card-polaroid cursor-pointer overflow-hidden border border-border/40"
    @click="emit('click', entry)"
  >
    <div v-if="entry.photoUrl" class="photo-frame aspect-video w-full overflow-hidden">
      <img
        :src="entry.photoUrl"
        :alt="`Photo by ${entry.name}`"
        class="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-105"
        loading="lazy"
      >
    </div>
    <div class="p-4 pb-3">
      <div class="flex items-center justify-between">
        <h3 class="font-handwritten text-xl font-semibold text-foreground">{{ entry.name }}</h3>
        <time class="text-xs text-muted-foreground">
          {{ formatDate(entry.createdAt) }}
        </time>
      </div>
      <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {{ entry.message }}
      </p>

      <!-- Answer badges -->
      <div v-if="getAnswerBadges(entry).length" class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="badge in getAnswerBadges(entry)"
          :key="badge.text"
          class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          <span>{{ badge.icon }}</span>
          <span class="max-w-[100px] truncate">{{ badge.text }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
