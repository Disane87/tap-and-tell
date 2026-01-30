<script setup lang="ts">
/**
 * Step 3 of the guest wizard: Fun Facts (all optional).
 *
 * Fields: Superpower, Hidden Talent, Desert Island Items,
 * and three binary toggles (Coffee/Tea, Night Owl/Early Bird, Beach/Mountains).
 */

defineProps<{
  superpower: string
  hiddenTalent: string
  desertIslandItems: string
  coffeeOrTea: 'coffee' | 'tea' | null
  nightOwlOrEarlyBird: 'night_owl' | 'early_bird' | null
  beachOrMountains: 'beach' | 'mountains' | null
}>()

defineEmits<{
  'update:superpower': [value: string]
  'update:hiddenTalent': [value: string]
  'update:desertIslandItems': [value: string]
  'update:coffeeOrTea': [value: 'coffee' | 'tea' | null]
  'update:nightOwlOrEarlyBird': [value: 'night_owl' | 'early_bird' | null]
  'update:beachOrMountains': [value: 'beach' | 'mountains' | null]
}>()
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <Label for="superpower">If you had a superpower?</Label>
      <Input
        id="superpower"
        :model-value="superpower"
        placeholder="e.g. Time travel"
        @update:model-value="$emit('update:superpower', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="hidden-talent">Hidden Talent</Label>
      <Input
        id="hidden-talent"
        :model-value="hiddenTalent"
        placeholder="e.g. Juggling"
        @update:model-value="$emit('update:hiddenTalent', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="desert-island">Desert Island Items</Label>
      <Input
        id="desert-island"
        :model-value="desertIslandItems"
        placeholder="3 things you'd bring"
        @update:model-value="$emit('update:desertIslandItems', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label>Coffee or Tea?</Label>
      <FormToggleChoice
        :model-value="coffeeOrTea"
        :option-a="{ label: 'Coffee', value: 'coffee' }"
        :option-b="{ label: 'Tea', value: 'tea' }"
        @update:model-value="$emit('update:coffeeOrTea', $event as any)"
      />
    </div>

    <div class="space-y-2">
      <Label>Night Owl or Early Bird?</Label>
      <FormToggleChoice
        :model-value="nightOwlOrEarlyBird"
        :option-a="{ label: 'Night Owl', value: 'night_owl' }"
        :option-b="{ label: 'Early Bird', value: 'early_bird' }"
        @update:model-value="$emit('update:nightOwlOrEarlyBird', $event as any)"
      />
    </div>

    <div class="space-y-2">
      <Label>Beach or Mountains?</Label>
      <FormToggleChoice
        :model-value="beachOrMountains"
        :option-a="{ label: 'Beach', value: 'beach' }"
        :option-b="{ label: 'Mountains', value: 'mountains' }"
        @update:model-value="$emit('update:beachOrMountains', $event as any)"
      />
    </div>
  </div>
</template>
