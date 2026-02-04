/**
 * Cookie consent composable for GDPR-compliant cookie management.
 *
 * Categories:
 * - necessary: Always enabled (auth, CSRF, locale)
 * - functional: Theme preferences
 * - analytics: Visitor tracking, usage statistics
 *
 * Consent is stored in localStorage and checked before enabling non-essential features.
 */

export type CookieCategory = 'necessary' | 'functional' | 'analytics'

export interface CookieConsent {
  necessary: boolean // Always true
  functional: boolean
  analytics: boolean
  timestamp: string
  version: number
}

const CONSENT_KEY = 'cookie_consent'
const CONSENT_VERSION = 1

// Module-level state (singleton)
const consent = ref<CookieConsent | null>(null)
const showBanner = ref(false)
const showSettings = ref(false)

/**
 * Default consent state - only necessary cookies enabled
 */
function getDefaultConsent(): CookieConsent {
  return {
    necessary: true,
    functional: false,
    analytics: false,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION
  }
}

/**
 * Loads consent from localStorage
 */
function loadConsent(): CookieConsent | null {
  if (typeof localStorage === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as CookieConsent

    // Check version - if outdated, require new consent
    if (parsed.version !== CONSENT_VERSION) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * Saves consent to localStorage
 */
function saveConsent(newConsent: CookieConsent): void {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent))
  } catch {
    // localStorage not available
  }
}

/**
 * Clears non-consented data from storage
 */
function clearNonConsentedData(newConsent: CookieConsent): void {
  if (typeof localStorage === 'undefined') return

  // Clear analytics data if not consented
  if (!newConsent.analytics) {
    localStorage.removeItem('tap_analytics_visitor')
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('tap_analytics_session')
    }
  }

  // Clear theme if functional not consented
  if (!newConsent.functional) {
    localStorage.removeItem('theme')
  }
}

/**
 * Cookie consent composable
 */
export function useCookieConsent() {
  /**
   * Initializes consent state from localStorage
   */
  function init(): void {
    if (typeof window === 'undefined') return

    const stored = loadConsent()
    if (stored) {
      consent.value = stored
      showBanner.value = false
    } else {
      consent.value = null
      showBanner.value = true
    }
  }

  /**
   * Accepts all cookies
   */
  function acceptAll(): void {
    const newConsent: CookieConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    }
    consent.value = newConsent
    saveConsent(newConsent)
    showBanner.value = false
    showSettings.value = false
  }

  /**
   * Accepts only necessary cookies
   */
  function acceptNecessary(): void {
    const newConsent = getDefaultConsent()
    consent.value = newConsent
    saveConsent(newConsent)
    clearNonConsentedData(newConsent)
    showBanner.value = false
    showSettings.value = false
  }

  /**
   * Saves custom consent preferences
   */
  function savePreferences(preferences: Partial<Omit<CookieConsent, 'necessary' | 'timestamp' | 'version'>>): void {
    const newConsent: CookieConsent = {
      necessary: true,
      functional: preferences.functional ?? false,
      analytics: preferences.analytics ?? false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    }
    consent.value = newConsent
    saveConsent(newConsent)
    clearNonConsentedData(newConsent)
    showBanner.value = false
    showSettings.value = false
  }

  /**
   * Opens the settings dialog
   */
  function openSettings(): void {
    showSettings.value = true
  }

  /**
   * Closes the settings dialog
   */
  function closeSettings(): void {
    showSettings.value = false
  }

  /**
   * Checks if a specific category is consented
   */
  function hasConsent(category: CookieCategory): boolean {
    if (!consent.value) return category === 'necessary'
    return consent.value[category] ?? false
  }

  /**
   * Checks if any consent has been given (banner was dismissed)
   */
  function hasInteracted(): boolean {
    return consent.value !== null
  }

  /**
   * Revokes all consent and shows banner again
   */
  function revokeConsent(): void {
    const newConsent = getDefaultConsent()
    consent.value = newConsent
    saveConsent(newConsent)
    clearNonConsentedData(newConsent)
    showBanner.value = true
  }

  return {
    consent: readonly(consent),
    showBanner,
    showSettings,
    init,
    acceptAll,
    acceptNecessary,
    savePreferences,
    openSettings,
    closeSettings,
    hasConsent,
    hasInteracted,
    revokeConsent
  }
}
