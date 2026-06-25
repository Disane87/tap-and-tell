<script setup lang="ts">
/**
 * Simplified guestbook guest landing page.
 * URL: /g/[id]
 */
import { useSwipe } from '@vueuse/core'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const route = useRoute()
const guestbookId = computed(() => route.params.id as string)

// Use simplified composable (we'll create this next)
const { entries, fetchEntries, createEntry } = useGuestbook(guestbookId)

// Analytics tracking
const {
  trackPageView,
  trackFormStart,
  trackFormStep,
  trackFormAbandon,
  trackConversion
} = useAnalytics(guestbookId)
const { apply: applyColorScheme } = useForcedColorScheme()
const { formState, status, currentStep, reset, setStatus, setError, getSubmitData, validate, applyFormConfig } = useGuestForm()

// Offline queue: persist entries locally when offline and flush on reconnect
const { isOnline, queueEntry, syncPendingEntries, setupListeners } = useOfflineQueue()

// True once an entry has been submitted successfully — prevents firing
// trackFormAbandon after a real conversion.
const submittedSuccessfully = ref(false)

// Admin bar: check if current user can manage this guestbook
const { isAuthenticated, fetchMe } = useAuth()
const canAdmin = ref(false)

const guestbookInfo = ref<{ id: string; name: string; tenantId: string; settings: Record<string, unknown> } | null>(null)

/** Apply custom theme color from guestbook settings. */
watchEffect(() => {
  const color = (guestbookInfo.value?.settings?.themeColor as string) || undefined
  if (color) {
    document.documentElement.style.setProperty('--color-primary', color)
  }
})

/** Apply custom text color from guestbook settings. */
watchEffect(() => {
  const textColor = (guestbookInfo.value?.settings?.textColor as string) || undefined
  if (textColor) {
    document.documentElement.style.setProperty('--color-foreground', textColor)
    document.documentElement.style.setProperty('--color-card-foreground', textColor)
  }
})

/** Whether the admin has set a custom background (color or image). */
const hasCustomBackground = computed(() => {
  const settings = guestbookInfo.value?.settings
  return !!(settings?.backgroundColor || settings?.backgroundImageUrl)
})

/** Computed background styles from guestbook settings. */
const backgroundStyles = computed(() => {
  const settings = guestbookInfo.value?.settings
  if (!settings) return {}
  const styles: Record<string, string> = {}
  const bgColor = settings.backgroundColor as string | undefined
  const bgImage = settings.backgroundImageUrl as string | undefined
  if (bgColor) {
    styles.backgroundColor = bgColor
  }
  if (bgImage) {
    styles.backgroundImage = `url(${bgImage})`
    styles.backgroundSize = 'cover'
    styles.backgroundPosition = 'center'
    styles.backgroundRepeat = 'no-repeat'
  }
  return styles
})

/** Gallery layout variant for the desktop landing (from settings). */
const viewLayout = computed(() =>
  (guestbookInfo.value?.settings?.viewLayout as 'grid' | 'masonry' | 'list' | 'timeline' | undefined) || 'grid'
)

/** Card visual style for the desktop gallery (from settings). */
const cardStyle = computed(() =>
  (guestbookInfo.value?.settings?.cardStyle as 'polaroid' | 'minimal' | 'rounded' | 'bordered' | undefined) || 'polaroid'
)

/** Custom questions for the detail sheet (from settings). */
const customQuestions = computed(() =>
  (guestbookInfo.value?.settings?.customQuestions as import('~/types/guestbook').CustomQuestion[] | undefined) || []
)
const sheetOpen = ref(false)

// Timestamp when the form sheet was opened — used to compute durations for
// form analytics (step completion and abandonment).
const formStartedAt = ref(0)
// Timestamp when the current step became active — used for per-step duration.
const stepStartedAt = ref(0)

// Track form open / abandon.
watch(sheetOpen, (open) => {
  if (open) {
    submittedSuccessfully.value = false
    formStartedAt.value = Date.now()
    stepStartedAt.value = formStartedAt.value
    trackFormStart()
  } else {
    // Sheet closed without a successful submission → user abandoned the form.
    if (!submittedSuccessfully.value) {
      const duration = formStartedAt.value
        ? Math.round((Date.now() - formStartedAt.value) / 1000)
        : undefined
      trackFormAbandon(currentStep.value, duration)
    }
  }
})

// Track wizard step advances. currentStep is shared module-level state driven
// by the FormWizard's next-step transition. Only track while the sheet is open
// and the form has not yet been submitted.
watch(currentStep, (step, prevStep) => {
  if (!sheetOpen.value || submittedSuccessfully.value) return
  if (step <= prevStep) {
    // Moving backwards (or reset) — just reset the step timer.
    stepStartedAt.value = Date.now()
    return
  }
  const duration = stepStartedAt.value
    ? Math.round((Date.now() - stepStartedAt.value) / 1000)
    : undefined
  // Report completion of the step we just left.
  trackFormStep(prevStep, duration)
  stepStartedAt.value = Date.now()
})
const currentSlide = ref(0)
const slideDirection = ref<'forward' | 'backward'>('forward')
const swiperEl = ref<HTMLElement | null>(null)

