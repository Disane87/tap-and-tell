/**
 * Composable for managing the Dawn (light) / Dusk (dark) / System theme.
 *
 * Uses a module-level `ref()` instead of `useState()` to avoid SSR payload
 * serialization and hydration mismatches when reading `localStorage`.
 *
 * @returns Reactive theme state and control methods.
 */

type ThemeMode = 'light' | 'dark' | 'system'

const theme = ref<ThemeMode>('system')
const isDark = ref(false)

/**
 * Resolves whether dark mode is active based on the current theme setting.
 * @param mode - The theme mode to resolve.
 * @returns `true` if dark mode should be applied.
 */
function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

/** Applies or removes the `dark` class on the document root element. */
function applyTheme(): void {
  if (typeof document === 'undefined') return
  isDark.value = resolveDark(theme.value)
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  /**
   * Sets the active theme mode and persists it to localStorage.
   * @param newTheme - The theme to apply.
   */
  function setTheme(newTheme: ThemeMode): void {
    theme.value = newTheme
    applyTheme()
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  /** Cycles through light → dark → system → light. */
  function toggleTheme(): void {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    const idx = order.indexOf(theme.value)
    setTheme(order[(idx + 1) % order.length])
  }

  /**
   * Initializes theme from localStorage and sets up a system preference listener.
   * Safe to call multiple times.
   */
  function initTheme(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme') as ThemeMode | null
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        theme.value = stored
      }
    }
    applyTheme()

    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (theme.value === 'system') applyTheme()
        })
    }
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme,
    initTheme
  }
}
