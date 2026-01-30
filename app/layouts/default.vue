<script setup lang="ts">
import { Sonner } from '@/components/ui/sonner'

const { isDark } = useTheme()
const sonnerTheme = computed(() => isDark.value ? 'dark' : 'light')

const route = useRoute()
/** Whether the current page hides the header (landing page and guestbook for normal users). */
const isChromeless = computed(() => route.path === '/' || route.path === '/guestbook')
/** Whether the current page needs full-viewport layout (no container padding). */
const isFullViewport = computed(() => route.path === '/' || route.path === '/guestbook')
</script>

<template>
  <div class="transition-theme min-h-screen bg-background">
    <header
      v-if="!isChromeless"
      class="border-b border-border/60 bg-card/80 backdrop-blur-sm"
    >
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <NuxtLink to="/" class="font-display text-xl font-semibold tracking-tight text-foreground">
          Tap & Tell
        </NuxtLink>
        <nav class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/guestbook"
            class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Guestbook
          </NuxtLink>
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
        </nav>
      </div>
    </header>

    <main :class="isFullViewport ? '' : 'container mx-auto px-4 py-8'">
      <slot />
    </main>

    <Sonner position="top-center" :theme="sonnerTheme" />
  </div>
</template>
