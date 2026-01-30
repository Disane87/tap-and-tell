<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { entries, isLoading, error, fetchEntries } = useGuests()

const currentIndex = ref(0)
const direction = ref<'left' | 'right'>('left')
const swipeTarget = ref<HTMLElement | null>(null)

/** Computed transition name based on navigation direction. */
const transitionName = computed(() =>
  direction.value === 'left' ? 'slide-entry-left' : 'slide-entry-right'
)

/** The currently displayed entry, or null if no entries exist. */
const currentEntry = computed(() =>
  entries.value.length > 0 ? entries.value[currentIndex.value] : null
)

/**
 * Navigate to the next entry in the guestbook.
 * Sets direction to 'left' for the slide-out animation.
 */
function nextEntry() {
  if (currentIndex.value < entries.value.length - 1) {
    direction.value = 'left'
    currentIndex.value++
  }
}

/**
 * Navigate to the previous entry in the guestbook.
 * Sets direction to 'right' for the slide-out animation.
 */
function prevEntry() {
  if (currentIndex.value > 0) {
    direction.value = 'right'
    currentIndex.value--
  }
}

/** Handle keyboard arrow key navigation. */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextEntry()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevEntry()
  }
}

// Swipe detection via VueUse
useSwipe(swipeTarget, {
  onSwipeEnd(_e, swipeDirection) {
    if (swipeDirection === 'left') nextEntry()
    if (swipeDirection === 'right') prevEntry()
  }
})

onMounted(() => {
  fetchEntries()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Clamp currentIndex if entries change
watch(() => entries.value.length, (len) => {
  if (currentIndex.value >= len && len > 0) {
    currentIndex.value = len - 1
  }
})
</script>

<template>
  <div class="guestbook-viewer">
    <!-- Minimal top bar with counter -->
    <div class="flex items-center justify-center px-4 py-3">
      <p v-if="entries.length > 0" class="text-xs text-muted-foreground">
        {{ currentIndex + 1 }} / {{ entries.length }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-1 items-center justify-center px-4">
      <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p class="text-destructive">{{ error }}</p>
        <Button variant="outline" class="mt-4" @click="fetchEntries">
          Try Again
        </Button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.length === 0" class="flex flex-1 items-center justify-center px-4">
      <div class="text-center">
        <p class="text-lg text-muted-foreground">No messages yet.</p>
        <p class="mt-1 text-sm text-muted-foreground">Be the first to leave one!</p>
      </div>
    </div>

    <!-- Swipeable entry viewport -->
    <template v-else>
      <div ref="swipeTarget" class="entry-viewport">
        <Transition :name="transitionName" mode="out-in">
          <GuestEntryFullView
            v-if="currentEntry"
            :key="currentEntry.id"
            :entry="currentEntry"
          />
        </Transition>

        <!-- Desktop navigation arrows -->
        <button
          v-if="entries.length > 1 && currentIndex > 0"
          class="nav-arrow nav-arrow-left rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card"
          aria-label="Previous entry"
          @click="prevEntry"
        >
          <ChevronLeft class="h-6 w-6 text-foreground" />
        </button>
        <button
          v-if="entries.length > 1 && currentIndex < entries.length - 1"
          class="nav-arrow nav-arrow-right rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card"
          aria-label="Next entry"
          @click="nextEntry"
        >
          <ChevronRight class="h-6 w-6 text-foreground" />
        </button>
      </div>

      <!-- Mobile pagination dots (capped at 10 to avoid overflow) -->
      <div v-if="entries.length > 1 && entries.length <= 10" class="flex justify-center gap-1.5 py-3 md:hidden">
        <div
          v-for="(_, i) in entries"
          :key="i"
          class="h-1.5 rounded-full transition-all duration-200"
          :class="i === currentIndex
            ? 'w-6 bg-primary'
            : 'w-1.5 bg-muted-foreground/30'"
        />
      </div>
      <!-- Text counter for many entries on mobile -->
      <div v-else-if="entries.length > 10" class="py-3 text-center text-xs text-muted-foreground md:hidden">
        {{ currentIndex + 1 }} / {{ entries.length }}
      </div>
    </template>
  </div>
</template>
