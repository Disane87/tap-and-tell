<script setup lang="ts">
/**
 * Share image picker for guestbook settings.
 * Uploads a dedicated Open Graph image shown in social link previews.
 *
 * @props shareImageUrl - Current share image URL.
 * @props tenantId - Tenant ID for API calls.
 * @props guestbookId - Guestbook ID for API calls.
 * @emits shareImageChanged - When the share image is uploaded or deleted.
 *   Carries the new image URL (or undefined when the image was deleted) so the
 *   parent can immediately patch its local settings and avoid a save race.
 */
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const { compressToFile } = useImageCompression()

/** Maximum source file size (50MB) before client-side compression. */
const MAX_SOURCE_SIZE = 50 * 1024 * 1024

/** True for any browser-pickable image, including HEIC/HEIF (empty MIME type). */
function isSupportedImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)
}

const props = defineProps<{
  shareImageUrl?: string
  tenantId: string
  guestbookId: string
}>()

const emit = defineEmits<{
  shareImageChanged: [url: string | undefined]
}>()

const uploading = ref(false)
const deleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!isSupportedImage(file)) {
    toast.error(t('settings.shareImage.invalidFormat'))
    input.value = ''
    return
  }

  if (file.size > MAX_SOURCE_SIZE) {
    toast.error(t('settings.shareImage.tooLarge'))
    input.value = ''
    return
  }

  uploading.value = true
  try {
    // Route through the central compression routine before upload.
    // 1200px is ample for an Open Graph / social share preview.
    const compressed = await compressToFile(file, { maxDimension: 1200 })
    const formData = new FormData()
    formData.append('file', compressed)

    const res = await $fetch<{ shareImageUrl?: string }>(
      `/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/share-image`,
      {
        method: 'POST',
        body: formData
      }
    )

    toast.success(t('settings.shareImage.uploadSuccess'))
    emit('shareImageChanged', res.shareImageUrl)
  } catch (error) {
    console.error('Failed to upload share image:', error)
    toast.error(t('settings.shareImage.uploadFailed'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleDelete(): Promise<void> {
  deleting.value = true
  try {
    await $fetch(`/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/share-image`, {
      method: 'DELETE'
    })

    toast.success(t('settings.shareImage.removeSuccess'))
    emit('shareImageChanged', undefined)
  } catch (error) {
    console.error('Failed to delete share image:', error)
    toast.error(t('settings.shareImage.removeFailed'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <Label class="text-sm font-medium">{{ t('settings.shareImage.label') }}</Label>
    <p class="text-xs text-muted-foreground">{{ t('settings.shareImage.description') }}</p>

    <!-- Current image preview (1.91:1 OG ratio) -->
    <div
      v-if="shareImageUrl"
      class="relative overflow-hidden rounded-xl border border-border/20"
    >
      <img
        :src="shareImageUrl"
        :alt="t('settings.shareImage.label')"
        class="aspect-[1200/630] w-full object-cover bg-muted/30"
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
        {{ t('settings.shareImage.remove') }}
      </Button>
    </div>

    <!-- Upload area -->
    <div
      v-else
      class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/30 py-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
      @click="triggerFileInput"
    >
      <ImageIcon class="mb-2 h-8 w-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">{{ t('settings.shareImage.upload') }}</p>
    </div>

    <!-- Upload button when image exists -->
    <Button
      v-if="shareImageUrl"
      variant="outline"
      size="sm"
      class="w-full"
      :disabled="uploading"
      @click="triggerFileInput"
    >
      <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
      <Upload v-else class="mr-2 h-4 w-4" />
      {{ t('settings.shareImage.replace') }}
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
</template>
