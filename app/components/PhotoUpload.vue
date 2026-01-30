<script setup lang="ts">
/**
 * Photo upload component with camera capture and file picker.
 *
 * Encodes selected images as base64 data URIs for submission.
 * Validates file type (image/* only) and resets input for re-selection.
 *
 * @emits update:modelValue - The base64-encoded image string or null.
 */
import { Camera, Upload, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const cameraInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/** Opens the device camera for photo capture. */
function openCamera(): void {
  cameraInput.value?.click()
}

/** Opens the file picker for gallery selection. */
function openFilePicker(): void {
  fileInput.value?.click()
}

/**
 * Reads the selected file and emits it as a base64 data URI.
 * @param event - The file input change event.
 */
function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    emit('update:modelValue', reader.result as string)
  }
  reader.readAsDataURL(file)

  // Reset so the same file can be re-selected
  target.value = ''
}

/** Removes the current photo. */
function removePhoto(): void {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <!-- Hidden file inputs -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="handleFileChange"
    >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    >

    <!-- Photo preview -->
    <div v-if="props.modelValue" class="relative">
      <img
        :src="props.modelValue"
        alt="Photo preview"
        class="photo-frame h-32 w-32 object-cover"
      >
      <button
        type="button"
        class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
        aria-label="Remove photo"
        @click="removePhoto"
      >
        <X class="h-3 w-3" />
      </button>
    </div>

    <!-- Upload buttons -->
    <div v-else class="flex gap-2">
      <Button type="button" variant="outline" size="sm" @click="openCamera">
        <Camera class="mr-1.5 h-4 w-4" />
        Camera
      </Button>
      <Button type="button" variant="outline" size="sm" @click="openFilePicker">
        <Upload class="mr-1.5 h-4 w-4" />
        Upload
      </Button>
    </div>
  </div>
</template>
