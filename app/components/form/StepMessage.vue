<script setup lang="ts">
/**
 * Step 4: Message - Message (required), How We Met, Best Memory (optional).
 *
 * Uses the shared form state from useGuestForm composable.
 */
const { formState, errors } = useGuestForm()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        Deine Nachricht
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Hinterlasse einen persönlichen Gruß!
      </p>
    </div>

    <!-- Message -->
    <div class="space-y-2">
      <Label for="message">Nachricht *</Label>
      <Textarea
        id="message"
        v-model="formState.message"
        placeholder="Schreib etwas Nettes..."
        :class="{ 'border-destructive': errors.message }"
        rows="4"
        maxlength="1000"
      />
      <div class="flex justify-between">
        <p v-if="errors.message" class="text-sm text-destructive">
          {{ errors.message }}
        </p>
        <p class="ml-auto text-xs text-muted-foreground">
          {{ formState.message.length }} / 1000
        </p>
      </div>
    </div>

    <!-- How We Met -->
    <div class="space-y-2">
      <Label for="howWeMet">Wie haben wir uns kennengelernt?</Label>
      <Textarea
        id="howWeMet"
        v-model="formState.howWeMet"
        placeholder="Erzähl unsere Geschichte..."
        rows="3"
      />
    </div>

    <!-- Best Memory -->
    <div class="space-y-2">
      <Label for="bestMemory">Beste Erinnerung</Label>
      <Textarea
        id="bestMemory"
        v-model="formState.bestMemory"
        placeholder="Was ist deine liebste Erinnerung mit mir?"
        rows="3"
      />
    </div>
  </div>
</template>
