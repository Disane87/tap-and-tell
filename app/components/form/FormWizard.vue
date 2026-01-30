<script setup lang="ts">
/**
 * Multi-step wizard container for the guest entry form.
 * Renders a 4-step wizard (Basics, Favorites, Fun, Message) with progress bar,
 * step transitions, and navigation controls.
 */
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SkipForward, Send } from 'lucide-vue-next'

const {
  currentStep,
  direction,
  formState,
  validation,
  status,
  nextStep,
  prevStep,
  TOTAL_STEPS
} = useGuestForm()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const stepLabels = ['Basics', 'Favorites', 'Fun', 'Message']

const isSubmitting = computed(() => status.value === 'submitting')
const isLastStep = computed(() => currentStep.value === TOTAL_STEPS - 1)
const isFirstStep = computed(() => currentStep.value === 0)
const isOptionalStep = computed(() => currentStep.value === 1 || currentStep.value === 2)

function handleNext() {
  if (isLastStep.value) {
    emit('submit')
  } else {
    nextStep()
  }
}
</script>

<template>
  <div class="card-polaroid overflow-hidden border border-border/40">
    <!-- Header with progress -->
    <div class="border-b border-border/40 px-6 py-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-foreground">Leave a Message</h2>
        <span class="text-sm text-muted-foreground">
          Step {{ currentStep + 1 }} of {{ TOTAL_STEPS }}
        </span>
      </div>

      <!-- Progress bar -->
      <div class="flex gap-1.5">
        <div
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="h-1.5 flex-1 rounded-full transition-colors duration-300"
          :class="i - 1 <= currentStep
            ? 'bg-primary'
            : 'bg-muted'"
        />
      </div>

      <!-- Step label -->
      <p class="mt-2 text-sm text-muted-foreground">{{ stepLabels[currentStep] }}</p>
    </div>

    <!-- Step content -->
    <div class="px-6 py-5">
      <Transition
        :name="direction === 'forward' ? 'slide-left' : 'slide-right'"
        mode="out-in"
      >
        <FormStepBasics
          v-if="currentStep === 0"
          :key="0"
          :name="formState.name"
          :photo="formState.photo"
          :validation="validation"
          :disabled="isSubmitting"
          @update:name="formState.name = $event"
          @update:photo="formState.photo = $event"
        />
        <FormStepFavorites
          v-else-if="currentStep === 1"
          :key="1"
          :favorite-color="formState.favoriteColor"
          :favorite-food="formState.favoriteFood"
          :favorite-movie="formState.favoriteMovie"
          :favorite-song-title="formState.favoriteSongTitle"
          :favorite-song-artist="formState.favoriteSongArtist"
          :favorite-song-url="formState.favoriteSongUrl"
          :favorite-video-title="formState.favoriteVideoTitle"
          :favorite-video-url="formState.favoriteVideoUrl"
          :disabled="isSubmitting"
          @update:favorite-color="formState.favoriteColor = $event"
          @update:favorite-food="formState.favoriteFood = $event"
          @update:favorite-movie="formState.favoriteMovie = $event"
          @update:favorite-song-title="formState.favoriteSongTitle = $event"
          @update:favorite-song-artist="formState.favoriteSongArtist = $event"
          @update:favorite-song-url="formState.favoriteSongUrl = $event"
          @update:favorite-video-title="formState.favoriteVideoTitle = $event"
          @update:favorite-video-url="formState.favoriteVideoUrl = $event"
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
          :disabled="isSubmitting"
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
          :validation="validation"
          :disabled="isSubmitting"
          @update:best-memory="formState.bestMemory = $event"
          @update:how-we-met="formState.howWeMet = $event"
          @update:message="formState.message = $event"
        />
      </Transition>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between border-t border-border/40 px-6 py-4">
      <Button
        v-if="!isFirstStep"
        type="button"
        variant="ghost"
        :disabled="isSubmitting"
        @click="prevStep"
      >
        <ChevronLeft class="mr-1 h-4 w-4" />
        Back
      </Button>
      <div v-else />

      <div class="flex gap-2">
        <Button
          v-if="isOptionalStep"
          type="button"
          variant="ghost"
          :disabled="isSubmitting"
          @click="nextStep"
        >
          Skip
          <SkipForward class="ml-1 h-4 w-4" />
        </Button>

        <Button
          type="button"
          :disabled="isSubmitting"
          @click="handleNext"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Submitting...
          </span>
          <template v-else-if="isLastStep">
            <Send class="mr-1 h-4 w-4" />
            Submit
          </template>
          <template v-else>
            Next
            <ChevronRight class="ml-1 h-4 w-4" />
          </template>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
