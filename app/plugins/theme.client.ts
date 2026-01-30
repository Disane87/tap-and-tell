/**
 * Client-only plugin to initialize theme state.
 *
 * Part of the three-layer theme initialization:
 * 1. Inline script in head (prevents FOUC)
 * 2. This plugin (syncs reactive state)
 * 3. ClientOnly wrapper on ThemeToggle
 */
export default defineNuxtPlugin(() => {
  const { initTheme } = useTheme()
  initTheme()
})
