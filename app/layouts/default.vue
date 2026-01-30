<script setup lang="ts">
/**
 * Default layout with an optional frosted-glass header.
 *
 * The header is hidden on the landing page and guestbook
 * (chromeless mode) to allow full-bleed gradient backgrounds.
 * Admin pages show the full header with navigation.
 */

const route = useRoute()

/** Routes that should render without the header navigation. */
const isChromeless = computed(() => {
  const path = route.path
  return path === '/' || path === '/guestbook'
})
</script>

<template>
  <div class="transition-theme min-h-screen">
    <header
      v-if="!isChromeless"
      class="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-sm"
    >
      <div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <NuxtLink to="/" class="font-display text-lg font-semibold">
          Tap &amp; Tell
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

    <main>
      <slot />
    </main>

    <Toaster position="top-center" :expand="false" rich-colors />
  </div>
</template>
