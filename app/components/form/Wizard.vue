<script setup lang="ts">
/**
 * Multi-step form wizard for guest entry submission.
 *
 * Renders only enabled steps (configured via guestbook settings).
 * Steps 1 (Basics) and 4 (Message) are always present.
 * Steps 2 (Favorites) and 3 (Fun Facts) can be toggled off.
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
  enabledSteps,
  totalSteps,
  currentStepIndex,
  nextStep,
  prevStep,
  validateCurrentStep,
  isStepComplete
} = useGuestForm()

/** Map of step number to i18n label key. */
const stepLabelMap: Record<number, string> = {
  1: 'form.steps.basics',
  2: 'form.steps.favorites',
  3: 'form.steps.funFacts',
  4: 'form.steps.message'
}

/**
 * Labels for currently enabled steps.
 */
const stepLabels = computed(() =>
  enabledSteps.value.map(s => t(stepLabelMap[s]))
)

/**
 * Handles next/submit button click.
 */
function handleNext(): void {
  const idx = enabledSteps.value.indexOf(currentStep.value)
  const isLast = idx === enabledSteps.value.length - 1
  if (isLast) {
    if (validateCurrentStep()) {
      emit('submit')
    }
  } else {
    nextStep()
  }
}

/**
 * Whether current step is the last enabled step.
 */
const isLastStep = computed(() => {
  const idx = enabledSteps.value.indexOf(currentStep.value)
  return idx === enabledSteps.value.length - 1
})

/**
 * Whether we can go back (not on first enabled step).
 */
const canGoBack = computed(() => {
  const idx = enabledSteps.value.indexOf(currentStep.value)
  return idx > 0
})

/**
 * Button text based on current step.
 */
const nextButtonText = computed(() => {
  if (isLastStep.value) return t('common.submit')
  return t('common.next')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Progress bar -->
    <div class="flex items-center justify-center gap-2" aria-label="Form Progress">
      <div
        v-for="(step, idx) in enabledSteps"
        :key="step"
        class="progress-step"
        :class="{
          completed: idx < (currentStepIndex - 1),
          active: step === currentStep
        }"
        :aria-label="`Step ${idx + 1}: ${stepLabels[idx]}`"
      />
    </div>

    <!-- Step indicator -->
    <p class="text-center text-xs text-muted-foreground">
      {{ $t('form.step', { current: currentStepIndex, total: totalSteps, label: stepLabels[currentStepIndex - 1] }) }}
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
        v-if="canGoBack"
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
        :class="{ 'ml-auto': !canGoBack }"
        @click="handleNext"
      >
        {{ nextButtonText }}
        <Check v-if="isLastStep" class="ml-1 h-4 w-4" />
        <ChevronRight v-else class="ml-1 h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
