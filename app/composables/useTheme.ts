/** Supported theme modes. */
export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

// Use a simple reactive ref shared across the app (not useState, which
// serializes into the Nuxt SSR payload and causes hydration mismatches
// when the client reads a different value from localStorage).
const theme = ref<Theme>('system')
const isDark = ref(false)
let initialized = false

/**
 * Applies or removes the `dark` CSS class on `<html>`.
 * @param dark - Whether dark mode should be active.
 */
function applyDarkClass(dark: boolean) {
  if (import.meta.server) return
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Resolves whether dark mode is active for the given theme preference.
 * For `'system'`, delegates to the OS `prefers-color-scheme` media query.
 * @param t - The theme preference to resolve.
 * @returns `true` when the resolved appearance is dark.
 */
function resolveDark(t: Theme): boolean {
  if (import.meta.server) return false
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return t === 'dark'
}

/**
 * Composable for managing the application color theme (light / dark / system).
 *
 * Uses a module-level `ref` (not `useState`) to avoid SSR hydration mismatches.
 * Theme preference is persisted in `localStorage`.
 *
 * @returns Reactive theme state and control functions.
 */
export function useTheme() {
  /**
   * Sets the active theme, updates the DOM, and persists to localStorage.
   * @param newTheme - The theme to activate.
   */
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    isDark.value = resolveDark(newTheme)
    applyDarkClass(isDark.value)

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, newTheme)
    }
  }

  /** Cycles the theme: light → dark → system → light. */
  function toggleTheme() {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  /**
   * Initialises theme state from localStorage and registers a system-preference listener.
   * Safe to call multiple times — only the first invocation takes effect.
   * Must run on the client (no-ops on the server).
   */
  function initTheme() {
    if (import.meta.server || initialized) return
    initialized = true

    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored
    }

    isDark.value = resolveDark(theme.value)
    applyDarkClass(isDark.value)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        isDark.value = resolveDark('system')
        applyDarkClass(isDark.value)
      }
    })
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme,
    initTheme
  }
}
