<script setup lang="ts">
/**
 * Wizard Step 3: Fun questions — superpower, hidden talent, desert island + toggles.
 * All fields are optional.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  superpower: string
  hiddenTalent: string
  desertIslandItems: string
  coffeeOrTea: 'coffee' | 'tea' | null
  nightOwlOrEarlyBird: 'night_owl' | 'early_bird' | null
  beachOrMountains: 'beach' | 'mountains' | null
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:superpower', value: string): void
  (e: 'update:hiddenTalent', value: string): void
  (e: 'update:desertIslandItems', value: string): void
  (e: 'update:coffeeOrTea', value: 'coffee' | 'tea' | null): void
  (e: 'update:nightOwlOrEarlyBird', value: 'night_owl' | 'early_bird' | null): void
  (e: 'update:beachOrMountains', value: 'beach' | 'mountains' | null): void
}>()
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted-foreground">Some fun ones — all optional!</p>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">If you had a superpower?</Label>
      <Input
        :model-value="superpower"
        placeholder="e.g. Teleportation"
        :disabled="disabled"
        @update:model-value="emit('update:superpower', $event as string)"
      />
    </div>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">Hidden talent?</Label>
      <Input
        :model-value="hiddenTalent"
        placeholder="e.g. Juggling"
        :disabled="disabled"
        @update:model-value="emit('update:hiddenTalent', $event as string)"
      />
    </div>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">3 things for a deserted island?</Label>
      <Input
        :model-value="desertIslandItems"
        placeholder="e.g. Music, books, sunscreen"
        :disabled="disabled"
        @update:model-value="emit('update:desertIslandItems', $event as string)"
      />
    </div>

    <div class="space-y-4 pt-2">
      <div>
        <Label class="mb-2 block text-sm font-medium">Coffee or Tea?</Label>
        <FormToggleChoice
          :model-value="coffeeOrTea"
          :option-a="{ value: 'coffee', label: 'Coffee', icon: '☕' }"
          :option-b="{ value: 'tea', label: 'Tea', icon: '🍵' }"
          :disabled="disabled"
          @update:model-value="emit('update:coffeeOrTea', $event as 'coffee' | 'tea' | null)"
        />
      </div>

      <div>
        <Label class="mb-2 block text-sm font-medium">Night Owl or Early Bird?</Label>
        <FormToggleChoice
          :model-value="nightOwlOrEarlyBird"
          :option-a="{ value: 'night_owl', label: 'Night Owl', icon: '🌙' }"
          :option-b="{ value: 'early_bird', label: 'Early Bird', icon: '🌅' }"
          :disabled="disabled"
          @update:model-value="emit('update:nightOwlOrEarlyBird', $event as 'night_owl' | 'early_bird' | null)"
        />
      </div>

      <div>
        <Label class="mb-2 block text-sm font-medium">Beach or Mountains?</Label>
        <FormToggleChoice
          :model-value="beachOrMountains"
          :option-a="{ value: 'beach', label: 'Beach', icon: '🏖️' }"
          :option-b="{ value: 'mountains', label: 'Mountains', icon: '🏔️' }"
          :disabled="disabled"
          @update:model-value="emit('update:beachOrMountains', $event as 'beach' | 'mountains' | null)"
        />
      </div>
    </div>
  </div>
</template>
