import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

/**
 * Mock Vue auto-imports for Nuxt
 */
vi.stubGlobal('ref', ref)
vi.stubGlobal('onUnmounted', vi.fn())

/**
 * Mock document.documentElement.classList
 */
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn().mockReturnValue(false)
}

// Mock document
vi.stubGlobal('document', {
  documentElement: {
    classList: mockClassList
  }
})

// Mock localStorage
const mockLocalStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key] })
})

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockReturnValue({ matches: false })
vi.stubGlobal('window', {
  matchMedia: mockMatchMedia
})

// Import after mocks
import { useForcedColorScheme } from '../useForcedColorScheme'

/**
 * Unit tests for useForcedColorScheme composable.
 * Tests applying and restoring forced color schemes on guest-facing pages.
 */
describe('useForcedColorScheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClassList.contains.mockReturnValue(false)
    mockMatchMedia.mockReturnValue({ matches: false })
    // Clear localStorage mock
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('apply', () => {
    it('should do nothing when scheme is undefined', () => {
      const { apply } = useForcedColorScheme()
      apply(undefined)

      expect(mockClassList.add).not.toHaveBeenCalled()
      expect(mockClassList.remove).not.toHaveBeenCalled()
    })

    it('should do nothing when scheme is system', () => {
      const { apply } = useForcedColorScheme()
      apply('system')

      expect(mockClassList.add).not.toHaveBeenCalled()
      expect(mockClassList.remove).not.toHaveBeenCalled()
    })

    it('should add dark class when scheme is dark', () => {
      const { apply } = useForcedColorScheme()
      apply('dark')

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class when scheme is light', () => {
      const { apply } = useForcedColorScheme()
      apply('light')

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should store original scheme as light when not in dark mode', () => {
      mockClassList.contains.mockReturnValue(false)

      const { apply, restore } = useForcedColorScheme()
      apply('dark')

      // originalScheme should be 'light' since dark class was not present
      expect(mockClassList.contains).toHaveBeenCalledWith('dark')
    })

    it('should store original scheme as dark when in dark mode', () => {
      mockClassList.contains.mockReturnValue(true)

      const { apply } = useForcedColorScheme()
      apply('light')

      expect(mockClassList.contains).toHaveBeenCalledWith('dark')
    })

    it('should only store original scheme on first apply call', () => {
      mockClassList.contains.mockReturnValue(false)

      const { apply } = useForcedColorScheme()
      apply('dark')
      // Reset mock to track second call
      mockClassList.contains.mockClear()

      apply('light')
      // contains should not be called again since originalScheme was already set
      expect(mockClassList.contains).not.toHaveBeenCalled()
    })
  })

  describe('restore', () => {
    it('should do nothing if apply was never called', () => {
      const { restore } = useForcedColorScheme()
      restore()

      expect(mockClassList.add).not.toHaveBeenCalled()
      expect(mockClassList.remove).not.toHaveBeenCalled()
    })

    it('should restore dark theme when stored preference is dark', () => {
      mockLocalStorage['theme'] = 'dark'

      const { apply, restore } = useForcedColorScheme()
      apply('light') // Force light
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should restore light theme when stored preference is light', () => {
      mockLocalStorage['theme'] = 'light'

      const { apply, restore } = useForcedColorScheme()
      apply('dark') // Force dark
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should add dark class when stored preference is system and system prefers dark', () => {
      mockLocalStorage['theme'] = 'system'
      mockMatchMedia.mockReturnValue({ matches: true })

      const { apply, restore } = useForcedColorScheme()
      apply('light')
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class when stored preference is system and system prefers light', () => {
      mockLocalStorage['theme'] = 'system'
      mockMatchMedia.mockReturnValue({ matches: false })

      const { apply, restore } = useForcedColorScheme()
      apply('dark')
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should use system preference when no stored theme exists', () => {
      // No theme in localStorage
      mockMatchMedia.mockReturnValue({ matches: true })

      const { apply, restore } = useForcedColorScheme()
      apply('light')
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class when no stored theme and system prefers light', () => {
      // No theme in localStorage
      mockMatchMedia.mockReturnValue({ matches: false })

      const { apply, restore } = useForcedColorScheme()
      apply('dark')
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should reset original scheme to null after restore', () => {
      const { apply, restore } = useForcedColorScheme()
      apply('dark')
      restore()

      // Second restore should do nothing since originalScheme is null
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      restore()
      expect(mockClassList.add).not.toHaveBeenCalled()
      expect(mockClassList.remove).not.toHaveBeenCalled()
    })
  })

  describe('onUnmounted', () => {
    it('should register onUnmounted callback', () => {
      const mockOnUnmounted = vi.fn()
      vi.stubGlobal('onUnmounted', mockOnUnmounted)

      useForcedColorScheme()

      expect(mockOnUnmounted).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should call restore when unmounted callback is invoked', () => {
      let unmountCallback: () => void = () => {}
      const mockOnUnmounted = vi.fn((cb: () => void) => { unmountCallback = cb })
      vi.stubGlobal('onUnmounted', mockOnUnmounted)

      const { apply } = useForcedColorScheme()
      apply('dark')

      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      // Simulate component unmount
      unmountCallback()

      // restore() should have been called, which interacts with classList
      // Since no localStorage theme is set, it falls through to system preference
      expect(mockMatchMedia).toHaveBeenCalled()
    })
  })

  describe('apply and restore cycle', () => {
    it('should correctly round-trip from light to dark and back', () => {
      mockClassList.contains.mockReturnValue(false) // currently light
      mockLocalStorage['theme'] = 'light'

      const { apply, restore } = useForcedColorScheme()

      // Force dark
      apply('dark')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')

      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      // Restore to light
      restore()
      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should correctly round-trip from dark to light and back', () => {
      mockClassList.contains.mockReturnValue(true) // currently dark
      mockLocalStorage['theme'] = 'dark'

      const { apply, restore } = useForcedColorScheme()

      // Force light
      apply('light')
      expect(mockClassList.remove).toHaveBeenCalledWith('dark')

      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      // Restore to dark
      restore()
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })
  })
})
