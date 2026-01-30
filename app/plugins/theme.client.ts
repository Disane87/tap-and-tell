/**
 * Client-only plugin that initializes the theme system before component mount.
 * This is layer 2 of the three-layer theme initialization:
 * 1. Inline script in <head> (nuxt.config.ts) — prevents FOUC
 * 2. This plugin — syncs reactive state
 * 3. <ClientOnly> wrappers — prevents SSR of theme-dependent UI
 */
export default defineNuxtPlugin(() => {
  const { initTheme } = useTheme()
  initTheme()
})
