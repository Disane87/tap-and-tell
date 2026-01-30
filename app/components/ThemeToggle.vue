<script setup lang="ts">
/**
 * Three-mode theme toggle: Light → Dark → System.
 * Cycles through modes on each click.
 * Wrapped in <ClientOnly> by the layout to prevent hydration mismatch.
 */
import { Sun, Moon, Monitor } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()

const icon = computed(() => {
  switch (theme.value) {
    case 'light': return Sun
    case 'dark': return Moon
    default: return Monitor
  }
})

const label = computed(() => {
  switch (theme.value) {
    case 'light': return 'Switch to dark mode'
    case 'dark': return 'Switch to system mode'
    default: return 'Switch to light mode'
  }
})
</script>

<template>
  <button
    :aria-label="label"
    class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    @click="toggleTheme"
  >
    <component :is="icon" class="h-4 w-4" />
  </button>
</template>
