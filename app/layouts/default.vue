<script setup lang="ts">
/**
 * Default layout with header navigation and theme toggle.
 *
 * Contains:
 * - Header with logo, nav links, and theme toggle
 * - Main content slot
 * - Toast notifications via Sonner
 */
import { BookOpen, Home, Settings } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()

/**
 * Navigation links.
 */
const navLinks = computed(() => [
  { to: '/', label: t('nav.home'), icon: Home },
  { to: '/guestbook', label: t('nav.guestbook'), icon: BookOpen }
])

/**
 * Checks if a link is active.
 */
function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <!-- Logo -->
        <NuxtLink to="/" class="font-handwritten text-xl text-foreground">
          Tap & Tell
        </NuxtLink>

        <!-- Navigation -->
        <nav class="flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
            :class="isActive(link.to)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            <component :is="link.icon" class="h-4 w-4" />
            <span class="hidden sm:inline">{{ link.label }}</span>
          </NuxtLink>

          <!-- Admin link -->
          <NuxtLink
            to="/admin"
            class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
            :class="route.path.startsWith('/admin')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            <Settings class="h-4 w-4" />
            <span class="hidden sm:inline">Admin</span>
          </NuxtLink>

          <!-- Language switcher -->
          <ClientOnly>
            <LanguageSwitcher />
          </ClientOnly>

          <!-- Theme toggle -->
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main>
      <slot />
    </main>
  </div>
</template>
