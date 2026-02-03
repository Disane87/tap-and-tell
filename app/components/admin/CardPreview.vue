<script setup lang="ts">
/**
 * Live preview of a guestbook entry card.
 *
 * Shows how entry cards will look with the current settings,
 * including a visual representation of the selected layout.
 *
 * @props settings - Current guestbook settings (reactive).
 */
import type { GuestbookSettings } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  settings: GuestbookSettings
}>()

/** CSS class for the card style. */
const cardClass = computed(() => {
  switch (props.settings.cardStyle) {
    case 'minimal': return 'card-minimal'
    case 'rounded': return 'card-rounded'
    case 'bordered': return 'card-bordered'
    default: return 'card-polaroid'
  }
})

/** Font class for body text. */
const bodyFontClass = computed(() => {
  switch (props.settings.bodyFont) {
    case 'handwritten': return 'font-handwritten'
    case 'display': return 'font-display'
    default: return 'font-sans'
  }
})

/** Current layout. */
const currentLayout = computed(() => props.settings.viewLayout || 'grid')

/** Mock entry for preview. */
const mockEntry = {
  name: 'Emma',
  message: t('settings.cardPreview.mockMessage'),
  photoUrl: null as string | null,
  createdAt: new Date().toISOString()
}

/** Sample answer badges. */
const badges = computed(() => [
  { text: '🎨 Mint', class: 'badge-emerald' },
  { text: '☕ Coffee', class: '' }
])
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <!-- Card Style Preview -->
    <div>
      <Label class="mb-2 text-sm font-medium">{{ t('settings.cardPreview.label') }}</Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-4">
        <div class="flex justify-center">
          <div
            class="w-full max-w-[180px]"
            :class="cardClass"
          >
            <!-- Mock photo -->
            <div class="photo-frame mb-2 aspect-square w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span class="font-handwritten text-3xl text-primary/50">{{ mockEntry.name.charAt(0) }}</span>
            </div>
            <h3 class="font-handwritten text-lg text-foreground">
              {{ mockEntry.name }}
            </h3>
            <p class="mt-1 line-clamp-2 text-[11px] text-muted-foreground" :class="bodyFontClass">
              {{ mockEntry.message }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="badge in badges"
                :key="badge.text"
                class="answer-badge text-[9px]"
                :class="badge.class"
              >
                {{ badge.text }}
              </span>
            </div>
            <p class="mt-1.5 text-[9px] text-muted-foreground/70">
              {{ t('settings.cardPreview.justNow') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout Preview -->
    <div>
      <Label class="mb-2 text-sm font-medium">
        {{ t('settings.cardPreview.layout') }}: {{ t(`settings.viewLayout.${currentLayout}`) }}
      </Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-4">
        <!-- Grid Layout -->
        <div v-if="currentLayout === 'grid'" class="grid grid-cols-3 gap-1.5">
          <div v-for="i in 6" :key="i" class="aspect-[3/4] rounded bg-primary/20" />
        </div>

        <!-- Masonry Layout -->
        <div v-else-if="currentLayout === 'masonry'" class="flex gap-1.5">
          <div class="flex flex-1 flex-col gap-1.5">
            <div class="h-12 rounded bg-primary/20" />
            <div class="h-8 rounded bg-primary/15" />
            <div class="h-10 rounded bg-primary/20" />
          </div>
          <div class="flex flex-1 flex-col gap-1.5">
            <div class="h-8 rounded bg-primary/15" />
            <div class="h-12 rounded bg-primary/20" />
            <div class="h-6 rounded bg-primary/15" />
          </div>
          <div class="flex flex-1 flex-col gap-1.5">
            <div class="h-10 rounded bg-primary/20" />
            <div class="h-6 rounded bg-primary/15" />
            <div class="h-10 rounded bg-primary/20" />
          </div>
        </div>

        <!-- List Layout -->
        <div v-else-if="currentLayout === 'list'" class="flex flex-col gap-1.5">
          <div v-for="i in 4" :key="i" class="flex items-center gap-2 rounded bg-primary/10 p-1.5">
            <div class="h-6 w-6 shrink-0 rounded bg-primary/30" />
            <div class="flex-1">
              <div class="h-2 w-12 rounded bg-primary/25" />
              <div class="mt-1 h-1.5 w-full rounded bg-primary/15" />
            </div>
          </div>
        </div>

        <!-- Timeline Layout -->
        <div v-else-if="currentLayout === 'timeline'" class="relative pl-4">
          <!-- Timeline line -->
          <div class="absolute left-1.5 top-0 bottom-0 w-0.5 bg-primary/20" />

          <!-- Date separator -->
          <div class="mb-2 flex items-center gap-2">
            <div class="relative z-10 h-2 w-2 rounded-full bg-primary/40" />
            <div class="h-1.5 w-16 rounded bg-primary/30" />
          </div>

          <!-- Entries -->
          <div class="space-y-1.5">
            <div v-for="i in 2" :key="i" class="flex items-start gap-2">
              <div class="relative z-10 mt-1 h-1.5 w-1.5 rounded-full bg-primary/30" />
              <div class="flex-1 rounded bg-primary/10 p-1.5">
                <div class="h-1.5 w-10 rounded bg-primary/25" />
                <div class="mt-1 h-1 w-full rounded bg-primary/15" />
              </div>
            </div>
          </div>

          <!-- Another date -->
          <div class="mt-2 mb-2 flex items-center gap-2">
            <div class="relative z-10 h-2 w-2 rounded-full bg-primary/40" />
            <div class="h-1.5 w-12 rounded bg-primary/30" />
          </div>

          <div class="flex items-start gap-2">
            <div class="relative z-10 mt-1 h-1.5 w-1.5 rounded-full bg-primary/30" />
            <div class="flex-1 rounded bg-primary/10 p-1.5">
              <div class="h-1.5 w-8 rounded bg-primary/25" />
              <div class="mt-1 h-1 w-3/4 rounded bg-primary/15" />
            </div>
          </div>
        </div>

        <!-- Layout description -->
        <p class="mt-3 text-center text-[10px] text-muted-foreground">
          {{ t(`settings.viewLayout.${currentLayout}Desc`) }}
        </p>
      </div>
    </div>
  </div>
</template>
