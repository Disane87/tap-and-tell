<script setup lang="ts">
/**
 * Guestbook page — swipeable single-entry viewer.
 *
 * Displays entries one at a time with swipe (mobile) and arrow key/button
 * navigation (desktop). No header — chromeless design.
 *
 * This page can be navigated to directly or from the landing page.
 */
import { useSwipe } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { GuestEntry } from '~/types/guest'

const { entries, isLoading, fetchEntries } = useGuests()

const currentIndex = ref(0)
const slideDirection = ref<'forward' | 'backward'>('forward')
const swiperEl = ref<HTMLElement | null>(null)

const selectedEntry = ref<GuestEntry | null>(null)
const sheetOpen = ref(false)

const hasEntries = computed(() => entries.value.length > 0)
const currentEntry = computed(() => entries.value[currentIndex.value] ?? null)

const transitionName = computed(() =>
  slideDirection.value === 'forward' ? 'slide-left' : 'slide-right'
)

function nextEntry(): void {
  if (currentIndex.value < entries.value.length - 1) {
    slideDirection.value = 'forward'
    currentIndex.value++
  }
}

function prevEntry(): void {
  if (currentIndex.value > 0) {
    slideDirection.value = 'backward'
    currentIndex.value--
  }
}

useSwipe(swiperEl, {
  onSwipeEnd(_e, direction) {
    if (direction === 'left') nextEntry()
    if (direction === 'right') prevEntry()
  }
})

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowRight') nextEntry()
  if (e.key === 'ArrowLeft') prevEntry()
}

onMounted(() => {
  fetchEntries()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    ref="swiperEl"
    class="relative min-h-screen overflow-hidden"
    style="touch-action: pan-y;"
  >
    <!-- Loading -->
    <div
      v-if="isLoading && !hasEntries"
      class="landing-gradient flex min-h-screen items-center justify-center"
    >
      <p class="animate-gentle-pulse text-muted-foreground">Loading entries...</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!hasEntries"
      class="landing-gradient flex min-h-screen flex-col items-center justify-center gap-4 px-6"
    >
      <p class="text-center text-muted-foreground">No entries yet.</p>
      <NuxtLink to="/">
        <Button>Leave the first entry</Button>
      </NuxtLink>
    </div>

    <!-- Entry viewer -->
    <template v-else>
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentIndex" class="min-h-screen">
          <GuestEntryFullView v-if="currentEntry" :entry="currentEntry" />
        </div>
      </Transition>

      <!-- Navigation arrows (desktop) -->
      <button
        v-if="currentIndex > 0"
        class="nav-arrow nav-arrow-left hidden md:flex"
        aria-label="Previous entry"
        @click="prevEntry"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <button
        v-if="currentIndex < entries.length - 1"
        class="nav-arrow nav-arrow-right hidden md:flex"
        aria-label="Next entry"
        @click="nextEntry"
      >
        <ChevronRight class="h-5 w-5" />
      </button>

      <!-- Entry counter -->
      <div class="fixed right-4 top-4 z-20 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        {{ currentIndex + 1 }} / {{ entries.length }}
      </div>

      <!-- Pagination dots -->
      <div
        v-if="entries.length > 1"
        class="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5"
      >
        <button
          v-for="(_, i) in entries"
          :key="i"
          class="pagination-dot"
          :class="{ active: currentIndex === i }"
          :aria-label="`Go to entry ${i + 1}`"
          @click="slideDirection = i > currentIndex ? 'forward' : 'backward'; currentIndex = i"
        />
      </div>
    </template>

    <!-- Detail sheet (optional, for tapping on entry for more details) -->
    <EntrySheet
      :entry="selectedEntry"
      :open="sheetOpen"
      @update:open="sheetOpen = $event"
    />
  </div>
</template>
