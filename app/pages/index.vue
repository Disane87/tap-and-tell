<script setup lang="ts">
/**
 * Landing page with swipeable entry view.
 *
 * Slide 0: Intro — gradient background, title, CTA button.
 * Slides 1+: Individual guest entries displayed fullscreen.
 *
 * The form wizard opens as a full-screen bottom sheet.
 * After successful submission, navigates to the first entry slide.
 */
import { useSwipe } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: false
})

const { nfcContext, welcomeMessage } = useNfc()
const { entries, fetchEntries, createEntry } = useGuests()
const { formState, status, reset, setStatus, setError, getSubmitData, validate } = useGuestForm()

const sheetOpen = ref(false)
const currentSlide = ref(0)
const slideDirection = ref<'forward' | 'backward'>('forward')
const swiperEl = ref<HTMLElement | null>(null)

/**
 * Total slides: 1 intro + N entries.
 */
const totalSlides = computed(() => 1 + entries.value.length)

const hasEntries = computed(() => entries.value.length > 0)

/**
 * The current entry being displayed (null on intro slide).
 */
const currentEntry = computed(() => {
  if (currentSlide.value === 0) return null
  return entries.value[currentSlide.value - 1] ?? null
})

/**
 * Transition name based on slide direction.
 */
const transitionName = computed(() =>
  slideDirection.value === 'forward' ? 'slide-left' : 'slide-right'
)

/**
 * Navigate to next slide.
 */
function nextSlide(): void {
  if (currentSlide.value < totalSlides.value - 1) {
    slideDirection.value = 'forward'
    currentSlide.value++
  }
}

/**
 * Navigate to previous slide.
 */
function prevSlide(): void {
  if (currentSlide.value > 0) {
    slideDirection.value = 'backward'
    currentSlide.value--
  }
}

// Swipe detection
useSwipe(swiperEl, {
  onSwipeEnd(_e, direction) {
    if (direction === 'left') nextSlide()
    if (direction === 'right') prevSlide()
  }
})

// Keyboard navigation
function handleKeydown(e: KeyboardEvent): void {
  if (sheetOpen.value) return
  if (e.key === 'ArrowRight') nextSlide()
  if (e.key === 'ArrowLeft') prevSlide()
}

/**
 * Handles form submission from the wizard.
 * Creates the entry, shows feedback, and navigates to the first entry.
 */
async function handleSubmit(): Promise<void> {
  if (!validate()) return

  setStatus('submitting')
  const data = getSubmitData()
  const entry = await createEntry(data)

  if (entry) {
    setStatus('success')
    toast.success('Eintrag hinzugefügt!')
    sheetOpen.value = false
    reset()
    // Navigate to the newly added entry (first in list)
    slideDirection.value = 'forward'
    currentSlide.value = 1
  } else {
    setError('Fehler beim Speichern. Bitte versuche es erneut.')
    toast.error('Etwas ist schiefgelaufen.')
  }
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
    <!-- Slides -->
    <Transition :name="transitionName" mode="out-in">
      <!-- Slide 0: Intro -->
      <div
        v-if="currentSlide === 0"
        :key="'intro'"
        class="landing-gradient flex min-h-screen flex-col items-center justify-center px-6"
      >
        <div class="info-card mx-auto max-w-sm text-center">
          <h1 class="font-handwritten text-5xl text-foreground">
            Tap & Tell
          </h1>
          <p v-if="nfcContext.isNfcEntry" class="mt-3 text-sm text-muted-foreground">
            {{ welcomeMessage }}
          </p>
          <p v-else class="mt-3 text-sm text-muted-foreground">
            Hinterlasse eine Nachricht und erzähl uns etwas über dich.
          </p>
          <Button class="mt-6 w-full" size="lg" @click="sheetOpen = true">
            Reinschreiben
          </Button>
          <NuxtLink
            v-if="hasEntries"
            to="/guestbook"
            class="mt-3 block text-sm text-muted-foreground underline hover:text-foreground"
          >
            Alle Einträge ansehen
          </NuxtLink>
        </div>
      </div>

      <!-- Slides 1+: Entry views -->
      <div
        v-else-if="currentEntry"
        :key="currentSlide"
        class="min-h-screen"
      >
        <GuestEntryFullView :entry="currentEntry" />
      </div>
    </Transition>

    <!-- Navigation arrows (desktop, hidden on mobile) -->
    <template v-if="totalSlides > 1">
      <button
        v-if="currentSlide > 0"
        class="nav-arrow nav-arrow-left hidden md:flex"
        aria-label="Previous"
        @click="prevSlide"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <button
        v-if="currentSlide < totalSlides - 1"
        class="nav-arrow nav-arrow-right hidden md:flex"
        aria-label="Next"
        @click="nextSlide"
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </template>

    <!-- Pagination dots -->
    <div
      v-if="totalSlides > 1"
      class="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5"
    >
      <button
        v-for="i in totalSlides"
        :key="i"
        class="pagination-dot"
        :class="{ active: currentSlide === i - 1 }"
        :aria-label="`Go to slide ${i}`"
        @click="slideDirection = (i - 1) > currentSlide ? 'forward' : 'backward'; currentSlide = i - 1"
      />
    </div>

    <!-- Entry counter -->
    <div
      v-if="currentSlide > 0 && hasEntries"
      class="fixed right-4 top-4 z-20 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
    >
      {{ currentSlide }} / {{ entries.length }}
    </div>

    <!-- Form Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent side="bottom" class="form-sheet-content overflow-y-auto">
        <SheetHeader>
          <SheetTitle class="font-display text-xl">Eintrag hinzufügen</SheetTitle>
          <SheetDescription>
            Füll das Formular aus um deinen Eintrag hinzuzufügen.
          </SheetDescription>
        </SheetHeader>
        <div class="mt-4 pb-8">
          <FormWizard @submit="handleSubmit" />
          <p
            v-if="status === 'submitting'"
            class="mt-3 animate-gentle-pulse text-center text-sm text-muted-foreground"
          >
            Wird gespeichert...
          </p>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
