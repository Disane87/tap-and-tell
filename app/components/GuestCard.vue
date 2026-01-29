<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
  <Card class="cursor-pointer overflow-hidden transition-shadow hover:shadow-md" @click="emit('click', entry)">
    <div v-if="entry.photoUrl" class="aspect-video w-full overflow-hidden bg-muted">
      <img
        :src="entry.photoUrl"
        :alt="`Photo by ${entry.name}`"
        class="h-full w-full object-cover"
        loading="lazy"
      >
    </div>
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">{{ entry.name }}</h3>
        <time class="text-xs text-muted-foreground">
          {{ formatDate(entry.createdAt) }}
        </time>
      </div>
    </CardHeader>
    <CardContent>
      <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ entry.message }}</p>
    </CardContent>
  </Card>
</template>
