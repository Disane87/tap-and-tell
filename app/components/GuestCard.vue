<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'

interface Props {
  entry: GuestEntry
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', entry: GuestEntry): void
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div
    class="card-polaroid cursor-pointer overflow-hidden border border-border/40"
    @click="emit('click', entry)"
  >
    <div v-if="entry.photoUrl" class="photo-frame aspect-video w-full overflow-hidden">
      <img
        :src="entry.photoUrl"
        :alt="`Photo by ${entry.name}`"
        class="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-105"
        loading="lazy"
      >
    </div>
    <div class="p-4 pb-3">
      <div class="flex items-center justify-between">
        <h3 class="font-handwritten text-xl font-semibold text-foreground">{{ entry.name }}</h3>
        <time class="text-xs text-muted-foreground">
          {{ formatDate(entry.createdAt) }}
        </time>
      </div>
      <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {{ entry.message }}
      </p>
    </div>
  </div>
</template>
