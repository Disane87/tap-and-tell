<script setup lang="ts">
/**
 * Photo upload component with preview, drag-and-drop, and compression.
 *
 * Accepts images up to 10MB, compresses them client-side to max 500KB,
 * and emits the compressed base64 string to parent via v-model.
 *
 * @model modelValue - Base64-encoded image string or null.
 */
import { Camera, X, Upload, Loader2 } from 'lucide-vue-next'

const { t } = useI18n()
const { compressImage, isCompressing, compressionProgress } = useImageCompression()

const props = defineProps<{
  modelValue: string | null
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

/**
 * Maximum file size in bytes (10MB - will be compressed).
 */
const MAX_SIZE = 10 * 1024 * 1024

/**
 * Handles file selection from input or drop.
 * Compresses the image before emitting.
 */
async function handleFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    return
  }

  if (file.size > MAX_SIZE) {
    return
  }

  try {
    const compressedBase64 = await compressImage(file)
    emit('update:modelValue', compressedBase64)
  } catch (error) {
    console.error('Failed to compress image:', error)
  }
}

/**
 * Opens the file picker dialog.
 */
function openFilePicker(): void {
  fileInput.value?.click()
}

/**
 * Handles file input change event.
 */
function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    handleFile(input.files[0])
  }
}

/**
 * Handles drag enter event.
 */
function onDragEnter(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = true
}

/**
 * Handles drag leave event.
 */
function onDragLeave(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
}

/**
 * Handles drag over event.
 */
function onDragOver(e: DragEvent): void {
  e.preventDefault()
}

/**
 * Handles drop event.
 */
function onDrop(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false

  if (e.dataTransfer?.files?.[0]) {
    handleFile(e.dataTransfer.files[0])
  }
}

/**
 * Removes the current photo.
 */
function removePhoto(): void {
  emit('update:modelValue', null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <!-- Preview -->
    <div
      v-if="modelValue"
      class="relative aspect-square w-full overflow-hidden rounded-xl bg-muted"
    >
      <img
        :src="modelValue"
        alt="Photo preview"
        class="h-full w-full object-cover"
      >
      <button
        type="button"
        class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        @click="removePhoto"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Upload area -->
    <div
      v-else
      class="relative aspect-square w-full cursor-pointer rounded-xl border-2 border-dashed transition-colors"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        error ? 'border-destructive' : '',
        isCompressing ? 'pointer-events-none' : ''
      ]"
      @click="openFilePicker"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <!-- Compressing state -->
      <div v-if="isCompressing" class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Loader2 class="h-6 w-6 animate-spin text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">
            {{ $t('photo.compressing') }}
          </p>
          <div class="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full bg-primary transition-all duration-200"
              :style="{ width: `${compressionProgress}%` }"
            />
          </div>
        </div>
      </div>
      <!-- Normal upload state -->
      <div v-else class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Camera v-if="!isDragging" class="h-6 w-6 text-muted-foreground" />
          <Upload v-else class="h-6 w-6 text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">
            {{ isDragging ? $t('photo.dropHere') : $t('photo.addPhoto') }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ $t('photo.hint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    >

    <!-- Error message -->
    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>
