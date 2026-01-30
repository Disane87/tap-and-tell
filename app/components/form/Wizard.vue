<script setup lang="ts">
/**
 * 4-step form wizard for guest entry submission.
 *
 * Steps:
 * 1. Basics - Name and Photo
 * 2. Favorites - Colors, Food, Movie, Song, Video
 * 3. Fun Facts - Toggles and text fields
 * 4. Message - Main message and story
 *
 * Emits submit event when final step is completed successfully.
 *
 * @emits submit - When form is ready for submission.
 */
import { ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'

const { t } = useI18n()

const emit = defineEmits<{
  submit: []
}>()

const {
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  validateCurrentStep,
  isStepComplete
} = useGuestForm()

/**
 * Handles next/submit button click.
 */
function handleNext(): void {
  if (currentStep.value < totalSteps) {
    nextStep()
  } else {
    if (validateCurrentStep()) {
      emit('submit')
    }
  }
}

/**
 * Whether current step is the last step.
 */
const isLastStep = computed(() => currentStep.value === totalSteps)

/**
 * Button text based on current step.
 */
const nextButtonText = computed(() => {
  if (isLastStep.value) return t('common.submit')
  return t('common.next')
})

/**
 * Step labels for progress indicator.
 */
const stepLabels = computed(() => [
  t('form.steps.basics'),
  t('form.steps.favorites'),
  t('form.steps.funFacts'),
  t('form.steps.message')
])
</script>

<template>
  <div class="space-y-6">
    <!-- Progress bar -->
    <div class="flex items-center justify-center gap-2" aria-label="Form Progress">
      <div
        v-for="step in totalSteps"
        :key="step"
        class="progress-step"
        :class="{
          completed: step < currentStep,
          active: step === currentStep
        }"
        :aria-label="`Step ${step}: ${stepLabels[step - 1]}`"
      />
    </div>

    <!-- Step indicator -->
    <p class="text-center text-xs text-muted-foreground">
      {{ $t('form.step', { current: currentStep, total: totalSteps, label: stepLabels[currentStep - 1] }) }}
    </p>

    <!-- Step content -->
    <Transition name="fade" mode="out-in">
      <FormStepBasics v-if="currentStep === 1" key="step-1" />
      <FormStepFavorites v-else-if="currentStep === 2" key="step-2" />
      <FormStepFun v-else-if="currentStep === 3" key="step-3" />
      <FormStepMessage v-else-if="currentStep === 4" key="step-4" />
    </Transition>

    <!-- Navigation buttons -->
    <div class="flex gap-3">
      <Button
        v-if="currentStep > 1"
        type="button"
        variant="outline"
        class="flex-1"
        @click="prevStep"
      >
        <ChevronLeft class="mr-1 h-4 w-4" />
        {{ $t('common.back') }}
      </Button>
      <Button
        type="button"
        class="flex-1"
        :class="{ 'ml-auto': currentStep === 1 }"
        @click="handleNext"
      >
        {{ nextButtonText }}
        <Check v-if="isLastStep" class="ml-1 h-4 w-4" />
        <ChevronRight v-else class="ml-1 h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
