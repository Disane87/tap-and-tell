<script setup lang="ts">
/**
 * Root application component.
 * Provides NuxtPage routing and global toast notifications.
 */
import { Toaster } from '~/components/ui/sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Toast notifications - position bottom-right, high z-index to appear above dialogs -->
  <Toaster
    position="bottom-right"
    :duration="4000"
    :visible-toasts="5"
    :gap="12"
    expand
    rich-colors
  />
</template>
