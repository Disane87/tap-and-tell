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
        {{ $t('form.favorites.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('form.favorites.subtitle') }}
      </p>
    </div>

    <!-- Color -->
    <div class="space-y-2">
      <Label for="favoriteColor">{{ $t('form.favorites.color') }}</Label>
      <Input
        id="favoriteColor"
        v-model="formState.favoriteColor"
        :placeholder="$t('form.favorites.colorPlaceholder')"
      />
    </div>

    <!-- Food -->
    <div class="space-y-2">
      <Label for="favoriteFood">{{ $t('form.favorites.food') }}</Label>
      <Input
        id="favoriteFood"
        v-model="formState.favoriteFood"
        :placeholder="$t('form.favorites.foodPlaceholder')"
      />
    </div>

    <!-- Movie -->
    <div class="space-y-2">
      <Label for="favoriteMovie">{{ $t('form.favorites.movie') }}</Label>
      <Input
        id="favoriteMovie"
        v-model="formState.favoriteMovie"
        :placeholder="$t('form.favorites.moviePlaceholder')"
      />
    </div>

    <!-- Song -->
    <div class="section-card space-y-3">
      <p class="text-sm font-medium text-foreground">{{ $t('form.favorites.song') }}</p>
      <div class="space-y-2">
        <Input
          v-model="formState.favoriteSongTitle"
          :placeholder="$t('form.favorites.songTitle')"
        />
        <Input
          v-model="formState.favoriteSongArtist"
          :placeholder="$t('form.favorites.songArtist')"
        />
        <Input
          v-model="formState.favoriteSongUrl"
          :placeholder="$t('form.favorites.songUrl')"
          type="url"
        />
      </div>
    </div>

    <!-- Video -->
    <div class="section-card space-y-3">
      <p class="text-sm font-medium text-foreground">{{ $t('form.favorites.video') }}</p>
      <div class="space-y-2">
        <Input
          v-model="formState.favoriteVideoTitle"
          :placeholder="$t('form.favorites.videoTitle')"
        />
        <Input
          v-model="formState.favoriteVideoUrl"
          :placeholder="$t('form.favorites.videoUrl')"
          type="url"
        />
      </div>
    </div>
  </div>
</template>
