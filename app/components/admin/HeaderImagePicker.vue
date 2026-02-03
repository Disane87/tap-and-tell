<script setup lang="ts">
/**
 * Header image picker for guestbook settings.
 * Allows uploading an event logo or header image with position selection.
 *
 * @props headerImageUrl - Current header image URL.
 * @props headerImagePosition - Current header image position.
 * @props tenantId - Tenant ID for API calls.
 * @props guestbookId - Guestbook ID for API calls.
 * @emits update:headerImagePosition - When header image position changes.
 * @emits headerImageChanged - When header image is uploaded or deleted.
 */
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()

const props = defineProps<{
  headerImageUrl?: string
  headerImagePosition?: 'above-title' | 'below-title' | 'behind-title'
  tenantId: string
  guestbookId: string
}>()

const emit = defineEmits<{
  'update:headerImagePosition': [value: 'above-title' | 'below-title' | 'behind-title']
  headerImageChanged: []
}>()

const uploading = ref(false)
const deleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const positionOptions = [
  { value: 'above-title', label: () => t('settings.headerImage.positions.aboveTitle') },
  { value: 'below-title', label: () => t('settings.headerImage.positions.belowTitle') },
  { value: 'behind-title', label: () => t('settings.headerImage.positions.behindTitle') }
] as const

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.error(t('settings.headerImage.tooLarge'))
    input.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.error(t('settings.headerImage.invalidFormat'))
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/header`, {
      method: 'POST',
      body: formData
    })

    toast.success(t('settings.headerImage.uploadSuccess'))
    emit('headerImageChanged')
  } catch (error) {
    console.error('Failed to upload header image:', error)
    toast.error(t('settings.headerImage.uploadFailed'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleDelete(): Promise<void> {
  deleting.value = true
  try {
    await $fetch(`/api/tenants/${props.tenantId}/guestbooks/${props.guestbookId}/header`, {
      method: 'DELETE'
    })

    toast.success(t('settings.headerImage.removeSuccess'))
    emit('headerImageChanged')
  } catch (error) {
    console.error('Failed to delete header image:', error)
    toast.error(t('settings.headerImage.removeFailed'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header Image -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.headerImage.label') }}</Label>
      <p class="text-xs text-muted-foreground">{{ t('settings.headerImage.description') }}</p>

      <!-- Current image preview -->
      <div
        v-if="headerImageUrl"
        class="relative overflow-hidden rounded-xl border border-border/20"
      >
        <img
          :src="headerImageUrl"
          :alt="t('settings.headerImage.label')"
          class="h-24 w-full object-contain bg-muted/30"
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
          {{ t('settings.headerImage.remove') }}
        </Button>
      </div>

      <!-- Upload area -->
      <div
        v-else
        class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/30 py-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
        @click="triggerFileInput"
      >
        <ImageIcon class="mb-2 h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">{{ t('settings.headerImage.upload') }}</p>
      </div>

      <!-- Upload button when image exists -->
      <Button
        v-if="headerImageUrl"
        variant="outline"
        size="sm"
        class="w-full"
        :disabled="uploading"
        @click="triggerFileInput"
      >
        <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
        <Upload v-else class="mr-2 h-4 w-4" />
        {{ t('settings.headerImage.replace') }}
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

    <!-- Position Selector (only when image exists) -->
    <div v-if="headerImageUrl" class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.headerImage.position') }}</Label>
      <div class="flex gap-2">
        <Button
          v-for="opt in positionOptions"
          :key="opt.value"
          size="sm"
          :variant="(headerImagePosition ?? 'above-title') === opt.value ? 'default' : 'outline'"
          class="rounded-xl text-xs"
          @click="emit('update:headerImagePosition', opt.value)"
        >
          {{ opt.label() }}
        </Button>
      </div>
    </div>
  </div>
</template>
