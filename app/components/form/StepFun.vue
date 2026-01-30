<script setup lang="ts">
/**
 * Step 3: Fun Facts - Toggles and free text (all optional).
 *
 * Uses the shared form state from useGuestForm composable.
 */
const { t } = useI18n()
const { formState } = useGuestForm()

const coffeeTeaOptions = computed(() => [
  { value: 'coffee', label: `☕ ${t('form.funFacts.coffee')}` },
  { value: 'tea', label: `🍵 ${t('form.funFacts.tea')}` }
])

const owlBirdOptions = computed(() => [
  { value: 'night_owl', label: `🦉 ${t('form.funFacts.nightOwl')}` },
  { value: 'early_bird', label: `🐦 ${t('form.funFacts.earlyBird')}` }
])

const beachMountainOptions = computed(() => [
  { value: 'beach', label: `🏖️ ${t('form.funFacts.beach')}` },
  { value: 'mountains', label: `⛰️ ${t('form.funFacts.mountains')}` }
])
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        {{ $t('form.funFacts.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('form.funFacts.subtitle') }}
      </p>
    </div>

    <!-- Coffee or Tea -->
    <div class="space-y-2">
      <Label>{{ $t('form.funFacts.coffeeOrTea') }}</Label>
      <FormToggleChoice
        v-model="formState.coffeeOrTea"
        :options="coffeeTeaOptions"
      />
    </div>

    <!-- Night Owl or Early Bird -->
    <div class="space-y-2">
      <Label>{{ $t('form.funFacts.nightOwlOrEarlyBird') }}</Label>
      <FormToggleChoice
        v-model="formState.nightOwlOrEarlyBird"
        :options="owlBirdOptions"
      />
    </div>

    <!-- Beach or Mountains -->
    <div class="space-y-2">
      <Label>{{ $t('form.funFacts.beachOrMountains') }}</Label>
      <FormToggleChoice
        v-model="formState.beachOrMountains"
        :options="beachMountainOptions"
      />
    </div>

    <!-- Superpower -->
    <div class="space-y-2">
      <Label for="superpower">{{ $t('form.funFacts.superpower') }}</Label>
      <Input
        id="superpower"
        v-model="formState.superpower"
        :placeholder="$t('form.funFacts.superpowerPlaceholder')"
      />
    </div>

    <!-- Hidden Talent -->
    <div class="space-y-2">
      <Label for="hiddenTalent">{{ $t('form.funFacts.hiddenTalent') }}</Label>
      <Input
        id="hiddenTalent"
        v-model="formState.hiddenTalent"
        :placeholder="$t('form.funFacts.hiddenTalentPlaceholder')"
      />
    </div>

    <!-- Desert Island Items -->
    <div class="space-y-2">
      <Label for="desertIslandItems">{{ $t('form.funFacts.desertIsland') }}</Label>
      <Input
        id="desertIslandItems"
        v-model="formState.desertIslandItems"
        :placeholder="$t('form.funFacts.desertIslandPlaceholder')"
      />
    </div>
  </div>
</template>
