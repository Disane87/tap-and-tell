<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { toast } from 'vue-sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { entries, fetchEntries, createEntry } = useGuests()
const {
  validate,
  reset,
  getSubmitData,
  setStatus,
  setError
} = useGuestForm()
const { nfcContext } = useNfc()

const formSheetOpen = ref(false)

// --- Swipe / slide state ---

/** Current slide index: 0 = intro, 1+ = entries */
const currentSlide = ref(0)
const direction = ref<'left' | 'right'>('left')
const swipeTarget = ref<HTMLElement | null>(null)

/** Total number of slides (intro + entries). */
const totalSlides = computed(() => 1 + entries.value.length)

/** Whether we're on the intro slide. */
const isIntro = computed(() => currentSlide.value === 0)

/** The currently displayed entry (null when on intro slide). */
const currentEntry = computed(() =>
  currentSlide.value > 0 ? entries.value[currentSlide.value - 1] : null
)

/** Computed transition name based on navigation direction. */
const transitionName = computed(() =>
  direction.value === 'left' ? 'slide-entry-left' : 'slide-entry-right'
)

/**
 * Navigate to the next slide.
 */
function nextSlide() {
  if (currentSlide.value < totalSlides.value - 1) {
    direction.value = 'left'
    currentSlide.value++
  }
}

/**
 * Navigate to the previous slide.
 */
function prevSlide() {
  if (currentSlide.value > 0) {
    direction.value = 'right'
    currentSlide.value--
  }
}

/** Handle keyboard arrow key navigation. */
function handleKeydown(e: KeyboardEvent) {
  if (formSheetOpen.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextSlide()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevSlide()
  }
}

// Swipe detection
useSwipe(swipeTarget, {
  onSwipeEnd(_e, swipeDirection) {
    if (formSheetOpen.value) return
    if (swipeDirection === 'left') nextSlide()
    if (swipeDirection === 'right') prevSlide()
  }
})

// --- Form logic ---

/**
 * Opens the form sheet for guest entry submission.
 */
function openFormSheet() {
  reset()
  formSheetOpen.value = true
}

/**
 * Handles guest entry form submission.
 * Closes sheet and stays on the landing page.
 */
async function handleSubmit() {
  if (!validate()) return

  setStatus('submitting')

  try {
    const entry = await createEntry(getSubmitData())

    if (entry) {
      setStatus('success')
      formSheetOpen.value = false
      reset()
      toast.success('Thank you for your message!')
      // Jump to the newly added entry (first in the list = slide 1)
      direction.value = 'left'
      currentSlide.value = 1
    } else {
      setError('Failed to submit your entry. Please try again.')
      toast.error('Failed to submit your entry')
    }
  } catch {
    setError('An unexpected error occurred')
    toast.error('An unexpected error occurred')
  }
}

// Clamp slide index if entries change
watch(() => entries.value.length, (len) => {
  if (currentSlide.value > len) {
    currentSlide.value = len
  }
})

onMounted(() => {
  fetchEntries()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="swipeTarget" class="landing-page">
    <!-- Slide viewport -->
    <div class="slide-viewport">
      <Transition :name="transitionName" mode="out-in">
        <!-- Intro slide -->
        <div v-if="isIntro" key="intro" class="slide-content">
          <div class="landing-content">
            <h1 class="landing-title">
              <span class="font-handwritten text-5xl text-primary sm:text-6xl">Marc's</span>
              <br>
              <span class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Freundebuch
              </span>
            </h1>

            <p class="mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
              <template v-if="nfcContext.isNfcEntry">
                You've tapped in! Leave a photo and a personal message — we'd love to remember this moment.
              </template>
              <template v-else>
                Leave your mark in our guestbook. Share a photo, your favorites, and a personal message.
              </template>
            </p>

            <div class="mt-8 w-full max-w-xs">
              <Button
                size="lg"
                class="w-full text-base"
                @click="openFormSheet"
              >
                Reinschreiben
              </Button>
            </div>

            <!-- Hint to swipe if entries exist -->
            <p v-if="entries.length > 0" class="mt-6 text-xs text-muted-foreground/60">
              Swipe to see {{ entries.length }} {{ entries.length === 1 ? 'entry' : 'entries' }}
            </p>
          </div>
        </div>

        <!-- Entry slide -->
        <GuestEntryFullView
          v-else-if="currentEntry"
          :key="currentEntry.id"
          :entry="currentEntry"
        />
      </Transition>
    </div>

    <!-- Navigation arrows (desktop) -->
    <button
      v-if="currentSlide > 0"
      class="nav-arrow nav-arrow-left rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card"
      aria-label="Previous"
      @click="prevSlide"
    >
      <ChevronLeft class="h-6 w-6 text-foreground" />
    </button>
    <button
      v-if="currentSlide < totalSlides - 1"
      class="nav-arrow nav-arrow-right rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card"
      aria-label="Next"
      @click="nextSlide"
    >
      <ChevronRight class="h-6 w-6 text-foreground" />
    </button>

    <!-- Pagination dots (mobile, capped at 10) -->
    <div v-if="totalSlides > 1 && totalSlides <= 12" class="pagination-dots md:hidden">
      <div
        v-for="i in totalSlides"
        :key="i"
        class="h-1.5 rounded-full transition-all duration-200"
        :class="(i - 1) === currentSlide
          ? 'w-6 bg-primary'
          : 'w-1.5 bg-muted-foreground/30'"
      />
    </div>
    <!-- Text counter for many entries on mobile -->
    <div v-else-if="totalSlides > 12" class="pagination-dots md:hidden">
      <span class="text-xs text-muted-foreground">
        {{ currentSlide + 1 }} / {{ totalSlides }}
      </span>
    </div>

    <!-- Counter on desktop -->
    <div v-if="totalSlides > 1" class="pagination-counter hidden md:block">
      <span class="text-xs text-muted-foreground">
        {{ currentSlide + 1 }} / {{ totalSlides }}
      </span>
    </div>

    <!-- Full-screen form sheet -->
    <Sheet v-model:open="formSheetOpen">
      <SheetContent side="bottom" class="form-sheet-content">
        <SheetHeader class="mb-4 text-left">
          <SheetTitle>Leave a Message</SheetTitle>
          <SheetDescription>
            Fill out the form below to add your entry to the guestbook.
          </SheetDescription>
        </SheetHeader>

        <div class="mx-auto max-w-2xl pb-8">
          <FormWizard @submit="handleSubmit" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
