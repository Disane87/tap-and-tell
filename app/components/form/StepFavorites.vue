<script setup lang="ts">
/**
 * Step 2 of the guest wizard: Favorites (all optional).
 *
 * Fields: Color, Food, Movie, Song (title/artist/URL), Video (title/URL).
 */

defineProps<{
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  songTitle: string
  songArtist: string
  songUrl: string
  videoTitle: string
  videoUrl: string
}>()

defineEmits<{
  'update:favoriteColor': [value: string]
  'update:favoriteFood': [value: string]
  'update:favoriteMovie': [value: string]
  'update:songTitle': [value: string]
  'update:songArtist': [value: string]
  'update:songUrl': [value: string]
  'update:videoTitle': [value: string]
  'update:videoUrl': [value: string]
}>()
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <Label for="fav-color">Favorite Color</Label>
      <Input
        id="fav-color"
        :model-value="favoriteColor"
        placeholder="e.g. Sunset Orange"
        @update:model-value="$emit('update:favoriteColor', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="fav-food">Favorite Food</Label>
      <Input
        id="fav-food"
        :model-value="favoriteFood"
        placeholder="e.g. Homemade pasta"
        @update:model-value="$emit('update:favoriteFood', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="fav-movie">Favorite Movie</Label>
      <Input
        id="fav-movie"
        :model-value="favoriteMovie"
        placeholder="e.g. The Grand Budapest Hotel"
        @update:model-value="$emit('update:favoriteMovie', $event)"
      />
    </div>

    <!-- Song Card -->
    <div class="rounded-lg border border-border/60 p-4 space-y-3">
      <Label class="text-sm font-semibold">Favorite Song</Label>
      <Input
        :model-value="songTitle"
        placeholder="Song title"
        @update:model-value="$emit('update:songTitle', $event)"
      />
      <Input
        :model-value="songArtist"
        placeholder="Artist"
        @update:model-value="$emit('update:songArtist', $event)"
      />
      <Input
        :model-value="songUrl"
        placeholder="Link (Spotify, YouTube, etc.)"
        @update:model-value="$emit('update:songUrl', $event)"
      />
    </div>

    <!-- Video Card -->
    <div class="rounded-lg border border-border/60 p-4 space-y-3">
      <Label class="text-sm font-semibold">Favorite Video</Label>
      <Input
        :model-value="videoTitle"
        placeholder="Video title"
        @update:model-value="$emit('update:videoTitle', $event)"
      />
      <Input
        :model-value="videoUrl"
        placeholder="Link (YouTube, etc.)"
        @update:model-value="$emit('update:videoUrl', $event)"
      />
    </div>
  </div>
</template>
