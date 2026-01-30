<script setup lang="ts">
/**
 * Step 2: Favorites - Color, Food, Movie, Song, Video (all optional).
 *
 * Uses the shared form state from useGuestForm composable.
 */
const { formState } = useGuestForm()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        Deine Favoriten
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Was magst du am liebsten? Alles optional!
      </p>
    </div>

    <!-- Color -->
    <div class="space-y-2">
      <Label for="favoriteColor">Lieblingsfarbe</Label>
      <Input
        id="favoriteColor"
        v-model="formState.favoriteColor"
        placeholder="z.B. Mintgrün"
      />
    </div>

    <!-- Food -->
    <div class="space-y-2">
      <Label for="favoriteFood">Lieblingsessen</Label>
      <Input
        id="favoriteFood"
        v-model="formState.favoriteFood"
        placeholder="z.B. Ramen"
      />
    </div>

    <!-- Movie -->
    <div class="space-y-2">
      <Label for="favoriteMovie">Lieblingsfilm</Label>
      <Input
        id="favoriteMovie"
        v-model="formState.favoriteMovie"
        placeholder="z.B. Interstellar"
      />
    </div>

    <!-- Song -->
    <div class="section-card space-y-3">
      <p class="text-sm font-medium text-foreground">Lieblingssong</p>
      <div class="space-y-2">
        <Input
          v-model="formState.favoriteSongTitle"
          placeholder="Titel"
        />
        <Input
          v-model="formState.favoriteSongArtist"
          placeholder="Künstler (optional)"
        />
        <Input
          v-model="formState.favoriteSongUrl"
          placeholder="Spotify/YouTube Link (optional)"
          type="url"
        />
      </div>
    </div>

    <!-- Video -->
    <div class="section-card space-y-3">
      <p class="text-sm font-medium text-foreground">Lieblingsvideo</p>
      <div class="space-y-2">
        <Input
          v-model="formState.favoriteVideoTitle"
          placeholder="Titel"
        />
        <Input
          v-model="formState.favoriteVideoUrl"
          placeholder="YouTube Link (optional)"
          type="url"
        />
      </div>
    </div>
  </div>
</template>
