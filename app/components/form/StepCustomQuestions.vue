<script setup lang="ts">
/**
 * Step 5: Custom Questions - Dynamic questions defined by guestbook owner.
 *
 * Renders text inputs, textareas, or choice selectors based on question type.
 * Shows validation errors for required fields.
 */
const { t } = useI18n()
const { formState, customQuestions, errors } = useGuestForm()

/**
 * Gets the error message for a specific question.
 */
function getError(questionId: string): string | undefined {
  return errors.customAnswers?.[questionId]
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        {{ t('form.customQuestions.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('form.customQuestions.subtitle') }}
      </p>
    </div>

    <div
      v-for="question in customQuestions"
      :key="question.id"
      class="space-y-2"
    >
      <Label :for="`custom-${question.id}`">
        {{ question.label }}
        <span v-if="question.required" class="text-destructive">*</span>
      </Label>

      <!-- Text input -->
      <Input
        v-if="question.type === 'text'"
        :id="`custom-${question.id}`"
        v-model="formState.customAnswers[question.id]"
        :class="{ 'border-destructive': getError(question.id) }"
      />

      <!-- Textarea -->
      <Textarea
        v-else-if="question.type === 'textarea'"
        :id="`custom-${question.id}`"
        v-model="formState.customAnswers[question.id]"
        :class="{ 'border-destructive': getError(question.id) }"
        rows="3"
      />

      <!-- Choice -->
      <div v-else-if="question.type === 'choice'" class="flex flex-wrap gap-2">
        <Button
          v-for="option in question.options"
          :key="option"
          type="button"
          size="sm"
          :variant="formState.customAnswers[question.id] === option ? 'default' : 'outline'"
          class="rounded-xl"
          @click="formState.customAnswers[question.id] = option"
        >
          {{ option }}
        </Button>
      </div>

      <!-- Error message -->
      <p v-if="getError(question.id)" class="text-xs text-destructive">
        {{ t('form.customQuestions.required') }}
      </p>
    </div>

    <!-- Empty state (should not happen, but defensive) -->
    <div v-if="customQuestions.length === 0" class="text-center text-sm text-muted-foreground">
      {{ t('form.customQuestions.empty') }}
    </div>
  </div>
</template>
