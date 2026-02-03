<script setup lang="ts">
/**
 * Masonry grid layout using CSS columns.
 *
 * Pinterest-style staggered layout where cards have variable heights
 * based on their content.
 *
 * @slot default - Cards to display in the masonry layout.
 */
defineProps<{
  /** Number of columns on desktop (default 3). */
  columns?: number
}>()
</script>

<template>
  <div
    class="masonry-grid"
    :style="{ '--columns': columns ?? 3 }"
  >
    <slot />
  </div>
</template>

<style scoped>
.masonry-grid {
  column-count: var(--columns, 3);
  column-gap: 1rem;
}

.masonry-grid > :deep(*) {
  break-inside: avoid;
  margin-bottom: 1rem;
}

@media (max-width: 1024px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
