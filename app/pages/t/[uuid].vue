<script setup lang="ts">
/**
 * Tenant guest landing page with swipeable entry view.
 *
 * Slide 0: Intro with tenant name and CTA.
 * Slides 1+: Individual guest entries displayed fullscreen.
 *
 * The form wizard opens as a full-screen bottom sheet.
 */
import { useSwipe } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.uuid as string)

const { entries, fetchEntries, createEntry } = useTenantGuests(tenantId)
const { formState, status, reset, setStatus, setError, getSubmitData, validate } = useGuestForm()

const tenantInfo = ref<{ id: string; name: string; settings: Record<string, unknown> } | null>(null)
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
 * Handles form submission.
 */
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

/**
 * Fetches tenant info and entries on mount.
 */
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  try {
    const response = await $fetch<{ success: boolean; data?: typeof tenantInfo.value }>(
      `/api/t/${tenantId.value}/info`
    )
    if (response.success && response.data) {
      tenantInfo.value = response.data
    }
  } catch {
    // Tenant not found
  }

  fetchEntries()
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
    <Transition :name="transitionName" mode="out-in">
      <!-- Slide 0: Intro -->
      <div
        v-if="currentSlide === 0"
        :key="'intro'"
        class="landing-gradient flex min-h-screen flex-col items-center justify-center px-6"
      >
        <div class="info-card mx-auto max-w-sm text-center">
          <h1 class="font-handwritten text-5xl text-foreground">
            {{ tenantInfo?.name || t('landing.title') }}
          </h1>
          <p class="mt-3 text-sm text-muted-foreground">
            {{ t('landing.subtitle') }}
          </p>
          <Button class="mt-6 w-full" size="lg" @click="sheetOpen = true">
            {{ t('landing.cta') }}
          </Button>
          <NuxtLink
            v-if="hasEntries"
            :to="`/t/${tenantId}/guestbook`"
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
