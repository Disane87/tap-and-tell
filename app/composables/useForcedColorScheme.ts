/**
 * Composable to apply a forced color scheme on guest-facing pages.
 *
 * Overrides the user's theme preference for the duration of the page visit.
 * Restores the original preference on unmount.
 */
export function useForcedColorScheme() {
  const originalScheme = ref<string | null>(null)

  /**
   * Applies the forced color scheme.
   * @param scheme - 'system', 'light', 'dark', or undefined
   */
  function apply(scheme?: 'system' | 'light' | 'dark'): void {
    if (!scheme || scheme === 'system') return

    // Store original to restore later
    if (originalScheme.value === null) {
      originalScheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }

    // Apply forced scheme
    if (scheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * Restores the original color scheme.
   */
  function restore(): void {
    if (originalScheme.value === null) return

    // Get the user's stored preference
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null

    if (stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    originalScheme.value = null
  }

  onUnmounted(() => {
    restore()
  })

  return {
    apply,
    restore
  }
}
