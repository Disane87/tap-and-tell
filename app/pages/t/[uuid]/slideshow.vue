<script setup lang="ts">
/**
 * Tenant-scoped slideshow page for full-screen auto-rotating entry display.
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
const tenantId = computed(() => route.params.uuid as string)

const { entries, fetchEntries } = useTenantGuests(tenantId)
const {
  currentIndex, currentEntry, totalEntries, hasEntries,
  isPlaying, interval, next, prev, goTo, toggle, play, pause,
  setInterval: setIntervalValue, enterFullscreen, exitFullscreen
} = useSlideshow(entries)

const slideshowEl = ref<HTMLElement | null>(null)
const showControls = ref(true)
const showSettings = ref(false)
const isFullscreen = ref(false)
let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null

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

onMounted(() => {
  fetchEntries()
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  play()
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
    class="relative h-screen w-screen overflow-hidden bg-black"
    @mousemove="onMouseMove"
    @click="showControls = true; resetHideTimer()"
  >
    <div v-if="!hasEntries" class="flex h-full items-center justify-center">
      <p class="text-lg text-white/60">{{ $t('common.loading') }}</p>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="currentEntry" :key="currentEntry.id" class="h-full w-full">
        <GuestEntryFullView :entry="currentEntry" />
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showControls && hasEntries" class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
          <NuxtLink
            :to="`/t/${tenantId}/guestbook`"
            class="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
            <span class="text-sm">{{ $t('slideshow.exit') }}</span>
          </NuxtLink>
          <div class="flex items-center gap-2">
            <button class="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors" @click="showSettings = !showSettings">
              <Settings class="h-5 w-5" />
            </button>
            <button class="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors" @click="toggleFullscreen">
              <Maximize v-if="!isFullscreen" class="h-5 w-5" />
              <Minimize v-else class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
          <div class="flex items-center justify-center gap-4">
            <button class="rounded-full p-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors" @click="prev">
              <ChevronLeft class="h-6 w-6" />
            </button>
            <button class="rounded-full bg-white/20 p-4 text-white hover:bg-white/30 transition-colors" @click="toggle">
              <Pause v-if="isPlaying" class="h-6 w-6" />
              <Play v-else class="h-6 w-6" />
            </button>
            <button class="rounded-full p-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors" @click="next">
              <ChevronRight class="h-6 w-6" />
            </button>
          </div>

          <div class="mt-4 flex justify-center gap-1.5">
            <button
              v-for="(_, idx) in totalEntries"
              :key="idx"
              class="h-1.5 rounded-full transition-all"
              :class="idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'"
              @click="goTo(idx)"
            />
          </div>

          <p class="mt-2 text-center text-sm text-white/60">
            {{ currentIndex + 1 }} / {{ totalEntries }}
          </p>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div v-if="showSettings" class="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 p-4 backdrop-blur-sm">
        <p class="mb-3 text-sm font-medium text-white">{{ $t('slideshow.settings') }}</p>
        <div class="flex items-center gap-3">
          <label class="text-sm text-white/70">{{ $t('slideshow.interval') }}</label>
          <input
            type="range" min="3" max="20" :value="interval" class="w-32"
            @input="setIntervalValue(Number(($event.target as HTMLInputElement).value))"
          >
          <span class="text-sm text-white/70">{{ interval }}s</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
