<script setup lang="ts">
/**
 * Multi-step wizard form for guest entry submission.
 *
 * 4 steps: Basics -> Favorites -> Fun -> Message.
 * Steps 1 & 4 have required fields; steps 2 & 3 are optional and can be skipped.
 * Includes progress bar, step counter, and slide transitions between steps.
 *
 * @emits submit - When the form is submitted with valid data (payload: CreateGuestEntryInput).
 */
import { ChevronLeft } from 'lucide-vue-next'

const emit = defineEmits<{
  submit: [data: ReturnType<typeof getSubmitData>]
}>()

const {
  currentStep,
  direction,
  formState,
  validation,
  totalSteps,
  stepLabels,
  validateCurrentStep,
  validate,
  nextStep,
  prevStep,
  getSubmitData,
} = useGuestForm()

/** Whether the current step is optional (steps 2 and 3). */
const isOptionalStep = computed(() => currentStep.value === 1 || currentStep.value === 2)

/** Whether we're on the final step. */
const isFinalStep = computed(() => currentStep.value === totalSteps - 1)

/** Transition name based on navigation direction. */
const transitionName = computed(() =>
  direction.value === 'forward' ? 'step-forward' : 'step-backward'
)

/** Progress percentage for the bar. */
const progressPercent = computed(() =>
  ((currentStep.value + 1) / totalSteps) * 100
)

/** Handles the submit button click. */
function handleSubmit(): void {
  if (!validate()) return
  emit('submit', getSubmitData())
}
</script>

<template>
  <div class="space-y-6">
    <!-- Progress bar -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {{ currentStep + 1 }} of {{ totalSteps }}</span>
        <span>{{ stepLabels[currentStep] }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-primary transition-all"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Step content with transitions -->
    <div class="relative min-h-[300px]">
      <Transition :name="transitionName" mode="out-in">
        <FormStepBasics
          v-if="currentStep === 0"
          :key="0"
          :name="formState.name"
          :photo="formState.photo"
          :name-error="validation.name"
          :photo-error="validation.photo"
          @update:name="formState.name = $event"
          @update:photo="formState.photo = $event"
        />
        <FormStepFavorites
          v-else-if="currentStep === 1"
          :key="1"
          :favorite-color="formState.favoriteColor"
          :favorite-food="formState.favoriteFood"
          :favorite-movie="formState.favoriteMovie"
          :song-title="formState.songTitle"
          :song-artist="formState.songArtist"
          :song-url="formState.songUrl"
          :video-title="formState.videoTitle"
          :video-url="formState.videoUrl"
          @update:favorite-color="formState.favoriteColor = $event"
          @update:favorite-food="formState.favoriteFood = $event"
          @update:favorite-movie="formState.favoriteMovie = $event"
          @update:song-title="formState.songTitle = $event"
          @update:song-artist="formState.songArtist = $event"
          @update:song-url="formState.songUrl = $event"
          @update:video-title="formState.videoTitle = $event"
          @update:video-url="formState.videoUrl = $event"
        />
        <FormStepFun
          v-else-if="currentStep === 2"
          :key="2"
          :superpower="formState.superpower"
          :hidden-talent="formState.hiddenTalent"
          :desert-island-items="formState.desertIslandItems"
          :coffee-or-tea="formState.coffeeOrTea"
          :night-owl-or-early-bird="formState.nightOwlOrEarlyBird"
          :beach-or-mountains="formState.beachOrMountains"
          @update:superpower="formState.superpower = $event"
          @update:hidden-talent="formState.hiddenTalent = $event"
          @update:desert-island-items="formState.desertIslandItems = $event"
          @update:coffee-or-tea="formState.coffeeOrTea = $event"
          @update:night-owl-or-early-bird="formState.nightOwlOrEarlyBird = $event"
          @update:beach-or-mountains="formState.beachOrMountains = $event"
        />
        <FormStepMessage
          v-else-if="currentStep === 3"
          :key="3"
          :best-memory="formState.bestMemory"
          :how-we-met="formState.howWeMet"
          :message="formState.message"
          :message-error="validation.message"
          @update:best-memory="formState.bestMemory = $event"
          @update:how-we-met="formState.howWeMet = $event"
          @update:message="formState.message = $event"
        />
      </Transition>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between gap-3">
      <Button
        v-if="currentStep > 0"
        variant="ghost"
        size="sm"
        @click="prevStep"
      >
        <ChevronLeft class="mr-1 h-4 w-4" />
        Back
      </Button>
      <div v-else />

      <div class="flex gap-2">
        <Button
          v-if="isOptionalStep"
          variant="ghost"
          size="sm"
          @click="nextStep"
        >
          Skip
        </Button>

        <Button
          v-if="!isFinalStep"
          @click="nextStep"
        >
          Next
        </Button>

        <Button
          v-if="isFinalStep"
          @click="handleSubmit"
        >
          Submit
        </Button>
      </div>
    </div>
  </div>
</template>
