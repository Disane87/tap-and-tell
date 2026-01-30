<script setup lang="ts">
/**
 * Reusable binary toggle component for "this or that" questions.
 * Displays two side-by-side buttons. Tapping the selected option deselects it.
 */
interface ToggleOption {
  value: string
  label: string
  icon: string
}

interface Props {
  modelValue: string | null
  optionA: ToggleOption
  optionB: ToggleOption
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

function select(value: string) {
  if (props.disabled) return
  emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
  <div class="flex gap-2">
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all"
      :class="modelValue === optionA.value
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'"
      :disabled="disabled"
      @click="select(optionA.value)"
    >
      <span>{{ optionA.icon }}</span>
      <span>{{ optionA.label }}</span>
    </button>
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all"
      :class="modelValue === optionB.value
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'"
      :disabled="disabled"
      @click="select(optionB.value)"
    >
      <span>{{ optionB.icon }}</span>
      <span>{{ optionB.label }}</span>
    </button>
  </div>
</template>
