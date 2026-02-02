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
const { formState, status, reset, setStatus, setError, getSubmitData, validate, applyFormConfig } = useGuestForm()

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

/** Computed inline styles for the info card based on cardColor, cardOpacity & cardBlur settings. */
const cardStyles = computed(() => {
  const settings = guestbookInfo.value?.settings
  const styles: Record<string, string> = {}
  const color = settings?.cardColor as string | undefined
  if (color) {
    const opacity = (settings?.cardOpacity as number | undefined) ?? 70
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    styles.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }
  const blur = (settings?.cardBlur as number | undefined) ?? 20
  styles.backdropFilter = `blur(${blur}px)`
  styles.WebkitBackdropFilter = `blur(${blur}px)`
  return styles
})

/** Whether a custom card color is configured. */
const hasCustomCardColor = computed(() => !!(guestbookInfo.value?.settings?.cardColor))

/** Resolved welcome message from settings or default. */
const welcomeMessage = computed(() =>
  (guestbookInfo.value?.settings?.welcomeMessage as string) || t('landing.subtitle')
)

/** Font class for the title. */
const titleFontClass = computed(() => {
  switch (guestbookInfo.value?.settings?.titleFont as string | undefined) {
    case 'display': return 'font-display'
    case 'sans': return 'font-sans'
    default: return 'font-handwritten'
  }
})

/** Font class for body text. */
const bodyFontClass = computed(() => {
  switch (guestbookInfo.value?.settings?.bodyFont as string | undefined) {
    case 'handwritten': return 'font-handwritten'
    case 'display': return 'font-display'
    default: return 'font-sans'
  }
})
const sheetOpen = ref(false)
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

function handleKeydown(e: KeyboardEvent): void {
  if (sheetOpen.value) return
  if (e.key === 'ArrowRight') nextSlide()
  if (e.key === 'ArrowLeft') prevSlide()
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  setStatus('submitting')
  const data = getSubmitData()
  const entry = await createEntry(data)

  if (entry) {
    setStatus('success')
    toast.success(t('toast.entryAdded'))
    sheetOpen.value = false
    reset()
    slideDirection.value = 'forward'
    currentSlide.value = 1
  } else {
    setError(t('toast.saveError'))
    toast.error(t('toast.saveFailed'))
  }
}

onMounted(async () => {
  // Setup swipe gestures
  useSwipe(swiperEl, {
    onSwipeEnd(_e, direction) {
      if (direction === 'left') nextSlide()
      if (direction === 'right') prevSlide()
    }
  })

  window.addEventListener('keydown', handleKeydown)

  try {
    const response = await $fetch<{ success: boolean; data?: typeof guestbookInfo.value }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (response.success && response.data) {
      guestbookInfo.value = response.data
      applyFormConfig(response.data.settings as import('~/types/guestbook').GuestbookSettings)

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
})
</script>

<template>
  <div
    ref="swiperEl"
    class="relative min-h-screen overflow-hidden"
    :style="{ touchAction: 'pan-y', ...backgroundStyles }"
  >
    <!-- Admin bar for authenticated owners -->
    <NuxtLink
      v-if="canAdmin"
      :to="`/g/${guestbookId}/admin`"
      class="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-border/20 bg-card/70 px-4 py-2 text-sm text-foreground backdrop-blur-xl transition-colors hover:bg-card/90"
    >
      <Settings class="h-4 w-4" />
      {{ t('landing.adminBar') }}
    </NuxtLink>

    <Transition :name="transitionName" mode="out-in">
      <!-- Slide 0: Intro -->
      <div
        v-if="currentSlide === 0"
        :key="'intro'"
        class="flex min-h-screen flex-col items-center justify-center px-6"
        :class="{ 'landing-gradient': !hasCustomBackground }"
      >
        <div
          class="mx-auto max-w-sm rounded-2xl border border-border/20 p-8 text-center shadow-xl"
          :class="{ 'bg-card/70': !hasCustomCardColor }"
          :style="cardStyles"
        >
          <h1
            class="text-5xl text-foreground"
            :class="titleFontClass"
          >
            {{ guestbookInfo?.name || t('landing.title') }}
          </h1>
          <p
            class="mt-3 text-sm text-muted-foreground"
            :class="bodyFontClass"
          >
            {{ welcomeMessage }}
          </p>
          <Button class="mt-6 w-full" size="lg" @click="sheetOpen = true">
            {{ t('landing.cta') }}
          </Button>
          <NuxtLink
            v-if="hasEntries"
            :to="`/g/${guestbookId}/view`"
            class="mt-3 block text-sm text-muted-foreground underline hover:text-foreground"
          >
            {{ t('landing.viewAll') }}
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
