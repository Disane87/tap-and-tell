<script setup lang="ts">
/**
 * Wizard Step 2: Favorites — color, food, movie, song, video.
 * All fields are optional.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  favoriteSongTitle: string
  favoriteSongArtist: string
  favoriteSongUrl: string
  favoriteVideoTitle: string
  favoriteVideoUrl: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:favoriteColor', value: string): void
  (e: 'update:favoriteFood', value: string): void
  (e: 'update:favoriteMovie', value: string): void
  (e: 'update:favoriteSongTitle', value: string): void
  (e: 'update:favoriteSongArtist', value: string): void
  (e: 'update:favoriteSongUrl', value: string): void
  (e: 'update:favoriteVideoTitle', value: string): void
  (e: 'update:favoriteVideoUrl', value: string): void
}>()
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted-foreground">Tell us about your favorites — all optional!</p>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label class="mb-1.5 block text-sm font-medium">Favorite Color</Label>
        <Input
          :model-value="favoriteColor"
          placeholder="e.g. Royal Blue"
          :disabled="disabled"
          @update:model-value="emit('update:favoriteColor', $event as string)"
        />
      </div>
      <div>
        <Label class="mb-1.5 block text-sm font-medium">Favorite Food</Label>
        <Input
          :model-value="favoriteFood"
          placeholder="e.g. Pizza"
          :disabled="disabled"
          @update:model-value="emit('update:favoriteFood', $event as string)"
        />
      </div>
    </div>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">Favorite Movie</Label>
      <Input
        :model-value="favoriteMovie"
        placeholder="e.g. The Grand Budapest Hotel"
        :disabled="disabled"
        @update:model-value="emit('update:favoriteMovie', $event as string)"
      />
    </div>

    <div class="space-y-3 rounded-lg border border-border/40 p-4">
      <Label class="block text-sm font-medium">Favorite Song</Label>
      <div class="grid grid-cols-2 gap-3">
        <Input
          :model-value="favoriteSongTitle"
          placeholder="Song title"
          :disabled="disabled"
          @update:model-value="emit('update:favoriteSongTitle', $event as string)"
        />
        <Input
          :model-value="favoriteSongArtist"
          placeholder="Artist"
          :disabled="disabled"
          @update:model-value="emit('update:favoriteSongArtist', $event as string)"
        />
      </div>
      <Input
        :model-value="favoriteSongUrl"
        placeholder="Spotify or YouTube Music link (optional)"
        :disabled="disabled"
        @update:model-value="emit('update:favoriteSongUrl', $event as string)"
      />
    </div>

    <div class="space-y-3 rounded-lg border border-border/40 p-4">
      <Label class="block text-sm font-medium">Favorite Video</Label>
      <Input
        :model-value="favoriteVideoTitle"
        placeholder="Video title"
        :disabled="disabled"
        @update:model-value="emit('update:favoriteVideoTitle', $event as string)"
      />
      <Input
        :model-value="favoriteVideoUrl"
        placeholder="YouTube link (optional)"
        :disabled="disabled"
        @update:model-value="emit('update:favoriteVideoUrl', $event as string)"
      />
    </div>
  </div>
</template>
