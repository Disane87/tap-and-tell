<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface Props {
  entry: GuestEntry | null
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const toggleLabels: Record<string, { icon: string; label: string }> = {
  coffee: { icon: '☕', label: 'Coffee' },
  tea: { icon: '🍵', label: 'Tea' },
  night_owl: { icon: '🌙', label: 'Night Owl' },
  early_bird: { icon: '🌅', label: 'Early Bird' },
  beach: { icon: '🏖️', label: 'Beach' },
  mountains: { icon: '🏔️', label: 'Mountains' },
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="max-h-[85vh] overflow-y-auto">
      <template v-if="entry">
        <div v-if="entry.photoUrl" class="photo-frame mb-4 overflow-hidden">
          <img
            :src="entry.photoUrl"
            :alt="`Photo by ${entry.name}`"
            class="w-full object-cover"
          >
        </div>

        <SheetHeader class="text-left">
          <SheetTitle class="font-handwritten text-2xl">{{ entry.name }}</SheetTitle>
          <SheetDescription>
            {{ formatDate(entry.createdAt) }}
          </SheetDescription>
        </SheetHeader>

        <div class="mt-4">
          <p class="whitespace-pre-wrap leading-relaxed text-foreground">{{ entry.message }}</p>
        </div>

        <!-- Answers sections -->
        <template v-if="entry.answers">
          <!-- Favorites -->
          <div
            v-if="entry.answers.favoriteColor || entry.answers.favoriteFood || entry.answers.favoriteMovie || entry.answers.favoriteSong || entry.answers.favoriteVideo"
            class="mt-6"
          >
            <h4 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Favorites</h4>
            <div class="space-y-2">
              <div v-if="entry.answers.favoriteColor" class="flex items-center gap-2 text-sm">
                <span>🎨</span>
                <span class="text-muted-foreground">Color:</span>
                <span class="text-foreground">{{ entry.answers.favoriteColor }}</span>
              </div>
              <div v-if="entry.answers.favoriteFood" class="flex items-center gap-2 text-sm">
                <span>🍽️</span>
                <span class="text-muted-foreground">Food:</span>
                <span class="text-foreground">{{ entry.answers.favoriteFood }}</span>
              </div>
              <div v-if="entry.answers.favoriteMovie" class="flex items-center gap-2 text-sm">
                <span>🎬</span>
                <span class="text-muted-foreground">Movie:</span>
                <span class="text-foreground">{{ entry.answers.favoriteMovie }}</span>
              </div>

              <!-- Song mini-card -->
              <div v-if="entry.answers.favoriteSong" class="rounded-lg border border-border/40 p-3">
                <div class="flex items-center gap-2 text-sm">
                  <span>🎵</span>
                  <span class="font-medium text-foreground">{{ entry.answers.favoriteSong.title }}</span>
                  <span v-if="entry.answers.favoriteSong.artist" class="text-muted-foreground">
                    by {{ entry.answers.favoriteSong.artist }}
                  </span>
                </div>
                <a
                  v-if="entry.answers.favoriteSong.url"
                  :href="entry.answers.favoriteSong.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Listen &rarr;
                </a>
              </div>

              <!-- Video mini-card -->
              <div v-if="entry.answers.favoriteVideo" class="rounded-lg border border-border/40 p-3">
                <div class="flex items-center gap-2 text-sm">
                  <span>🎥</span>
                  <span class="font-medium text-foreground">{{ entry.answers.favoriteVideo.title }}</span>
                </div>
                <a
                  v-if="entry.answers.favoriteVideo.url"
                  :href="entry.answers.favoriteVideo.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Watch &rarr;
                </a>
              </div>
            </div>
          </div>

          <!-- Fun Facts -->
          <div
            v-if="entry.answers.superpower || entry.answers.hiddenTalent || entry.answers.desertIslandItems || entry.answers.coffeeOrTea || entry.answers.nightOwlOrEarlyBird || entry.answers.beachOrMountains"
            class="mt-6"
          >
            <h4 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fun Facts</h4>
            <div class="space-y-2">
              <div v-if="entry.answers.superpower" class="flex items-center gap-2 text-sm">
                <span>⚡</span>
                <span class="text-muted-foreground">Superpower:</span>
                <span class="text-foreground">{{ entry.answers.superpower }}</span>
              </div>
              <div v-if="entry.answers.hiddenTalent" class="flex items-center gap-2 text-sm">
                <span>🎯</span>
                <span class="text-muted-foreground">Hidden talent:</span>
                <span class="text-foreground">{{ entry.answers.hiddenTalent }}</span>
              </div>
              <div v-if="entry.answers.desertIslandItems" class="flex items-center gap-2 text-sm">
                <span>🏝️</span>
                <span class="text-muted-foreground">Desert island:</span>
                <span class="text-foreground">{{ entry.answers.desertIslandItems }}</span>
              </div>

              <!-- Toggle answers -->
              <div v-if="entry.answers.coffeeOrTea || entry.answers.nightOwlOrEarlyBird || entry.answers.beachOrMountains" class="flex flex-wrap gap-2 pt-1">
                <span
                  v-if="entry.answers.coffeeOrTea"
                  class="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                >
                  {{ toggleLabels[entry.answers.coffeeOrTea].icon }}
                  {{ toggleLabels[entry.answers.coffeeOrTea].label }}
                </span>
                <span
                  v-if="entry.answers.nightOwlOrEarlyBird"
                  class="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                >
                  {{ toggleLabels[entry.answers.nightOwlOrEarlyBird].icon }}
                  {{ toggleLabels[entry.answers.nightOwlOrEarlyBird].label }}
                </span>
                <span
                  v-if="entry.answers.beachOrMountains"
                  class="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                >
                  {{ toggleLabels[entry.answers.beachOrMountains].icon }}
                  {{ toggleLabels[entry.answers.beachOrMountains].label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Our Story -->
          <div
            v-if="entry.answers.bestMemory || entry.answers.howWeMet"
            class="mt-6"
          >
            <h4 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Our Story</h4>
            <div class="space-y-3">
              <div v-if="entry.answers.howWeMet">
                <p class="mb-1 text-xs font-medium text-muted-foreground">How we met</p>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{{ entry.answers.howWeMet }}</p>
              </div>
              <div v-if="entry.answers.bestMemory">
                <p class="mb-1 text-xs font-medium text-muted-foreground">Best memory</p>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{{ entry.answers.bestMemory }}</p>
              </div>
            </div>
          </div>
        </template>
      </template>
    </SheetContent>
  </Sheet>
</template>
