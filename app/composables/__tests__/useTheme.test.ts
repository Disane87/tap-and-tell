/**
 * Unit tests for useTheme composable.
 *
 * Tests theme state management, cycling, localStorage persistence,
 * dark class application, and system preference detection.
 *
 * Note: useTheme uses module-level state (singleton pattern),
 * so we reset modules between tests to get fresh state.
 *
 * import.meta.client and import.meta.server are Nuxt runtime flags.
 * They are defined via vitest.config.ts `define` option.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed, readonly } from 'vue'

// Mock Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

// Mock localStorage
let localStorageStore: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    localStorageStore = {}
  })
}
vi.stubGlobal('localStorage', mockLocalStorage)

// Mock document.documentElement.classList
const classListSet = new Set<string>()
const mockClassList = {
  add: vi.fn((cls: string) => classListSet.add(cls)),
  remove: vi.fn((cls: string) => classListSet.delete(cls)),
  contains: vi.fn((cls: string) => classListSet.has(cls))
}

vi.stubGlobal('document', {
  documentElement: {
    classList: mockClassList
  }
})

// Mock window.matchMedia
let prefersDark = false
const mockAddEventListener = vi.fn()
vi.stubGlobal('window', {
  matchMedia: vi.fn(() => ({
    matches: prefersDark,
    addEventListener: mockAddEventListener
  }))
})

// Mock useCookieConsent
let mockHasConsent = true
vi.stubGlobal('useCookieConsent', () => ({
  hasConsent: () => mockHasConsent
}))

describe('useTheme', () => {
  let useTheme: typeof import('../useTheme')['useTheme']

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageStore = {}
    classListSet.clear()
    prefersDark = false
    mockHasConsent = true

    // Reset modules to get fresh module-level state
    vi.resetModules()

    // Re-stub globals after module reset
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('readonly', readonly)
    vi.stubGlobal('localStorage', mockLocalStorage)
    vi.stubGlobal('document', {
      documentElement: {
        classList: mockClassList
      }
    })
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({
        matches: prefersDark,
        addEventListener: mockAddEventListener
      }))
    })
    vi.stubGlobal('useCookieConsent', () => ({
      hasConsent: () => mockHasConsent
    }))

    const module = await import('../useTheme')
    useTheme = module.useTheme
  })

  describe('initial state', () => {
    it('should default to system theme', () => {
      const { theme } = useTheme()

      expect(theme.value).toBe('system')
    })

    it('should default isDark to false', () => {
      const { isDark } = useTheme()

      expect(isDark.value).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const { theme, setTheme } = useTheme()

      setTheme('light')

      expect(theme.value).toBe('light')
    })

    it('should set theme to dark', () => {
      const { theme, setTheme } = useTheme()

      setTheme('dark')

      expect(theme.value).toBe('dark')
    })

    it('should set theme to system', () => {
      const { theme, setTheme } = useTheme()

      setTheme('dark')
      setTheme('system')

      expect(theme.value).toBe('system')
    })

    it('should persist to localStorage when functional cookies are consented', () => {
      mockHasConsent = true
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('should not persist to localStorage when functional cookies are not consented', () => {
      mockHasConsent = false
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('theme', 'dark')
    })
  })

  describe('applyTheme (via setTheme)', () => {
    it('should add dark class when theme is dark', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class when theme is light', () => {
      const { setTheme } = useTheme()

      setTheme('light')

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should add dark class when theme is system and system prefers dark', () => {
      prefersDark = true
      // Re-stub window.matchMedia to return updated prefersDark
      vi.stubGlobal('window', {
        matchMedia: vi.fn(() => ({
          matches: prefersDark,
          addEventListener: mockAddEventListener
        }))
      })

      const { setTheme } = useTheme()

      setTheme('system')

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class when theme is system and system prefers light', () => {
      prefersDark = false
      const { setTheme } = useTheme()

      setTheme('system')

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should update isDark to true when dark mode is applied', () => {
      const { setTheme, isDark } = useTheme()

      setTheme('dark')

      expect(isDark.value).toBe(true)
    })

    it('should update isDark to false when light mode is applied', () => {
      const { setTheme, isDark } = useTheme()

      setTheme('dark')
      expect(isDark.value).toBe(true)

      setTheme('light')
      expect(isDark.value).toBe(false)
    })

    it('should update isDark based on system preference when theme is system', () => {
      prefersDark = true
      vi.stubGlobal('window', {
        matchMedia: vi.fn(() => ({
          matches: true,
          addEventListener: mockAddEventListener
        }))
      })

      const { setTheme, isDark } = useTheme()

      setTheme('system')

      expect(isDark.value).toBe(true)
    })
  })

  describe('cycleTheme', () => {
    it('should cycle from light to dark', () => {
      const { theme, setTheme, cycleTheme } = useTheme()

      setTheme('light')
      cycleTheme()

      expect(theme.value).toBe('dark')
    })

    it('should cycle from dark to system', () => {
      const { theme, setTheme, cycleTheme } = useTheme()

      setTheme('dark')
      cycleTheme()

      expect(theme.value).toBe('system')
    })

    it('should cycle from system to light', () => {
      const { theme, cycleTheme } = useTheme()

      // Default is system
      expect(theme.value).toBe('system')
      cycleTheme()

      expect(theme.value).toBe('light')
    })

    it('should complete a full cycle: light -> dark -> system -> light', () => {
      const { theme, setTheme, cycleTheme } = useTheme()

      setTheme('light')
      expect(theme.value).toBe('light')

      cycleTheme()
      expect(theme.value).toBe('dark')

      cycleTheme()
      expect(theme.value).toBe('system')

      cycleTheme()
      expect(theme.value).toBe('light')
    })

    it('should persist each cycle step to localStorage', () => {
      mockHasConsent = true
      const { setTheme, cycleTheme } = useTheme()

      setTheme('light')
      mockLocalStorage.setItem.mockClear()

      cycleTheme()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')

      mockLocalStorage.setItem.mockClear()
      cycleTheme()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'system')
    })
  })

  describe('initTheme', () => {
    it('should load theme from localStorage', () => {
      localStorageStore['theme'] = 'dark'

      const { theme, initTheme } = useTheme()

      initTheme()

      expect(theme.value).toBe('dark')
    })

    it('should apply theme after loading', () => {
      localStorageStore['theme'] = 'dark'

      const { initTheme } = useTheme()

      initTheme()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should keep default system theme when localStorage is empty', () => {
      const { theme, initTheme } = useTheme()

      initTheme()

      expect(theme.value).toBe('system')
    })

    it('should ignore invalid localStorage values', () => {
      localStorageStore['theme'] = 'invalid-theme'

      const { theme, initTheme } = useTheme()

      initTheme()

      expect(theme.value).toBe('system')
    })

    it('should register system preference change listener', () => {
      const { initTheme } = useTheme()

      initTheme()

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should accept "light" from localStorage', () => {
      localStorageStore['theme'] = 'light'

      const { theme, initTheme } = useTheme()

      initTheme()

      expect(theme.value).toBe('light')
    })

    it('should accept "system" from localStorage', () => {
      localStorageStore['theme'] = 'system'

      const { theme, initTheme } = useTheme()

      initTheme()

      expect(theme.value).toBe('system')
    })

    it('should apply dark class when loading dark from localStorage', () => {
      localStorageStore['theme'] = 'dark'

      const { isDark, initTheme } = useTheme()

      initTheme()

      expect(isDark.value).toBe(true)
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should apply light when loading light from localStorage', () => {
      localStorageStore['theme'] = 'light'

      const { isDark, initTheme } = useTheme()

      initTheme()

      expect(isDark.value).toBe(false)
      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })
  })

  describe('system preference change listener', () => {
    it('should re-apply theme when system preference changes and theme is system', () => {
      const { initTheme } = useTheme()

      initTheme()

      // Get the registered change handler
      const changeHandler = mockAddEventListener.mock.calls[0]?.[1]
      expect(changeHandler).toBeDefined()

      // Simulate system switching to dark
      prefersDark = true
      vi.stubGlobal('window', {
        matchMedia: vi.fn(() => ({
          matches: true,
          addEventListener: mockAddEventListener
        }))
      })

      changeHandler()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should not re-apply theme when preference changes but theme is not system', () => {
      const { setTheme, initTheme } = useTheme()

      initTheme()
      setTheme('light')

      // Clear mocks to check only new calls
      mockClassList.add.mockClear()
      mockClassList.remove.mockClear()

      // Get the registered change handler
      const changeHandler = mockAddEventListener.mock.calls[0]?.[1]
      expect(changeHandler).toBeDefined()

      // Simulate system switching to dark
      prefersDark = true
      vi.stubGlobal('window', {
        matchMedia: vi.fn(() => ({
          matches: true,
          addEventListener: mockAddEventListener
        }))
      })

      changeHandler()

      // Since theme is 'light', not 'system', it should not react to system change
      expect(mockClassList.add).not.toHaveBeenCalledWith('dark')
    })
  })

  describe('return value structure', () => {
    it('should return all expected properties', () => {
      const result = useTheme()

      expect(result).toHaveProperty('theme')
      expect(result).toHaveProperty('isDark')
      expect(result).toHaveProperty('setTheme')
      expect(result).toHaveProperty('cycleTheme')
      expect(result).toHaveProperty('initTheme')
    })

    it('should return readonly refs for theme and isDark', () => {
      const { theme, isDark } = useTheme()

      // Readonly refs should have .value
      expect(theme).toHaveProperty('value')
      expect(isDark).toHaveProperty('value')
    })
  })
})
