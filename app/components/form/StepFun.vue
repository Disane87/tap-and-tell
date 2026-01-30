<script setup lang="ts">
/**
 * Step 3: Fun Facts - Toggles and free text (all optional).
 *
 * Uses the shared form state from useGuestForm composable.
 */
const { formState } = useGuestForm()

const coffeeTeaOptions = [
  { value: 'coffee', label: '☕ Coffee' },
  { value: 'tea', label: '🍵 Tea' }
]

const owlBirdOptions = [
  { value: 'night_owl', label: '🦉 Night Owl' },
  { value: 'early_bird', label: '🐦 Early Bird' }
]

const beachMountainOptions = [
  { value: 'beach', label: '🏖️ Beach' },
  { value: 'mountains', label: '⛰️ Mountains' }
]
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        Fun Facts
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Erzähl uns etwas Lustiges über dich!
      </p>
    </div>

    <!-- Coffee or Tea -->
    <div class="space-y-2">
      <Label>Coffee or Tea?</Label>
      <FormToggleChoice
        v-model="formState.coffeeOrTea"
        :options="coffeeTeaOptions"
      />
    </div>

    <!-- Night Owl or Early Bird -->
    <div class="space-y-2">
      <Label>Night Owl or Early Bird?</Label>
      <FormToggleChoice
        v-model="formState.nightOwlOrEarlyBird"
        :options="owlBirdOptions"
      />
    </div>

    <!-- Beach or Mountains -->
    <div class="space-y-2">
      <Label>Beach or Mountains?</Label>
      <FormToggleChoice
        v-model="formState.beachOrMountains"
        :options="beachMountainOptions"
      />
    </div>

    <!-- Superpower -->
    <div class="space-y-2">
      <Label for="superpower">Deine Superpower</Label>
      <Input
        id="superpower"
        v-model="formState.superpower"
        placeholder="z.B. Empathie"
      />
    </div>

    <!-- Hidden Talent -->
    <div class="space-y-2">
      <Label for="hiddenTalent">Verstecktes Talent</Label>
      <Input
        id="hiddenTalent"
        v-model="formState.hiddenTalent"
        placeholder="z.B. Origami"
      />
    </div>

    <!-- Desert Island Items -->
    <div class="space-y-2">
      <Label for="desertIslandItems">3 Dinge auf einer einsamen Insel</Label>
      <Input
        id="desertIslandItems"
        v-model="formState.desertIslandItems"
        placeholder="z.B. Buch, Kaffee, Decke"
      />
    </div>
  </div>
</template>
