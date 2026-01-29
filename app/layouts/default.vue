<script setup lang="ts">
import { Sonner } from '@/components/ui/sonner'
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <NuxtLink to="/" class="text-xl font-semibold text-foreground">
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
          <ThemeToggle />
        </nav>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>

    <Sonner position="top-center" />
  </div>
</template>