const totalSlides = computed(() => 1 + entries.value.length)
const hasEntries = computed(() => entries.value.length > 0)

const currentEntry = computed(() => {
  if (currentSlide.value === 0) return null
  return entries.value[currentSlide.value - 1] ?? null
})

const transitionName = computed(() =>
  slideDirection.value === 'forward' ? 'slide-left' : 'slide-right'
)

function nextSlide(): void {
  if (currentSlide.value < totalSlides.value - 1) {
    slideDirection.value = 'forward'
    currentSlide.value++
  }
}

function prevSlide(): void {
  if (currentSlide.value > 0) {
    slideDirection.value = 'backward'
    currentSlide.value--
  }
}

function goToSlide(index: number): void {
  slideDirection.value = index > currentSlide.value ? 'forward' : 'backward'
  currentSlide.value = index
}

useSwipe(swiperEl, {
  onSwipeEnd(_e, direction) {
    if (direction === 'left') nextSlide()
    if (direction === 'right') prevSlide()
  }
})

function handleKeydown(e: KeyboardEvent): void {
  if (sheetOpen.value) return
  if (e.key === 'ArrowRight') nextSlide()
  if (e.key === 'ArrowLeft') prevSlide()
}

/**
 * Finalizes a successful (or queued-offline) submission: closes the sheet,
 * resets the wizard and returns to the first entry slide.
 */
function finishSubmission(): void {
  submittedSuccessfully.value = true
  // Track completion of the final step before resetting.
  const duration = stepStartedAt.value
    ? Math.round((Date.now() - stepStartedAt.value) / 1000)
    : undefined
  trackFormStep(currentStep.value, duration)

  setStatus('success')
  sheetOpen.value = false
  reset()
  slideDirection.value = 'forward'
  currentSlide.value = 1
}

/**
 * Queues an entry locally for later sync and finalizes the submission.
 * Falls back to the generic save error if queuing fails.
 */
async function queueOfflineAndFinish(data: import('~/types/guest').CreateGuestEntryInput): Promise<void> {
  try {
    await queueEntry(data)
    toast.success(t('features.offline.description'))
    finishSubmission()
  } catch (error) {
    console.error('Failed to queue offline entry:', error)
    setError(t('toast.saveError'))
    toast.error(t('toast.saveFailed'))
  }
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  setStatus('submitting')
  const data = getSubmitData()

  // When offline, queue the entry locally and flush it once we're back online.
  if (!isOnline.value) {
    await queueOfflineAndFinish(data)
    return
  }

  const entry = await createEntry(data)

  if (entry) {
    toast.success(t('toast.entryAdded'))
    // Track successful conversion
    trackConversion(!!(data.media && data.media.length > 0))
    // Refresh from the server so the new entry shows up immediately. This
    // mirrors the offline-sync path (submitQueuedEntry); the online path
    // previously relied solely on the in-memory insert in useGuestbook, which
    // could leave the swiper showing a stale list until a manual reload.
    await fetchEntries()
    finishSubmission()
  } else if (!isOnline.value) {
    // Lost connectivity during the request — queue instead of failing.
    await queueOfflineAndFinish(data)
  } else {
    setError(t('toast.saveError'))
    toast.error(t('toast.saveFailed'))
  }
}

/**
 * Submits a queued offline entry to the server.
 *
 * @returns True when the entry was accepted (so it can be removed from the queue).
 */
async function submitQueuedEntry(data: import('~/types/guest').CreateGuestEntryInput): Promise<boolean> {
  const entry = await createEntry(data)
  if (entry) {
    await fetchEntries()
    return true
  }
  return false
}

/**
 * Flushes any locally-queued entries to the server.
 */
async function flushOfflineQueue(): Promise<void> {
  const synced = await syncPendingEntries(submitQueuedEntry)
  if (synced > 0) {
    toast.success(t('toast.entryAdded'))
  }
}

