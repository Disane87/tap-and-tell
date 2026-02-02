<script setup lang="ts">
/**
 * Admin theme color picker.
 * Thin wrapper around the generic ui/ColorPicker with theme-specific presets.
 *
 * @props modelValue - Current color value (hex string).
 * @emits update:modelValue - When color changes.
 */
defineProps<{
  modelValue?: string
}>()

defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const themePresets = [
  '#10b981', '#6366f1', '#f59e0b', '#f43f5e',
  '#0ea5e9', '#8b5cf6', '#f97316', '#64748b'
]
</script>

<template>
  <ColorPicker
    :model-value="modelValue"
    :presets="themePresets"
    default-picker-value="#6366f1"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
