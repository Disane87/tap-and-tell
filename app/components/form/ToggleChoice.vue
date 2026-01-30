<script setup lang="ts">
/**
 * Reusable binary toggle choice (e.g., Coffee vs Tea).
 *
 * Two side-by-side buttons; the selected one is highlighted.
 * Tapping the already-selected option deselects it (sets to null).
 *
 * @props modelValue - Current selection or null.
 * @props optionA / optionB - The two choices with label and value.
 * @emits update:modelValue - The selected value or null.
 */

defineProps<{
  modelValue: string | null
  optionA: { label: string; value: string }
  optionB: { label: string; value: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

/** Toggles selection: selects if different, deselects if same. */
function select(value: string, current: string | null): void {
  emit('update:modelValue', current === value ? null : value)
}
</script>

<template>
  <div class="flex gap-2">
    <button
      type="button"
      class="flex-1 rounded-lg border px-3 py-2 text-sm transition-all"
      :class="modelValue === optionA.value
        ? 'border-primary bg-primary/10 text-primary font-medium'
        : 'border-border text-muted-foreground hover:border-primary/50'"
      @click="select(optionA.value, modelValue)"
    >
      {{ optionA.label }}
    </button>
    <button
      type="button"
      class="flex-1 rounded-lg border px-3 py-2 text-sm transition-all"
      :class="modelValue === optionB.value
        ? 'border-primary bg-primary/10 text-primary font-medium'
        : 'border-border text-muted-foreground hover:border-primary/50'"
      @click="select(optionB.value, modelValue)"
    >
      {{ optionB.label }}
    </button>
  </div>
</template>