// Flush the offline queue whenever connectivity is restored.
watch(isOnline, (online) => {
  if (online) {
    flushOfflineQueue()
  }
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  // Start listening for online/offline transitions and flush any entries that
  // were queued in a previous (offline) session.
  setupListeners()
  if (isOnline.value) {
    await flushOfflineQueue()
  }

  try {
    const response = await $fetch<{ success: boolean; data?: typeof guestbookInfo.value }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (response.success && response.data) {
      guestbookInfo.value = response.data
      applyFormConfig(response.data.settings as import('~/types/guestbook').GuestbookSettings)
      applyColorScheme(response.data.settings?.colorScheme as 'system' | 'light' | 'dark' | undefined)

      // Track page view after guestbook info is loaded
      trackPageView()

      // Check if logged-in user can admin this guestbook
      await fetchMe()
      if (isAuthenticated.value && response.data.tenantId) {
        try {
          await $fetch(`/api/tenants/${response.data.tenantId}`)
          canAdmin.value = true
        } catch {
          // Not a member — canAdmin stays false
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch guestbook info:', error)
  }

  await fetchEntries()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.documentElement.style.removeProperty('--color-primary')
  document.documentElement.style.removeProperty('--color-foreground')
  document.documentElement.style.removeProperty('--color-card-foreground')
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Admin bar for authenticated owners -->
    <NuxtLink
      v-if="canAdmin"
      :to="`/g/${guestbookId}/admin`"
      class="flex shrink-0 items-center justify-center gap-2 border-b border-border/20 bg-card/70 px-4 py-2 text-sm text-foreground backdrop-blur-xl transition-colors hover:bg-card/90"
    >
      <Settings class="h-4 w-4" />
      {{ t('landing.adminBar') }}
    </NuxtLink>

    <!-- Mobile / tablet: swipeable single-entry experience (unchanged below lg) -->
    <div
      ref="swiperEl"
      class="relative flex flex-1 flex-col overflow-hidden lg:hidden"
      :style="{ touchAction: 'pan-y', ...backgroundStyles }"
    >

    <Transition :name="transitionName" mode="out-in">
      <!-- Slide 0: Intro -->
      <div
        v-if="currentSlide === 0"
        :key="'intro'"
        class="flex flex-1 flex-col items-center justify-center px-6"
        :class="{ 'landing-gradient': !hasCustomBackground }"
      >
        <LandingHero
          :name="guestbookInfo?.name"
          :settings="guestbookInfo?.settings"
          :guestbook-id="guestbookId"
          :show-view-all="hasEntries"
          @cta="sheetOpen = true"
        />
      </div>

      <!-- Slides 1+: Entry views -->
      <div
        v-else-if="currentEntry"
        :key="currentSlide"
        class="flex-1"
      >
        <GuestEntryFullView :entry="currentEntry" />
      </div>
    </Transition>

    <!-- Navigation arrows -->
    <template v-if="totalSlides > 1">
      <button
        v-if="currentSlide > 0"
        class="nav-arrow nav-arrow-left hidden md:flex"
        :aria-label="t('nav.previous')"
        @click="prevSlide"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <button
        v-if="currentSlide < totalSlides - 1"
        class="nav-arrow nav-arrow-right hidden md:flex"
        :aria-label="t('nav.next')"
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
        :aria-label="t('nav.goToSlide', { number: i })"
        @click="goToSlide(i - 1)"
      />
    </div>

    <!-- Entry counter -->
    <div
      v-if="currentSlide > 0 && hasEntries"
      class="fixed right-4 top-4 z-20 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
      aria-live="polite"
    >
      {{ currentSlide }} / {{ entries.length }}
    </div>

    </div>

    <!-- Desktop: gallery-first layout (lg and up) -->
    <div
      class="hidden flex-1 overflow-y-auto lg:block"
      :class="{ 'landing-gradient': !hasCustomBackground }"
      :style="backgroundStyles"
    >
      <div class="mx-auto max-w-6xl px-6 py-10 xl:max-w-7xl">
        <!-- Hero / CTA -->
        <LandingHero
          :name="guestbookInfo?.name"
          :settings="guestbookInfo?.settings"
          :guestbook-id="guestbookId"
          wide
          @cta="sheetOpen = true"
        />

        <!-- Entry gallery -->
        <div v-if="hasEntries" class="mt-10">
          <EntryGallery
            :entries="entries"
            :view-layout="viewLayout"
            :card-style="cardStyle"
            :custom-questions="customQuestions"
          />
        </div>
      </div>
    </div>

    <!-- Form Sheet (bottom sheet on mobile, centered modal from lg up) -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent
        side="bottom"
        class="form-sheet-content overflow-y-auto lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85vh] lg:w-full lg:max-w-xl lg:rounded-3xl lg:border"
      >
        <SheetHeader>
          <SheetTitle class="font-display text-xl">{{ t('form.addEntry') }}</SheetTitle>
          <SheetDescription>{{ t('form.addEntryDescription') }}</SheetDescription>
        </SheetHeader>
        <div class="mt-4 pb-8">
          <FormWizard @submit="handleSubmit" />
          <p
            v-if="status === 'submitting'"
            class="mt-3 animate-gentle-pulse text-center text-sm text-muted-foreground"
          >
            {{ t('common.saving') }}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
