<script setup lang="ts">
/**
 * Bottom sheet displaying a full guest entry with all Freundebuch answers.
 *
 * Used on the guestbook grid page when clicking a card.
 * For full-screen entry view, use GuestEntryFullView instead.
 *
 * @props entry - The guest entry to display (null hides the sheet).
 * @props open - Whether the sheet is visible.
 * @emits update:open - Toggle sheet visibility.
 */
import { ExternalLink } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'

const { locale } = useI18n()

defineProps<{
  entry: GuestEntry | null
  open: boolean
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()

/**
 * Formats an ISO date string to a full human-readable format.
 */
function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="max-h-[85vh] overflow-y-auto">
      <SheetHeader v-if="entry">
        <SheetTitle class="font-handwritten text-3xl">
          {{ entry.name }}
        </SheetTitle>
        <SheetDescription>
          {{ formatFullDate(entry.createdAt) }}
        </SheetDescription>
      </SheetHeader>

      <div v-if="entry" class="mt-4 space-y-6 pb-6">
        <!-- Photo -->
        <div v-if="entry.photoUrl" class="flex justify-center">
          <img
            :src="entry.photoUrl"
            :alt="$t('entry.photoBy', { name: entry.name })"
            class="photo-frame max-h-64 rounded-xl object-cover"
          >
        </div>

        <!-- Message -->
        <div>
          <p class="whitespace-pre-wrap text-foreground">{{ entry.message }}</p>
        </div>

        <!-- Favorites Section -->
        <div v-if="entry.answers && (entry.answers.favoriteColor || entry.answers.favoriteFood || entry.answers.favoriteMovie || entry.answers.favoriteSong || entry.answers.favoriteVideo)">
          <h4 class="section-title">
            {{ $t('entry.sections.favorites') }}
          </h4>
          <div class="space-y-2">
            <div v-if="entry.answers.favoriteColor" class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.color') }}</span>
              <span>{{ entry.answers.favoriteColor }}</span>
            </div>
            <div v-if="entry.answers.favoriteFood" class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.food') }}</span>
              <span>{{ entry.answers.favoriteFood }}</span>
            </div>
            <div v-if="entry.answers.favoriteMovie" class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.movie') }}</span>
              <span>{{ entry.answers.favoriteMovie }}</span>
            </div>
            <div
              v-if="entry.answers.favoriteSong"
              class="rounded-lg border border-border/60 p-3"
            >
              <p class="text-sm font-medium">
                🎵 {{ entry.answers.favoriteSong.title }}
              </p>
              <p v-if="entry.answers.favoriteSong.artist" class="text-xs text-muted-foreground">
                {{ $t('entry.labels.by') }} {{ entry.answers.favoriteSong.artist }}
              </p>
              <a
                v-if="entry.answers.favoriteSong.url"
                :href="entry.answers.favoriteSong.url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {{ $t('entry.actions.listen') }} <ExternalLink class="h-3 w-3" />
              </a>
            </div>
            <div
              v-if="entry.answers.favoriteVideo"
              class="rounded-lg border border-border/60 p-3"
            >
              <p class="text-sm font-medium">
                🎬 {{ entry.answers.favoriteVideo.title }}
              </p>
              <a
                v-if="entry.answers.favoriteVideo.url"
                :href="entry.answers.favoriteVideo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {{ $t('entry.actions.watch') }} <ExternalLink class="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <!-- Fun Facts Section -->
        <div v-if="entry.answers && (entry.answers.superpower || entry.answers.hiddenTalent || entry.answers.desertIslandItems || entry.answers.coffeeOrTea || entry.answers.nightOwlOrEarlyBird || entry.answers.beachOrMountains)">
          <h4 class="section-title">
            {{ $t('entry.sections.funFacts') }}
          </h4>
          <div class="space-y-2">
            <div v-if="entry.answers.superpower" class="text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.superpower') }}</span>
              {{ entry.answers.superpower }}
            </div>
            <div v-if="entry.answers.hiddenTalent" class="text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.hiddenTalent') }}</span>
              {{ entry.answers.hiddenTalent }}
            </div>
            <div v-if="entry.answers.desertIslandItems" class="text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.desertIsland') }}</span>
              {{ entry.answers.desertIslandItems }}
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="entry.answers.coffeeOrTea" class="answer-badge">
                {{ entry.answers.coffeeOrTea === 'coffee' ? `☕ ${$t('entry.badges.coffee')}` : `🍵 ${$t('entry.badges.tea')}` }}
              </span>
              <span v-if="entry.answers.nightOwlOrEarlyBird" class="answer-badge">
                {{ entry.answers.nightOwlOrEarlyBird === 'night_owl' ? `🦉 ${$t('entry.badges.nightOwl')}` : `🐦 ${$t('entry.badges.earlyBird')}` }}
              </span>
              <span v-if="entry.answers.beachOrMountains" class="answer-badge">
                {{ entry.answers.beachOrMountains === 'beach' ? `🏖️ ${$t('entry.badges.beach')}` : `⛰️ ${$t('entry.badges.mountains')}` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Our Story Section -->
        <div v-if="entry.answers && (entry.answers.bestMemory || entry.answers.howWeMet)">
          <h4 class="section-title">
            {{ $t('entry.sections.ourStory') }}
          </h4>
          <div class="space-y-2">
            <div v-if="entry.answers.howWeMet" class="text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.howWeMet') }}</span>
              <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.howWeMet }}</p>
            </div>
            <div v-if="entry.answers.bestMemory" class="text-sm">
              <span class="text-muted-foreground">{{ $t('entry.labels.bestMemory') }}</span>
              <p class="mt-0.5 whitespace-pre-wrap">{{ entry.answers.bestMemory }}</p>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
