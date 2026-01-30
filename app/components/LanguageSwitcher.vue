<script setup lang="ts">
/**
 * Language switcher component for toggling between available locales.
 *
 * Displays current locale with a dropdown to select other languages.
 * Uses @nuxtjs/i18n for locale management.
 */
import { Globe } from 'lucide-vue-next'

const { locale, locales, setLocale } = useI18n()

/**
 * Available locales with their display names.
 */
const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    code: l.code,
    name: l.name
  }))
})

/**
 * Current locale display name.
 */
const currentLocaleName = computed(() => {
  const current = availableLocales.value.find(l => l.code === locale.value)
  return current?.name ?? locale.value.toUpperCase()
})

/**
 * Switches to the next available locale (toggles between EN and DE).
 */
function toggleLocale(): void {
  const nextLocale = locale.value === 'en' ? 'de' : 'en'
  setLocale(nextLocale)
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    :aria-label="`Switch language, current: ${currentLocaleName}`"
    @click="toggleLocale"
  >
    <Globe class="h-4 w-4" />
    <span class="font-medium">{{ locale.toUpperCase() }}</span>
  </button>
</template>
