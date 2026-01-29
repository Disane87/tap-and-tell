<script setup lang="ts">
import type { GuestEntry } from '~/types/guest'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface Props {
  entry: GuestEntry | null
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="max-h-[85vh] overflow-y-auto">
      <template v-if="entry">
        <div v-if="entry.photoUrl" class="mb-4 overflow-hidden rounded-lg">
          <img
            :src="entry.photoUrl"
            :alt="`Photo by ${entry.name}`"
            class="w-full object-cover"
          >
        </div>

        <SheetHeader class="text-left">
          <SheetTitle>{{ entry.name }}</SheetTitle>
          <SheetDescription>
            {{ formatDate(entry.createdAt) }}
          </SheetDescription>
        </SheetHeader>

        <div class="mt-4">
          <p class="whitespace-pre-wrap text-foreground">{{ entry.message }}</p>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
