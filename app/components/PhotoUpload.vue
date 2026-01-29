<script setup lang="ts">
import { Camera, Upload, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Props {
  photo: string | null
  disabled?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:photo', value: string | null): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    processFile(file)
  }

  // Reset input so the same file can be selected again
  input.value = ''
}

function processFile(file: File) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result
    if (typeof result === 'string') {
      emit('update:photo', result)
    }
  }
  reader.readAsDataURL(file)
}

function openFilePicker() {
  fileInput.value?.click()
}

function openCamera() {
  cameraInput.value?.click()
}

function removePhoto() {
  emit('update:photo', null)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="photo"
      class="photo-frame relative overflow-hidden border border-border/40"
    >
      <img
        :src="photo"
        alt="Selected photo preview"
        class="aspect-video w-full object-cover"
      >
      <Button
        type="button"
        variant="destructive"
        size="icon"
        class="absolute right-2 top-2"
        :disabled="disabled"
        @click="removePhoto"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Remove photo</span>
      </Button>
    </div>

    <div v-else class="flex gap-2">
      <Button
        type="button"
        variant="outline"
        class="flex-1"
        :disabled="disabled"
        @click="openCamera"
      >
        <Camera class="mr-2 h-4 w-4" />
        Take Photo
      </Button>
      <Button
        type="button"
        variant="outline"
        class="flex-1"
        :disabled="disabled"
        @click="openFilePicker"
      >
        <Upload class="mr-2 h-4 w-4" />
        Upload
      </Button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    >

    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    >

    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>
