/**
 * Unit tests for useCookieConsent composable.
 *
 * Tests cookie consent state management, localStorage persistence,
 * banner/settings visibility, and consent category checking.
 *
 * Note: useCookieConsent uses module-level state (singleton pattern),
 * so we reset modules between describe blocks where fresh state is needed.
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

// Mock sessionStorage
let sessionStorageStore: Record<string, string> = {}
const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageStore[key]
  }),
  clear: vi.fn(() => {
    sessionStorageStore = {}
  })
}
vi.stubGlobal('sessionStorage', mockSessionStorage)

// Mock window
vi.stubGlobal('window', globalThis)

describe('useCookieConsent', () => {
  let useCookieConsent: typeof import('../useCookieConsent')['useCookieConsent']

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageStore = {}
    sessionStorageStore = {}

    // Reset modules to get fresh module-level state
    vi.resetModules()

    // Re-stub globals after module reset
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('readonly', readonly)
    vi.stubGlobal('localStorage', mockLocalStorage)
    vi.stubGlobal('sessionStorage', mockSessionStorage)
    vi.stubGlobal('window', globalThis)

    const module = await import('../useCookieConsent')
    useCookieConsent = module.useCookieConsent
  })

  describe('init', () => {
    it('should show banner when no stored consent', () => {
      const { init, showBanner, consent } = useCookieConsent()

      init()

      expect(showBanner.value).toBe(true)
      expect(consent.value).toBeNull()
    })

    it('should hide banner when consent is stored', () => {
      const storedConsent = {
        necessary: true,
        functional: true,
        analytics: false,
        timestamp: '2024-01-01T00:00:00Z',
        version: 1
      }
      localStorageStore['cookie_consent'] = JSON.stringify(storedConsent)

      const { init, showBanner, consent } = useCookieConsent()

      init()

      expect(showBanner.value).toBe(false)
      expect(consent.value).toEqual(storedConsent)
    })

    it('should show banner when stored consent has wrong version', () => {
      const storedConsent = {
        necessary: true,
        functional: true,
        analytics: false,
        timestamp: '2024-01-01T00:00:00Z',
        version: 99 // Wrong version
      }
      localStorageStore['cookie_consent'] = JSON.stringify(storedConsent)

      const { init, showBanner, consent } = useCookieConsent()

      init()

      expect(showBanner.value).toBe(true)
      expect(consent.value).toBeNull()
    })

    it('should show banner when stored consent is invalid JSON', () => {
      localStorageStore['cookie_consent'] = 'not-valid-json'

      const { init, showBanner, consent } = useCookieConsent()

      init()

      expect(showBanner.value).toBe(true)
      expect(consent.value).toBeNull()
    })
  })

  describe('acceptAll', () => {
    it('should set all categories to true', () => {
      const { acceptAll, consent } = useCookieConsent()

      acceptAll()

      expect(consent.value).not.toBeNull()
      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(true)
      expect(consent.value!.analytics).toBe(true)
    })

    it('should hide banner and settings', () => {
      const { init, acceptAll, showBanner, showSettings, openSettings } = useCookieConsent()

      init()
      openSettings()
      expect(showBanner.value).toBe(true)
      expect(showSettings.value).toBe(true)

      acceptAll()

      expect(showBanner.value).toBe(false)
      expect(showSettings.value).toBe(false)
    })

    it('should persist consent to localStorage', () => {
      const { acceptAll } = useCookieConsent()

      acceptAll()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        expect.any(String)
      )

      const stored = JSON.parse(localStorageStore['cookie_consent'])
      expect(stored.necessary).toBe(true)
      expect(stored.functional).toBe(true)
      expect(stored.analytics).toBe(true)
      expect(stored.version).toBe(1)
      expect(stored.timestamp).toBeDefined()
    })
  })

  describe('acceptNecessary', () => {
    it('should set only necessary to true', () => {
      const { acceptNecessary, consent } = useCookieConsent()

      acceptNecessary()

      expect(consent.value).not.toBeNull()
      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(false)
      expect(consent.value!.analytics).toBe(false)
    })

    it('should hide banner and settings', () => {
      const { init, acceptNecessary, showBanner, showSettings } = useCookieConsent()

      init()
      expect(showBanner.value).toBe(true)

      acceptNecessary()

      expect(showBanner.value).toBe(false)
      expect(showSettings.value).toBe(false)
    })

    it('should persist consent to localStorage', () => {
      const { acceptNecessary } = useCookieConsent()

      acceptNecessary()

      const stored = JSON.parse(localStorageStore['cookie_consent'])
      expect(stored.necessary).toBe(true)
      expect(stored.functional).toBe(false)
      expect(stored.analytics).toBe(false)
    })

    it('should clear non-consented data', () => {
      localStorageStore['tap_analytics_visitor'] = 'visitor-id'
      sessionStorageStore['tap_analytics_session'] = 'session-id'
      localStorageStore['theme'] = 'dark'

      const { acceptNecessary } = useCookieConsent()

      acceptNecessary()

      // Analytics data should be cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tap_analytics_visitor')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('tap_analytics_session')
      // Theme data should be cleared (functional not consented)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('theme')
    })
  })

  describe('savePreferences', () => {
    it('should save custom preferences with functional only', () => {
      const { savePreferences, consent } = useCookieConsent()

      savePreferences({ functional: true, analytics: false })

      expect(consent.value).not.toBeNull()
      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(true)
      expect(consent.value!.analytics).toBe(false)
    })

    it('should save custom preferences with analytics only', () => {
      const { savePreferences, consent } = useCookieConsent()

      savePreferences({ functional: false, analytics: true })

      expect(consent.value).not.toBeNull()
      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(false)
      expect(consent.value!.analytics).toBe(true)
    })

    it('should save custom preferences with both enabled', () => {
      const { savePreferences, consent } = useCookieConsent()

      savePreferences({ functional: true, analytics: true })

      expect(consent.value!.functional).toBe(true)
      expect(consent.value!.analytics).toBe(true)
    })

    it('should default to false when preferences are not specified', () => {
      const { savePreferences, consent } = useCookieConsent()

      savePreferences({})

      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(false)
      expect(consent.value!.analytics).toBe(false)
    })

    it('should always keep necessary as true', () => {
      const { savePreferences, consent } = useCookieConsent()

      savePreferences({ functional: false, analytics: false })

      expect(consent.value!.necessary).toBe(true)
    })

    it('should hide banner and settings', () => {
      const { init, savePreferences, showBanner, showSettings, openSettings } = useCookieConsent()

      init()
      openSettings()

      savePreferences({ functional: true })

      expect(showBanner.value).toBe(false)
      expect(showSettings.value).toBe(false)
    })

    it('should persist to localStorage', () => {
      const { savePreferences } = useCookieConsent()

      savePreferences({ functional: true, analytics: false })

      const stored = JSON.parse(localStorageStore['cookie_consent'])
      expect(stored.functional).toBe(true)
      expect(stored.analytics).toBe(false)
    })

    it('should clear non-consented data when analytics disabled', () => {
      localStorageStore['tap_analytics_visitor'] = 'visitor-id'

      const { savePreferences } = useCookieConsent()

      savePreferences({ functional: true, analytics: false })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tap_analytics_visitor')
    })

    it('should not clear analytics data when analytics is consented', () => {
      localStorageStore['tap_analytics_visitor'] = 'visitor-id'

      const { savePreferences } = useCookieConsent()

      savePreferences({ functional: true, analytics: true })

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('tap_analytics_visitor')
    })
  })

  describe('hasConsent', () => {
    it('should return true for necessary even without consent', () => {
      const { hasConsent } = useCookieConsent()

      // No consent has been given yet (consent is null)
      expect(hasConsent('necessary')).toBe(true)
    })

    it('should return false for functional without consent', () => {
      const { hasConsent } = useCookieConsent()

      expect(hasConsent('functional')).toBe(false)
    })

    it('should return false for analytics without consent', () => {
      const { hasConsent } = useCookieConsent()

      expect(hasConsent('analytics')).toBe(false)
    })

    it('should return true for all categories after acceptAll', () => {
      const { acceptAll, hasConsent } = useCookieConsent()

      acceptAll()

      expect(hasConsent('necessary')).toBe(true)
      expect(hasConsent('functional')).toBe(true)
      expect(hasConsent('analytics')).toBe(true)
    })

    it('should return correct values after acceptNecessary', () => {
      const { acceptNecessary, hasConsent } = useCookieConsent()

      acceptNecessary()

      expect(hasConsent('necessary')).toBe(true)
      expect(hasConsent('functional')).toBe(false)
      expect(hasConsent('analytics')).toBe(false)
    })

    it('should return correct values after savePreferences', () => {
      const { savePreferences, hasConsent } = useCookieConsent()

      savePreferences({ functional: true, analytics: false })

      expect(hasConsent('necessary')).toBe(true)
      expect(hasConsent('functional')).toBe(true)
      expect(hasConsent('analytics')).toBe(false)
    })
  })

  describe('hasInteracted', () => {
    it('should return false before any consent action', () => {
      const { hasInteracted } = useCookieConsent()

      expect(hasInteracted()).toBe(false)
    })

    it('should return true after acceptAll', () => {
      const { acceptAll, hasInteracted } = useCookieConsent()

      acceptAll()

      expect(hasInteracted()).toBe(true)
    })

    it('should return true after acceptNecessary', () => {
      const { acceptNecessary, hasInteracted } = useCookieConsent()

      acceptNecessary()

      expect(hasInteracted()).toBe(true)
    })

    it('should return true after savePreferences', () => {
      const { savePreferences, hasInteracted } = useCookieConsent()

      savePreferences({ functional: true })

      expect(hasInteracted()).toBe(true)
    })

    it('should return true after init with stored consent', () => {
      const storedConsent = {
        necessary: true,
        functional: false,
        analytics: false,
        timestamp: '2024-01-01T00:00:00Z',
        version: 1
      }
      localStorageStore['cookie_consent'] = JSON.stringify(storedConsent)

      const { init, hasInteracted } = useCookieConsent()

      init()

      expect(hasInteracted()).toBe(true)
    })
  })

  describe('revokeConsent', () => {
    it('should reset consent to necessary-only', () => {
      const { acceptAll, revokeConsent, consent } = useCookieConsent()

      acceptAll()
      expect(consent.value!.functional).toBe(true)
      expect(consent.value!.analytics).toBe(true)

      revokeConsent()

      expect(consent.value!.necessary).toBe(true)
      expect(consent.value!.functional).toBe(false)
      expect(consent.value!.analytics).toBe(false)
    })

    it('should show banner again after revoking', () => {
      const { acceptAll, revokeConsent, showBanner } = useCookieConsent()

      acceptAll()
      expect(showBanner.value).toBe(false)

      revokeConsent()

      expect(showBanner.value).toBe(true)
    })

    it('should persist revoked consent to localStorage', () => {
      const { acceptAll, revokeConsent } = useCookieConsent()

      acceptAll()
      revokeConsent()

      const stored = JSON.parse(localStorageStore['cookie_consent'])
      expect(stored.necessary).toBe(true)
      expect(stored.functional).toBe(false)
      expect(stored.analytics).toBe(false)
    })

    it('should clear non-consented data on revoke', () => {
      localStorageStore['tap_analytics_visitor'] = 'visitor-id'
      localStorageStore['theme'] = 'dark'

      const { acceptAll, revokeConsent } = useCookieConsent()

      acceptAll()
      revokeConsent()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tap_analytics_visitor')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('theme')
    })

    it('should still report hasInteracted as true after revoke', () => {
      const { acceptAll, revokeConsent, hasInteracted } = useCookieConsent()

      acceptAll()
      revokeConsent()

      // After revoking, consent is reset to necessary-only (not null)
      expect(hasInteracted()).toBe(true)
    })
  })

  describe('openSettings / closeSettings', () => {
    it('should open settings dialog', () => {
      const { openSettings, showSettings } = useCookieConsent()

      expect(showSettings.value).toBe(false)

      openSettings()

      expect(showSettings.value).toBe(true)
    })

    it('should close settings dialog', () => {
      const { openSettings, closeSettings, showSettings } = useCookieConsent()

      openSettings()
      expect(showSettings.value).toBe(true)

      closeSettings()

      expect(showSettings.value).toBe(false)
    })

    it('should toggle settings independently from banner', () => {
      const { init, openSettings, showBanner, showSettings } = useCookieConsent()

      init()
      expect(showBanner.value).toBe(true)

      openSettings()

      expect(showBanner.value).toBe(true)
      expect(showSettings.value).toBe(true)
    })
  })

  describe('consent readonly', () => {
    it('should return consent as readonly ref', () => {
      const { consent } = useCookieConsent()

      // The consent ref should exist and be accessible
      expect(consent).toBeDefined()
      expect(consent.value).toBeNull()
    })
  })

  describe('return value structure', () => {
    it('should return all expected properties and methods', () => {
      const result = useCookieConsent()

      expect(result).toHaveProperty('consent')
      expect(result).toHaveProperty('showBanner')
      expect(result).toHaveProperty('showSettings')
      expect(result).toHaveProperty('init')
      expect(result).toHaveProperty('acceptAll')
      expect(result).toHaveProperty('acceptNecessary')
      expect(result).toHaveProperty('savePreferences')
      expect(result).toHaveProperty('openSettings')
      expect(result).toHaveProperty('closeSettings')
      expect(result).toHaveProperty('hasConsent')
      expect(result).toHaveProperty('hasInteracted')
      expect(result).toHaveProperty('revokeConsent')
    })
  })
})
