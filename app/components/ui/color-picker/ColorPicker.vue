<script setup lang="ts">
/**
 * Reusable color picker with preset swatches and native OS color picker.
 *
 * Displays a row of preset color circles, a "+" button that opens
 * the browser's native <input type="color"> dialog, and (when a color
 * is selected) a preview row with hex code and a clear button.
 *
 * @props modelValue  - Current hex color value (e.g. "#10b981").
 * @props presets     - Optional array of preset hex colors. Falls back to a default palette.
 * @props defaultPickerValue - Initial value shown when the native picker opens and no color is set.
 * @emits update:modelValue - Fired with the new hex string, or undefined when cleared.
 */
import { X } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string
  presets?: string[]
  defaultPickerValue?: string
}>(), {
  defaultPickerValue: '#6366f1'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const colorInput = ref<HTMLInputElement | null>(null)

const defaultPresets = [
  '#10b981', '#6366f1', '#f59e0b', '#f43f5e',
  '#0ea5e9', '#8b5cf6', '#f97316', '#64748b'
]

const activePresets = computed(() => props.presets ?? defaultPresets)

function selectPreset(color: string): void {
  emit('update:modelValue', color)
}

function handleColorInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function openColorPicker(): void {
  colorInput.value?.click()
}

function clearColor(): void {
  emit('update:modelValue', undefined)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Preset swatches + native color picker trigger -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="color in activePresets"
        :key="color"
        type="button"
        class="h-8 w-8 rounded-full border transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="modelValue === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110 border-transparent' : 'border-border/30'"
        :style="{ backgroundColor: color }"
        @click="selectPreset(color)"
      />

      <!-- Native color picker button -->
      <button
        type="button"
        class="relative flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border/50 transition-all duration-200 hover:scale-110 hover:border-primary/50"
        @click="openColorPicker"
      >
        <span class="text-xs font-bold text-muted-foreground">+</span>
        <input
          ref="colorInput"
          type="color"
          :value="modelValue || defaultPickerValue"
          class="absolute inset-0 cursor-pointer opacity-0"
          @input="handleColorInput"
        >
      </button>
    </div>

    <!-- Current color preview + clear -->
    <div v-if="modelValue" class="flex items-center gap-2">
      <div
        class="h-6 w-6 flex-shrink-0 rounded-full border border-border/30"
        :style="{ backgroundColor: modelValue }"
      />
      <span class="text-xs font-mono text-muted-foreground">{{ modelValue }}</span>
      <button
        type="button"
        class="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        @click="clearColor"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>
