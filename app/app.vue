<script setup lang="ts">
/**
 * Root application component.
 * Provides NuxtPage routing and global toast notifications.
 */
import { Toaster } from 'vue-sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-center" :duration="3000" />
</template>
