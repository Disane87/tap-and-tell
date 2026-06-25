<script setup lang="ts">
/**
 * Swipeable media gallery for a guest entry.
 *
 * Renders an entry's images and videos as a horizontally swipeable, scroll-snap
 * carousel with a position counter and dot navigation. Videos use native
 * `<video controls>`. Falls back to a single image when only the legacy
 * `fallbackUrl` (photoUrl) is available, and to a name-initial gradient
 * placeholder when there is no media at all.
 *
 * The gallery fills its container (`h-full w-full`); the parent controls the
 * frame size/aspect ratio.
 *
 * @props media - The entry's media items in display order.
 * @props fallbackUrl - Legacy single photo URL (used when `media` is empty).
 * @props name - Guest name, for the placeholder initial and image alt text.
 * @props controls - Whether videos show native controls (default true).
 */
import type { EntryMedia } from '~/types/guest'

const props = withDefaults(defineProps<{
  media?: EntryMedia[]
  fallbackUrl?: string
  name: string
  controls?: boolean
}>(), {
  controls: true
})

/** Resolved media list, falling back to the legacy single photo URL. */
const items = computed<EntryMedia[]>(() => {
  if (props.media && props.media.length > 0) return props.media
  if (props.fallbackUrl) return [{ type: 'image', url: props.fallbackUrl, mime: '' }]
  return []
})

const activeIndex = ref(0)
const scroller = ref<HTMLElement | null>(null)

/** Tracks the active slide based on horizontal scroll position. */
function onScroll(): void {
  const el = scroller.value
  if (!el || el.clientWidth === 0) return
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  activeIndex.value = Math.max(0, Math.min(items.value.length - 1, idx))
}

/** Smoothly scrolls to the slide at the given index. */
function goTo(index: number): void {
  const el = scroller.value
  if (!el) return
  el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-muted">
    <!-- Empty placeholder -->
    <div
      v-if="items.length === 0"
      class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70"
    >
      <span class="font-handwritten text-6xl text-[#0E0E12]/70">{{ name.charAt(0) }}</span>
    </div>

    <template v-else>
      <div
        ref="scroller"
        class="media-scroller flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        @scroll="onScroll"
      >
        <div
          v-for="(item, i) in items"
          :key="i"
          class="h-full w-full shrink-0 snap-center"
        >
          <video
            v-if="item.type === 'video'"
            :src="item.url"
            class="h-full w-full bg-black object-contain"
            :controls="controls"
            playsinline
            preload="metadata"
          />
          <img
            v-else
            :src="item.url"
            :alt="$t('entry.photoBy', { name })"
            class="h-full w-full object-cover"
          >
        </div>
      </div>

      <!-- Position counter -->
      <div
        v-if="items.length > 1"
        class="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white"
      >
        {{ activeIndex + 1 }} / {{ items.length }}
      </div>

      <!-- Dot navigation -->
      <div
        v-if="items.length > 1"
        class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
      >
        <button
          v-for="(_, i) in items"
          :key="i"
          type="button"
          class="h-2 w-2 rounded-full transition-colors"
          :class="i === activeIndex ? 'bg-white' : 'bg-white/50'"
          :aria-label="$t('media.goToItem', { index: i + 1 })"
          @click="goTo(i)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Hide the scrollbar while keeping horizontal swipe/scroll behaviour. */
.media-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.media-scroller::-webkit-scrollbar {
  display: none;
}
</style>
