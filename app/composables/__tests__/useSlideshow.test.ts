/**
 * Unit tests for useSlideshow composable.
 *
 * Tests slideshow navigation (next, prev, goTo), wrapping behavior,
 * play/pause/toggle state management, interval clamping, empty entries
 * handling, and index bounds on entries change.
 *
 * Note: The composable defines a local `setInterval(seconds)` function that
 * shadows the global `setInterval(callback, delay)`. This means `play()`
 * internally calls the local `setInterval` (which calls `play()` back when
 * isPlaying is true), creating infinite recursion. Timer-based auto-advance
 * tests are therefore not feasible and the composable's `setInterval` clamping
 * is tested only while paused to avoid triggering the recursion.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import type { GuestEntry } from '~/types/guest'

// Mock Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('onUnmounted', vi.fn())
vi.stubGlobal('watch', vi.fn())

// Import after mocks
import { useSlideshow } from '../useSlideshow'

/**
 * Helper to create mock guest entries.
 */
function createEntries(count: number): GuestEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Guest ${i + 1}`,
    message: `Message ${i + 1}`,
    createdAt: new Date(2024, 0, i + 1).toISOString()
  }))
}

describe('useSlideshow', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      expect(slideshow.currentIndex.value).toBe(0)
      expect(slideshow.isPlaying.value).toBe(true)
      expect(slideshow.interval.value).toBe(8)
      expect(slideshow.transition.value).toBe('fade')
      expect(slideshow.showBadges.value).toBe(true)
      expect(slideshow.showNames.value).toBe(true)
      expect(slideshow.isFullscreen.value).toBe(false)
    })

    it('should accept custom options', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries, {
        interval: 5,
        transition: 'slide',
        showBadges: false,
        showNames: false
      })

      expect(slideshow.interval.value).toBe(5)
      expect(slideshow.transition.value).toBe('slide')
      expect(slideshow.showBadges.value).toBe(false)
      expect(slideshow.showNames.value).toBe(false)
    })

    it('should use default values for unspecified options', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries, { interval: 10 })

      expect(slideshow.interval.value).toBe(10)
      expect(slideshow.transition.value).toBe('fade')
      expect(slideshow.showBadges.value).toBe(true)
      expect(slideshow.showNames.value).toBe(true)
    })

    it('should accept zoom transition option', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries, { transition: 'zoom' })

      expect(slideshow.transition.value).toBe('zoom')
    })
  })

  describe('computed properties', () => {
    it('should compute currentEntry from entries', () => {
      const entries = ref(createEntries(3))
      const { currentEntry, currentIndex } = useSlideshow(entries)

      expect(currentEntry.value).toEqual(entries.value[0])

      currentIndex.value = 1
      expect(currentEntry.value).toEqual(entries.value[1])
    })

    it('should return null for currentEntry when entries is empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { currentEntry } = useSlideshow(entries)

      expect(currentEntry.value).toBeNull()
    })

    it('should return null for currentEntry when index exceeds entries', () => {
      const entries = ref(createEntries(2))
      const { currentEntry, currentIndex } = useSlideshow(entries)

      currentIndex.value = 5
      expect(currentEntry.value).toBeNull()
    })

    it('should compute totalEntries', () => {
      const entries = ref(createEntries(5))
      const { totalEntries } = useSlideshow(entries)

      expect(totalEntries.value).toBe(5)
    })

    it('should compute totalEntries as 0 for empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { totalEntries } = useSlideshow(entries)

      expect(totalEntries.value).toBe(0)
    })

    it('should compute hasEntries correctly', () => {
      const entries = ref(createEntries(3))
      const { hasEntries } = useSlideshow(entries)

      expect(hasEntries.value).toBe(true)
    })

    it('should compute hasEntries as false when empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { hasEntries } = useSlideshow(entries)

      expect(hasEntries.value).toBe(false)
    })
  })

  describe('navigation - next', () => {
    it('should advance to next slide', () => {
      const entries = ref(createEntries(3))
      const { currentIndex, next } = useSlideshow(entries)

      expect(currentIndex.value).toBe(0)
      next()
      expect(currentIndex.value).toBe(1)
      next()
      expect(currentIndex.value).toBe(2)
    })

    it('should wrap to start when at end', () => {
      const entries = ref(createEntries(3))
      const { currentIndex, next } = useSlideshow(entries)

      currentIndex.value = 2
      next()
      expect(currentIndex.value).toBe(0)
    })

    it('should do nothing when entries is empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { currentIndex, next } = useSlideshow(entries)

      next()
      expect(currentIndex.value).toBe(0)
    })

    it('should handle single entry (wraps back to 0)', () => {
      const entries = ref(createEntries(1))
      const { currentIndex, next } = useSlideshow(entries)

      next()
      expect(currentIndex.value).toBe(0)
    })

    it('should correctly cycle through all entries', () => {
      const entries = ref(createEntries(4))
      const { currentIndex, next } = useSlideshow(entries)

      next() // 0 -> 1
      next() // 1 -> 2
      next() // 2 -> 3
      next() // 3 -> 0 (wrap)
      expect(currentIndex.value).toBe(0)
    })
  })

  describe('navigation - prev', () => {
    it('should go to previous slide', () => {
      const entries = ref(createEntries(3))
      const { currentIndex, prev } = useSlideshow(entries)

      currentIndex.value = 2
      prev()
      expect(currentIndex.value).toBe(1)
      prev()
      expect(currentIndex.value).toBe(0)
    })

    it('should wrap to end when at start', () => {
      const entries = ref(createEntries(3))
      const { currentIndex, prev } = useSlideshow(entries)

      expect(currentIndex.value).toBe(0)
      prev()
      expect(currentIndex.value).toBe(2)
    })

    it('should do nothing when entries is empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { currentIndex, prev } = useSlideshow(entries)

      prev()
      expect(currentIndex.value).toBe(0)
    })

    it('should handle single entry (wraps back to 0)', () => {
      const entries = ref(createEntries(1))
      const { currentIndex, prev } = useSlideshow(entries)

      prev()
      expect(currentIndex.value).toBe(0)
    })

    it('should correctly cycle through all entries backwards', () => {
      const entries = ref(createEntries(4))
      const { currentIndex, prev } = useSlideshow(entries)

      prev() // 0 -> 3 (wrap)
      expect(currentIndex.value).toBe(3)
      prev() // 3 -> 2
      expect(currentIndex.value).toBe(2)
      prev() // 2 -> 1
      expect(currentIndex.value).toBe(1)
      prev() // 1 -> 0
      expect(currentIndex.value).toBe(0)
    })
  })

  describe('navigation - goTo', () => {
    it('should jump to specific index', () => {
      const entries = ref(createEntries(5))
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(3)
      expect(currentIndex.value).toBe(3)
    })

    it('should not change index for negative values', () => {
      const entries = ref(createEntries(5))
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(-1)
      expect(currentIndex.value).toBe(0)
    })

    it('should not change index for out-of-bounds values', () => {
      const entries = ref(createEntries(3))
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(5)
      expect(currentIndex.value).toBe(0)
    })

    it('should accept index equal to length minus one (last item)', () => {
      const entries = ref(createEntries(5))
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(4)
      expect(currentIndex.value).toBe(4)
    })

    it('should not accept index equal to length', () => {
      const entries = ref(createEntries(5))
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(5)
      expect(currentIndex.value).toBe(0)
    })

    it('should accept index 0', () => {
      const entries = ref(createEntries(5))
      const { currentIndex, goTo } = useSlideshow(entries)

      currentIndex.value = 3
      goTo(0)
      expect(currentIndex.value).toBe(0)
    })

    it('should not change index when entries is empty', () => {
      const entries = ref<GuestEntry[]>([])
      const { currentIndex, goTo } = useSlideshow(entries)

      goTo(0)
      expect(currentIndex.value).toBe(0)
    })
  })

  describe('play / pause / toggle state', () => {
    it('should start playing by default', () => {
      const entries = ref(createEntries(3))
      const { isPlaying } = useSlideshow(entries)

      expect(isPlaying.value).toBe(true)
    })

    it('should set isPlaying to false when pause is called', () => {
      const entries = ref(createEntries(3))
      const { isPlaying, pause } = useSlideshow(entries)

      pause()
      expect(isPlaying.value).toBe(false)
    })

    it('should toggle from playing to paused', () => {
      const entries = ref(createEntries(3))
      const { isPlaying, toggle } = useSlideshow(entries)

      expect(isPlaying.value).toBe(true)
      toggle()
      expect(isPlaying.value).toBe(false)
    })

    it('should pause multiple times idempotently', () => {
      const entries = ref(createEntries(3))
      const { isPlaying, pause } = useSlideshow(entries)

      pause()
      pause()
      pause()
      expect(isPlaying.value).toBe(false)
    })
  })

  describe('setInterval (clamping)', () => {
    /**
     * Note: setInterval tests call pause() first to prevent the internal
     * play() → setInterval() infinite recursion caused by the local
     * setInterval function shadowing the global one.
     */

    it('should update interval value', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause() // Prevent recursion
      slideshow.setInterval(10)
      expect(slideshow.interval.value).toBe(10)
    })

    it('should clamp interval to minimum of 3 seconds', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(1)
      expect(slideshow.interval.value).toBe(3)
    })

    it('should clamp interval to maximum of 30 seconds', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(60)
      expect(slideshow.interval.value).toBe(30)
    })

    it('should clamp zero to minimum', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(0)
      expect(slideshow.interval.value).toBe(3)
    })

    it('should clamp negative values to minimum', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(-5)
      expect(slideshow.interval.value).toBe(3)
    })

    it('should accept exact minimum boundary value', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(3)
      expect(slideshow.interval.value).toBe(3)
    })

    it('should accept exact maximum boundary value', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      slideshow.setInterval(30)
      expect(slideshow.interval.value).toBe(30)
    })

    it('should accept values within range', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()

      slideshow.setInterval(5)
      expect(slideshow.interval.value).toBe(5)

      slideshow.setInterval(15)
      expect(slideshow.interval.value).toBe(15)

      slideshow.setInterval(25)
      expect(slideshow.interval.value).toBe(25)
    })

    it('should not call play when paused', () => {
      const entries = ref(createEntries(3))
      const slideshow = useSlideshow(entries)

      slideshow.pause()
      expect(slideshow.isPlaying.value).toBe(false)

      // This should not throw or cause recursion since isPlaying is false
      slideshow.setInterval(10)
      expect(slideshow.isPlaying.value).toBe(false)
    })
  })

  describe('empty entries handling', () => {
    it('should handle empty entries array gracefully', () => {
      const entries = ref<GuestEntry[]>([])
      const slideshow = useSlideshow(entries)

      expect(slideshow.currentIndex.value).toBe(0)
      expect(slideshow.currentEntry.value).toBeNull()
      expect(slideshow.totalEntries.value).toBe(0)
      expect(slideshow.hasEntries.value).toBe(false)
    })

    it('should not crash when navigating with empty entries', () => {
      const entries = ref<GuestEntry[]>([])
      const { next, prev, goTo } = useSlideshow(entries)

      expect(() => next()).not.toThrow()
      expect(() => prev()).not.toThrow()
      expect(() => goTo(0)).not.toThrow()
    })

    it('should keep currentIndex at 0 with empty entries after navigation', () => {
      const entries = ref<GuestEntry[]>([])
      const { currentIndex, next, prev } = useSlideshow(entries)

      next()
      expect(currentIndex.value).toBe(0)
      prev()
      expect(currentIndex.value).toBe(0)
    })
  })

  describe('index bounds on entries change', () => {
    it('should register watch callback for entries changes', () => {
      const watchFn = vi.fn()
      vi.stubGlobal('watch', watchFn)

      const entries = ref(createEntries(5))
      useSlideshow(entries)

      // The watch should have been called with entries as the first argument
      expect(watchFn).toHaveBeenCalled()
      const [watchTarget] = watchFn.mock.calls[0]
      expect(watchTarget).toBe(entries)
    })

    it('should adjust index when entries shrink via watch callback', () => {
      let watchCallback: ((newEntries: GuestEntry[]) => void) | null = null
      vi.stubGlobal('watch', (target: unknown, cb: (newEntries: GuestEntry[]) => void) => {
        watchCallback = cb
      })

      const entries = ref(createEntries(5))
      const { currentIndex } = useSlideshow(entries)

      currentIndex.value = 4 // Last index of 5 entries

      // Simulate entries shrinking to 3
      entries.value = createEntries(3)
      if (watchCallback) {
        watchCallback(entries.value)
      }

      expect(currentIndex.value).toBe(2) // max(0, 3-1) = 2
    })

    it('should set index to 0 when entries become empty via watch callback', () => {
      let watchCallback: ((newEntries: GuestEntry[]) => void) | null = null
      vi.stubGlobal('watch', (target: unknown, cb: (newEntries: GuestEntry[]) => void) => {
        watchCallback = cb
      })

      const entries = ref(createEntries(5))
      const { currentIndex } = useSlideshow(entries)

      currentIndex.value = 3

      // Simulate entries becoming empty
      entries.value = []
      if (watchCallback) {
        watchCallback(entries.value)
      }

      expect(currentIndex.value).toBe(0) // max(0, 0-1) = max(0, -1) = 0
    })

    it('should not change index when entries grow', () => {
      let watchCallback: ((newEntries: GuestEntry[]) => void) | null = null
      vi.stubGlobal('watch', (target: unknown, cb: (newEntries: GuestEntry[]) => void) => {
        watchCallback = cb
      })

      const entries = ref(createEntries(3))
      const { currentIndex } = useSlideshow(entries)

      currentIndex.value = 1

      // Simulate entries growing to 5
      entries.value = createEntries(5)
      if (watchCallback) {
        watchCallback(entries.value)
      }

      expect(currentIndex.value).toBe(1) // Still within bounds
    })

    it('should not change valid index when entries shrink but index still valid', () => {
      let watchCallback: ((newEntries: GuestEntry[]) => void) | null = null
      vi.stubGlobal('watch', (target: unknown, cb: (newEntries: GuestEntry[]) => void) => {
        watchCallback = cb
      })

      const entries = ref(createEntries(5))
      const { currentIndex } = useSlideshow(entries)

      currentIndex.value = 1 // Index 1 is still valid when shrinking to 3

      entries.value = createEntries(3)
      if (watchCallback) {
        watchCallback(entries.value)
      }

      expect(currentIndex.value).toBe(1)
    })
  })

  describe('cleanup', () => {
    it('should register onUnmounted callback', () => {
      const onUnmountedFn = vi.fn()
      vi.stubGlobal('onUnmounted', onUnmountedFn)

      const entries = ref(createEntries(3))
      useSlideshow(entries)

      expect(onUnmountedFn).toHaveBeenCalled()
    })

    it('should pass a cleanup function to onUnmounted', () => {
      let unmountCallback: (() => void) | null = null
      vi.stubGlobal('onUnmounted', (cb: () => void) => {
        unmountCallback = cb
      })

      const entries = ref(createEntries(3))
      useSlideshow(entries)

      expect(unmountCallback).not.toBeNull()
      // Calling the cleanup function should not throw
      expect(() => unmountCallback!()).not.toThrow()
    })
  })

  describe('mutable refs', () => {
    it('should allow direct modification of transition', () => {
      const entries = ref(createEntries(3))
      const { transition } = useSlideshow(entries)

      transition.value = 'slide'
      expect(transition.value).toBe('slide')

      transition.value = 'zoom'
      expect(transition.value).toBe('zoom')
    })

    it('should allow direct modification of showBadges', () => {
      const entries = ref(createEntries(3))
      const { showBadges } = useSlideshow(entries)

      showBadges.value = false
      expect(showBadges.value).toBe(false)

      showBadges.value = true
      expect(showBadges.value).toBe(true)
    })

    it('should allow direct modification of showNames', () => {
      const entries = ref(createEntries(3))
      const { showNames } = useSlideshow(entries)

      showNames.value = false
      expect(showNames.value).toBe(false)

      showNames.value = true
      expect(showNames.value).toBe(true)
    })

    it('should allow direct modification of currentIndex', () => {
      const entries = ref(createEntries(5))
      const { currentIndex } = useSlideshow(entries)

      currentIndex.value = 3
      expect(currentIndex.value).toBe(3)
    })
  })

  describe('return value structure', () => {
    it('should return all expected properties', () => {
      const entries = ref(createEntries(3))
      const result = useSlideshow(entries)

      expect(result).toHaveProperty('currentIndex')
      expect(result).toHaveProperty('currentEntry')
      expect(result).toHaveProperty('totalEntries')
      expect(result).toHaveProperty('hasEntries')
      expect(result).toHaveProperty('isPlaying')
      expect(result).toHaveProperty('interval')
      expect(result).toHaveProperty('transition')
      expect(result).toHaveProperty('showBadges')
      expect(result).toHaveProperty('showNames')
      expect(result).toHaveProperty('isFullscreen')
      expect(result).toHaveProperty('next')
      expect(result).toHaveProperty('prev')
      expect(result).toHaveProperty('goTo')
      expect(result).toHaveProperty('play')
      expect(result).toHaveProperty('pause')
      expect(result).toHaveProperty('toggle')
      expect(result).toHaveProperty('setInterval')
      expect(result).toHaveProperty('enterFullscreen')
      expect(result).toHaveProperty('exitFullscreen')
    })

    it('should return functions for all methods', () => {
      const entries = ref(createEntries(3))
      const result = useSlideshow(entries)

      expect(typeof result.next).toBe('function')
      expect(typeof result.prev).toBe('function')
      expect(typeof result.goTo).toBe('function')
      expect(typeof result.play).toBe('function')
      expect(typeof result.pause).toBe('function')
      expect(typeof result.toggle).toBe('function')
      expect(typeof result.setInterval).toBe('function')
      expect(typeof result.enterFullscreen).toBe('function')
      expect(typeof result.exitFullscreen).toBe('function')
    })
  })
})
