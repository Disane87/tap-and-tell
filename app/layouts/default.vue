<script setup lang="ts">
/**
 * Default layout with header navigation and theme toggle.
 *
 * Contains:
 * - Header with logo, nav links, and theme toggle
 * - Dashboard link for authenticated users
 * - Main content slot
 * - Toast notifications via Sonner
 */
import { Home } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const { public: { betaMode } } = useRuntimeConfig()

/** Whether we're in beta mode (not open) - shows beta badge */
const isBeta = computed(() => betaMode !== 'open')

/**
 * Navigation links.
 */
const navLinks = computed(() => [
  { to: '/', label: t('nav.home'), icon: Home }
])

/**
 * Checks if a link is active.
 */
function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="min-h-dvh bg-background safe-x">
    <!-- Header with iOS safe area support -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm safe-top">
      <div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="font-handwritten text-xl text-foreground">
            Tap & Tell
          </NuxtLink>
          <span
            v-if="isBeta"
            class="rounded-full border border-primary/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary"
          >
            Beta
          </span>
        </div>

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

          <!-- User menu (avatar dropdown for auth, login+language+theme for guests) -->
          <UserMenu />
        </nav>
      </div>
    </header>

    <!-- 2FA Required Dialog (blocks user until 2FA is set up) -->
    <ClientOnly>
      <TwoFactorRequiredDialog />
    </ClientOnly>

    <!-- Main content -->
    <main>
      <slot />
    </main>

    <!-- Cookie Consent Banner -->
    <ClientOnly>
      <CookieBanner />
    </ClientOnly>
  </div>
</template>
