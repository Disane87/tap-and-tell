<script setup lang="ts">
/**
 * Theme toggle button that cycles through light/dark/system modes.
 *
 * Must be wrapped in <ClientOnly> to prevent SSR hydration issues.
 */
import { Sun, Moon, Monitor } from 'lucide-vue-next'

const { theme, cycleTheme } = useTheme()

/**
 * Icon and label based on current theme.
 */
const themeInfo = computed(() => {
  switch (theme.value) {
    case 'light':
      return { icon: Sun, label: 'Light mode' }
    case 'dark':
      return { icon: Moon, label: 'Dark mode' }
    default:
      return { icon: Monitor, label: 'System theme' }
  }
})
</script>

<template>
  <button
    type="button"
    class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    :aria-label="themeInfo.label"
    :title="themeInfo.label"
    @click="cycleTheme"
  >
    <component :is="themeInfo.icon" class="h-5 w-5" />
  </button>
</template>
