<script setup lang="ts">
/**
 * Guestbook slideshow page for full-screen auto-rotating entry display.
 * URL: /g/[id]/slideshow
 */
import {
  Play, Pause, ChevronLeft, ChevronRight,
  Maximize, Minimize, Settings, X
} from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const route = useRoute()
const guestbookId = computed(() => route.params.id as string)

const { entries, fetchEntries } = useGuestbook(guestbookId)
const { apply: applyColorScheme } = useForcedColorScheme()

/** Slideshow options initialized from guestbook settings. */
const slideshowOptions = ref<{ interval?: number; transition?: 'fade' | 'slide' | 'zoom'; showBadges?: boolean; showNames?: boolean }>({})

const {
  currentIndex, currentEntry, totalEntries, hasEntries,
  isPlaying, interval, transition, showBadges, showNames,
  next, prev, goTo, toggle, play, pause,
  setInterval: setIntervalValue, enterFullscreen, exitFullscreen
} = useSlideshow(entries, slideshowOptions.value)

const slideshowEl = ref<HTMLElement | null>(null)
const showControls = ref(true)
const showSettings = ref(false)
const isFullscreen = ref(false)
let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null
const guestbookInfo = ref<{ settings?: Record<string, unknown> } | null>(null)

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

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  else if (e.key === 'Escape') {
    if (showSettings.value) showSettings.value = false
    else if (isFullscreen.value) exitFullscreen()
  }
  else if (e.key === 'p' || e.key === 'P') toggle()
  else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
}

function onMouseMove(): void {
  showControls.value = true
  resetHideTimer()
}

function resetHideTimer(): void {
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
  hideControlsTimeout = setTimeout(() => {
    if (isPlaying.value) showControls.value = false
  }, 3000)
}

async function toggleFullscreen(): Promise<void> {
  if (isFullscreen.value) await exitFullscreen()
  else if (slideshowEl.value) await enterFullscreen(slideshowEl.value)
}

function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement
}

function changeInterval(seconds: number): void {
  setIntervalValue(seconds)
  showSettings.value = false
}

onMounted(async () => {
  try {
    const response = await $fetch<{ success: boolean; data?: typeof guestbookInfo.value }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (response.success && response.data) {
      guestbookInfo.value = response.data
      applyColorScheme(response.data.settings?.colorScheme as 'system' | 'light' | 'dark' | undefined)

      // Apply slideshow settings from guestbook
      const settings = response.data.settings
      if (settings) {
        if (settings.slideshowInterval) {
          setIntervalValue(settings.slideshowInterval as number)
        }
        if (settings.slideshowTransition) {
          transition.value = settings.slideshowTransition as 'fade' | 'slide' | 'zoom'
        }
        if (typeof settings.slideshowShowBadges === 'boolean') {
          showBadges.value = settings.slideshowShowBadges
        }
        if (typeof settings.slideshowShowNames === 'boolean') {
          showNames.value = settings.slideshowShowNames
        }
      }
    }
  } catch {
    // Non-critical, page still works without background
  }

  await fetchEntries()
  if (hasEntries.value) play()

  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  resetHideTimer()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
})
</script>

<template>
  <div
    ref="slideshowEl"
    class="slideshow-container"
    :style="backgroundStyles"
    @mousemove="onMouseMove"
  >
    <!-- Empty state -->
    <div v-if="!hasEntries" class="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
      <p class="text-muted-foreground">{{ t('slideshow.noEntries') }}</p>
      <NuxtLink :to="`/g/${guestbookId}`">
        <Button class="mt-4">{{ t('slideshow.backToGuestbook') }}</Button>
      </NuxtLink>
    </div>

    <!-- Slideshow -->
    <div v-else class="relative min-h-screen">
      <Transition name="fade" mode="out-in">
        <GuestEntryFullView
          v-if="currentEntry"
          :key="currentEntry.id"
          :entry="currentEntry"
        />
      </Transition>

      <!-- Controls overlay -->
      <Transition name="fade">
        <div
          v-show="showControls"
          class="slideshow-controls"
        >
          <!-- Top bar -->
          <div class="slideshow-top-bar">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-white">
                {{ currentIndex + 1 }} / {{ totalEntries }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="showSettings = !showSettings"
              >
                <Settings class="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="toggleFullscreen"
              >
                <Maximize v-if="!isFullscreen" class="h-5 w-5" />
                <Minimize v-else class="h-5 w-5" />
              </Button>
              <NuxtLink :to="`/g/${guestbookId}/view`">
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-white hover:bg-white/20"
                >
                  <X class="h-5 w-5" />
                </Button>
              </NuxtLink>
            </div>
          </div>

          <!-- Center controls -->
          <div class="slideshow-center-controls">
            <Button
              variant="ghost"
              size="icon"
              class="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
              @click="prev"
            >
              <ChevronLeft class="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-16 w-16 rounded-full bg-white/10 text-white hover:bg-white/20"
              @click="toggle"
            >
              <Play v-if="!isPlaying" class="h-8 w-8" />
              <Pause v-else class="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
              @click="next"
            >
              <ChevronRight class="h-6 w-6" />
            </Button>
          </div>

          <!-- Bottom progress bar -->
          <div class="slideshow-progress-bar">
            <div
              v-for="(_, i) in totalEntries"
              :key="i"
              class="slideshow-progress-segment"
              :class="{ active: i === currentIndex }"
              @click="goTo(i)"
            />
          </div>
        </div>
      </Transition>

      <!-- Settings panel -->
      <Transition name="slide-up">
        <div v-if="showSettings" class="slideshow-settings">
          <h3 class="mb-4 text-lg font-semibold text-white">{{ t('slideshow.settings') }}</h3>
          <div class="space-y-2">
            <p class="text-sm text-white/80">{{ t('slideshow.intervalLabel') }}</p>
            <div class="grid grid-cols-4 gap-2">
              <Button
                v-for="sec in [3, 5, 10, 15]"
                :key="sec"
                :variant="interval === sec ? 'default' : 'outline'"
                size="sm"
                @click="changeInterval(sec)"
              >
                {{ sec }}s
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slideshow-container {
  position: relative;
  overflow: hidden;
  background-color: black;
}

.slideshow-controls {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.slideshow-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
  pointer-events: auto;
}

.slideshow-center-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 2rem;
  pointer-events: auto;
}

.slideshow-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.25rem;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  pointer-events: auto;
}

.slideshow-progress-segment {
  flex: 1;
  height: 0.25rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.slideshow-progress-segment:hover {
  background: rgba(255, 255, 255, 0.5);
}

.slideshow-progress-segment.active {
  background: white;
}

.slideshow-settings {
  position: absolute;
  bottom: 4rem;
  right: 1rem;
  width: 20rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  z-index: 60;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
