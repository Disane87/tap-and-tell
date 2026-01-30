<script setup lang="ts">
/**
 * Step 1: Basics - Name (required) and Photo (optional).
 *
 * Uses the shared form state from useGuestForm composable.
 */
const { formState, errors } = useGuestForm()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        Wer bist du?
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Sag uns deinen Namen und zeig dich von deiner besten Seite.
      </p>
    </div>

    <!-- Name input -->
    <div class="space-y-2">
      <Label for="name">Name *</Label>
      <Input
        id="name"
        v-model="formState.name"
        placeholder="Dein Name"
        :class="{ 'border-destructive': errors.name }"
        maxlength="100"
      />
      <p v-if="errors.name" class="text-sm text-destructive">
        {{ errors.name }}
      </p>
    </div>

    <!-- Photo upload -->
    <div class="space-y-2">
      <Label>Foto (optional)</Label>
      <PhotoUpload
        v-model="formState.photo"
        :error="errors.photo"
      />
    </div>
  </div>
</template>
