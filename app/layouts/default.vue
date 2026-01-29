<script setup lang="ts">
import { Sonner } from '@/components/ui/sonner'
</script>

<template>
  <div class="transition-theme min-h-screen bg-background">
    <header class="border-b border-border/60 bg-card/80 backdrop-blur-sm">
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

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>

    <Sonner position="top-center" />
  </div>
</template>
