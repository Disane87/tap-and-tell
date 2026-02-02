<script setup lang="ts">
/**
 * Background picker for guestbook settings.
 * Combines a color picker for background color and an image upload
 * section for background image with preview and delete.
 *
 * @props backgroundColor - Current background color value.
 * @props backgroundImageUrl - Current background image URL.
 * @props tenantId - Tenant ID for API calls.
 * @props guestbookId - Guestbook ID for API calls.
 * @emits update:backgroundColor - When background color changes.
 * @emits backgroundImageChanged - When background image is uploaded or deleted.
 */
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()

const props = defineProps<{
  backgroundColor?: string
  backgroundImageUrl?: string
  tenantId: string
  guestbookId: string
}>()

const emit = defineEmits<{
  'update:backgroundColor': [value: string | undefined]
  backgroundImageChanged: []
}>()

const uploading = ref(false)
const deleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const backgroundPresets = [
  '#10b981', '#6366f1', '#f59e0b', '#f43f5e',
  '#0ea5e9', '#8b5cf6', '#f97316', '#64748b',
  '#1e293b', '#fafafa', '#fef3c7', '#dbeafe'
]

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.error(t('settings.backgroundImage.tooLarge'))
    input.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.error(t('settings.backgroundImage.invalidFormat'))
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/background`, {
      method: 'POST',
      body: formData
    })

    toast.success(t('settings.backgroundImage.uploadSuccess'))
    emit('backgroundImageChanged')
  } catch (error) {
    console.error('Failed to upload background image:', error)
    toast.error(t('settings.backgroundImage.uploadFailed'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleDelete(): Promise<void> {
  deleting.value = true
  try {
    await $fetch(`/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/background`, {
      method: 'DELETE'
    })

    toast.success(t('settings.backgroundImage.removeSuccess'))
    emit('backgroundImageChanged')
  } catch (error) {
    console.error('Failed to delete background image:', error)
    toast.error(t('settings.backgroundImage.removeFailed'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Background Color -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.backgroundColor.label') }}</Label>
      <p class="text-xs text-muted-foreground">{{ t('settings.backgroundColor.description') }}</p>
      <ColorPicker
        :model-value="backgroundColor"
        :presets="backgroundPresets"
        default-picker-value="#1e293b"
        @update:model-value="emit('update:backgroundColor', $event)"
      />
    </div>

    <!-- Background Image -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.backgroundImage.label') }}</Label>
      <p class="text-xs text-muted-foreground">{{ t('settings.backgroundImage.hint') }}</p>

      <!-- Current image preview -->
      <div
        v-if="backgroundImageUrl"
        class="relative overflow-hidden rounded-xl border border-border/20"
      >
        <img
          :src="backgroundImageUrl"
          :alt="t('settings.backgroundImage.label')"
          class="h-32 w-full object-cover"
        >
        <Button
          variant="destructive"
          size="sm"
          class="absolute right-2 top-2"
          :disabled="deleting"
          @click="handleDelete"
        >
          <Loader2 v-if="deleting" class="mr-1.5 h-3.5 w-3.5 animate-spin" />
          <Trash2 v-else class="mr-1.5 h-3.5 w-3.5" />
          {{ t('settings.backgroundImage.remove') }}
        </Button>
      </div>

      <!-- Upload area -->
      <div
        v-else
        class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/30 py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
        @click="triggerFileInput"
      >
        <ImageIcon class="mb-2 h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">{{ t('settings.backgroundImage.upload') }}</p>
      </div>

      <!-- Upload button when image exists -->
      <Button
        v-if="backgroundImageUrl"
        variant="outline"
        size="sm"
        class="w-full"
        :disabled="uploading"
        @click="triggerFileInput"
      >
        <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
        <Upload v-else class="mr-2 h-4 w-4" />
        {{ t('settings.backgroundImage.replace') }}
      </Button>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        class="hidden"
        @change="handleFileChange"
      >
    </div>
  </div>
</template>
