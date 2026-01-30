<script setup lang="ts">
/**
 * Binary toggle choice component for either/or questions.
 *
 * Displays two options as buttons. User can select one or none.
 *
 * @model modelValue - The selected value or null.
 * @props options - Array of two options with value and label.
 */
defineProps<{
  modelValue: string | null
  options: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

/**
 * Toggles selection. If already selected, deselects.
 */
function select(value: string): void {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="toggle-choice">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="toggle-choice-btn"
      :class="{ active: modelValue === option.value }"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
