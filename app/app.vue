<script setup lang="ts">
/**
 * Root application component.
 * Provides NuxtPage routing and global toast notifications.
 */
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="bottom-center" :duration="3000" />
</template>
