import type { GuestEntry } from '~/types/guest'

/**
 * Options for slideshow initialization.
 */
export interface SlideshowOptions {
  /** Initial interval in seconds (default 8). */
  interval?: number
  /** Transition effect (default 'fade'). */
  transition?: 'fade' | 'slide' | 'zoom'
  /** Show answer badges overlay (default true). */
  showBadges?: boolean
  /** Show guest names overlay (default true). */
  showNames?: boolean
}

/**
 * Composable for slideshow functionality.
 *
 * Provides auto-advancing slides with configurable interval,
 * pause/resume controls, and keyboard navigation.
 *
 * @param entries - Reactive array of guest entries
 * @param options - Optional slideshow settings
 * @returns Slideshow state and controls
 */
export function useSlideshow(entries: Ref<GuestEntry[]>, options?: SlideshowOptions) {
  const currentIndex = ref(0)
  const isPlaying = ref(true)
  const interval = ref(options?.interval ?? 8) // seconds
  const transition = ref<'fade' | 'slide' | 'zoom'>(options?.transition ?? 'fade')
  const showBadges = ref(options?.showBadges ?? true)
  const showNames = ref(options?.showNames ?? true)
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

  /**
   * Current entry being displayed.
   */
  const currentEntry = computed(() => entries.value[currentIndex.value] ?? null)

  /**
   * Total number of entries.
   */
  const totalEntries = computed(() => entries.value.length)

  /**
   * Whether there are entries to show.
   */
  const hasEntries = computed(() => entries.value.length > 0)

  /**
   * Advances to the next slide, wrapping to start if at end.
   */
  function next(): void {
    if (entries.value.length === 0) return
    currentIndex.value = (currentIndex.value + 1) % entries.value.length
  }

  /**
   * Goes to the previous slide, wrapping to end if at start.
   */
  function prev(): void {
    if (entries.value.length === 0) return
    currentIndex.value = currentIndex.value === 0
      ? entries.value.length - 1
      : currentIndex.value - 1
  }

  /**
   * Jumps to a specific slide index.
   */
  function goTo(index: number): void {
    if (index >= 0 && index < entries.value.length) {
      currentIndex.value = index
    }
  }

  /**
   * Starts auto-advance timer.
   */
  function play(): void {
    isPlaying.value = true
    stopTimer()
    intervalId.value = setInterval(() => {
      next()
    }, interval.value * 1000)
  }

  /**
   * Pauses auto-advance timer.
   */
  function pause(): void {
    isPlaying.value = false
    stopTimer()
  }

  /**
   * Toggles play/pause state.
   */
  function toggle(): void {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  /**
   * Stops the interval timer.
   */
  function stopTimer(): void {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  /**
   * Sets the auto-advance interval in seconds.
   */
  function setInterval(seconds: number): void {
    interval.value = Math.max(3, Math.min(30, seconds))
    if (isPlaying.value) {
      play() // Restart with new interval
    }
  }

  /**
   * Requests fullscreen mode for an element.
   */
  async function enterFullscreen(element: HTMLElement): Promise<void> {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      }
    } catch (e) {
      console.warn('Fullscreen not supported:', e)
    }
  }

  /**
   * Exits fullscreen mode.
   */
  async function exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.warn('Exit fullscreen failed:', e)
    }
  }

  /**
   * Whether currently in fullscreen mode.
   */
  const isFullscreen = ref(false)

  // Watch for entries changes and reset index if needed
  watch(entries, (newEntries) => {
    if (currentIndex.value >= newEntries.length) {
      currentIndex.value = Math.max(0, newEntries.length - 1)
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopTimer()
  })

  return {
    currentIndex,
    currentEntry,
    totalEntries,
    hasEntries,
    isPlaying,
    interval,
    transition,
    showBadges,
    showNames,
    isFullscreen,
    next,
    prev,
    goTo,
    play,
    pause,
    toggle,
    setInterval,
    enterFullscreen,
    exitFullscreen
  }
}
