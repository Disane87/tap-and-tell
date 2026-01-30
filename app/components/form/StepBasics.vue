<script setup lang="ts">
/**
 * Wizard Step 1: Name and Photo (both encouraged, name required).
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FormValidation } from '~/composables/useGuestForm'

interface Props {
  name: string
  photo: string | null
  validation: FormValidation
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:name', value: string): void
  (e: 'update:photo', value: string | null): void
}>()
</script>

<template>
  <div class="space-y-5">
    <div>
      <Label for="guest-name" class="mb-1.5 block text-sm font-medium">
        Your Name <span class="text-destructive">*</span>
      </Label>
      <Input
        id="guest-name"
        :model-value="name"
        placeholder="What should we call you?"
        :disabled="disabled"
        @update:model-value="emit('update:name', $event as string)"
      />
      <p v-if="validation.name" class="mt-1 text-sm text-destructive">
        {{ validation.name }}
      </p>
    </div>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">Your Photo</Label>
      <p class="mb-2 text-xs text-muted-foreground">Take a selfie or upload a photo</p>
      <PhotoUpload
        :photo="photo"
        :disabled="disabled"
        :error="validation.photo"
        @update:photo="emit('update:photo', $event)"
      />
    </div>
  </div>
</template>
