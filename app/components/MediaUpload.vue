<script setup lang="ts">
/**
 * Multi-media upload component for guest entries.
 *
 * Lets a guest attach **multiple images and/or videos** to a single entry.
 * Images pass through the central client-side compression routine
 * ({@link useImageCompression}); videos are read as-is (browsers cannot
 * compress them) and only size-checked. The component emits an ordered array
 * of base64 data URLs via v-model — order in the grid is the display order.
 *
 * Failures surface a user-facing toast instead of failing silently.
 *
 * @model modelValue - Ordered array of base64 data URLs (images and videos).
 */
import { toast } from 'vue-sonner'
import { Camera, X, Upload, Loader2, Play, Plus } from 'lucide-vue-next'

const { t } = useI18n()
const { compressImage } = useImageCompression()

const props = defineProps<{
  modelValue: string[]
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const isDragging = ref(false)
const isProcessing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

/**
 * Maximum source image size in bytes (50 MB). Anything within this is
 * compressed client-side to ~1 MB before upload; the cap only guards against
 * decoding absurdly large files that could exhaust device memory.
 */
const MAX_IMAGE_SIZE = 50 * 1024 * 1024

/**
 * Maximum video size in bytes (50 MB). Videos are not compressed, so this
 * matches the server-side cap to fail fast before uploading.
 */
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

/** Whether a picked file is an image we can decode (incl. HEIC/HEIF). */
function isImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(heic|heif)$/i.test(file.name)
}

/** Whether a picked file is a video. */
function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

/** Whether a stored data URL is a video. */
function isVideoUrl(url: string): boolean {
  return url.startsWith('data:video/') || url.startsWith('data:application/octet-stream')
}

/**
 * Reads a file into a base64 data URL (used for videos, which are not compressed).
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Processes the given files (compressing images, reading videos) and appends
 * the resulting data URLs to the model in selection order.
 */
async function handleFiles(files: File[]): Promise<void> {
  if (files.length === 0) return

  isProcessing.value = true
  const added: string[] = []
  try {
    for (const file of files) {
      if (isImage(file)) {
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error(t('media.errorImageTooLarge', { name: file.name }))
          continue
        }
        try {
          added.push(await compressImage(file))
        }
        catch (error) {
          console.error('Failed to compress image:', error)
          toast.error(t('media.errorProcessing', { name: file.name }))
        }
      }
      else if (isVideo(file)) {
        if (file.size > MAX_VIDEO_SIZE) {
          toast.error(t('media.errorVideoTooLarge', { name: file.name }))
          continue
        }
        try {
          added.push(await readAsDataUrl(file))
        }
        catch (error) {
          console.error('Failed to read video:', error)
          toast.error(t('media.errorProcessing', { name: file.name }))
        }
      }
      else {
        toast.error(t('media.errorInvalidType', { name: file.name }))
      }
    }

    if (added.length > 0) {
      emit('update:modelValue', [...props.modelValue, ...added])
    }
  }
  finally {
    isProcessing.value = false
  }
}

/** Opens the file picker dialog. */
function openFilePicker(): void {
  fileInput.value?.click()
}

/** Handles file input change event. */
function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    handleFiles(Array.from(input.files))
  }
  // Reset so picking the same file again re-triggers change.
  if (fileInput.value) fileInput.value.value = ''
}

function onDragEnter(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
}

function onDragOver(e: DragEvent): void {
  e.preventDefault()
}

function onDrop(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    handleFiles(Array.from(e.dataTransfer.files))
  }
}

/** Removes the media item at the given index. */
function removeAt(index: number): void {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Preview grid -->
    <div v-if="modelValue.length > 0" class="grid grid-cols-3 gap-2">
      <div
        v-for="(url, index) in modelValue"
        :key="index"
        class="relative aspect-square overflow-hidden rounded-xl bg-muted"
      >
        <video
          v-if="isVideoUrl(url)"
          :src="url"
          class="h-full w-full object-cover"
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          :src="url"
          alt="Media preview"
          class="h-full w-full object-cover"
        >

        <!-- Video indicator -->
        <div
          v-if="isVideoUrl(url)"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
            <Play class="h-5 w-5" />
          </div>
        </div>

        <!-- Remove button -->
        <button
          type="button"
          :aria-label="$t('media.remove')"
          class="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          @click="removeAt(index)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Add-more tile -->
      <button
        type="button"
        class="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        :class="isProcessing ? 'pointer-events-none opacity-60' : ''"
        @click="openFilePicker"
      >
        <Loader2 v-if="isProcessing" class="h-5 w-5 animate-spin" />
        <Plus v-else class="h-5 w-5" />
        <span class="text-xs">{{ $t('media.addMore') }}</span>
      </button>
    </div>

    <!-- Empty upload area -->
    <div
      v-else
      class="relative aspect-video w-full cursor-pointer rounded-xl border-2 border-dashed transition-colors"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        error ? 'border-destructive' : '',
        isProcessing ? 'pointer-events-none' : ''
      ]"
      @click="openFilePicker"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <div v-if="isProcessing" class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Loader2 class="h-6 w-6 animate-spin text-primary" />
        </div>
        <p class="text-sm font-medium text-foreground">
          {{ $t('media.processing') }}
        </p>
      </div>
      <div v-else class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Camera v-if="!isDragging" class="h-6 w-6 text-muted-foreground" />
          <Upload v-else class="h-6 w-6 text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">
            {{ isDragging ? $t('media.dropHere') : $t('media.addMedia') }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ $t('media.hint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*,video/*"
      multiple
      class="hidden"
      @change="onFileChange"
    >

    <!-- Error message -->
    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>
