<script setup lang="ts">
/**
 * Reusable empty state component with icon, title, description, and action slot.
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
      <slot name="icon" />
    </div>
    <h3 class="mb-1 text-lg font-medium text-foreground">{{ title }}</h3>
    <p v-if="description" class="mb-4 max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <slot name="action" />
  </div>
</template>
