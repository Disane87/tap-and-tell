/**
 * Theme mode options.
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Module-level state for theme.
 * Uses plain ref to avoid SSR hydration issues with useState.
 */
const theme = ref<ThemeMode>('system')
const isDark = ref(false)

/**
 * Composable for managing the application theme.
 *
 * Supports light, dark, and system preference modes.
 * Persists preference to localStorage.
 * Uses three-layer initialization to prevent FOUC:
 * 1. Inline script in head (nuxt.config.ts)
 * 2. This composable syncs state on client
 * 3. ClientOnly wrapper on ThemeToggle
 *
 * @returns Theme state and setter.
 */
export function useTheme() {
  /**
   * Applies the dark class to the document based on current settings.
   */
  function applyTheme(): void {
    if (import.meta.server) return

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = theme.value === 'dark' || (theme.value === 'system' && prefersDark)

    isDark.value = shouldBeDark

    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * Sets the theme mode and persists to localStorage if functional cookies are consented.
   *
   * @param mode - The theme mode to set.
   */
  function setTheme(mode: ThemeMode): void {
    theme.value = mode
    if (import.meta.client) {
      // Only persist to localStorage if functional cookies are consented
      const { hasConsent } = useCookieConsent()
      if (hasConsent('functional')) {
        localStorage.setItem('theme', mode)
      }
      applyTheme()
    }
  }

  /**
   * Cycles through theme modes: light -> dark -> system -> light
   */
  function cycleTheme(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setTheme(modes[nextIndex])
  }

  /**
   * Initializes theme from localStorage and sets up system preference listener.
   * Should be called once on client mount.
   */
  function initTheme(): void {
    if (import.meta.server) return

    // Read from localStorage
    const stored = localStorage.getItem('theme') as ThemeMode | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored
    }

    // Apply immediately
    applyTheme()

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme()
      }
    })
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    cycleTheme,
    initTheme
  }
}
