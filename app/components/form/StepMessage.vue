<script setup lang="ts">
/**
 * Wizard Step 4: Connection messages — best memory, how we met, message to host.
 * Message is required; other fields are optional.
 */
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FormValidation } from '~/composables/useGuestForm'

interface Props {
  bestMemory: string
  howWeMet: string
  message: string
  validation: FormValidation
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:bestMemory', value: string): void
  (e: 'update:howWeMet', value: string): void
  (e: 'update:message', value: string): void
}>()
</script>

<template>
  <div class="space-y-5">
    <div>
      <Label class="mb-1.5 block text-sm font-medium">Best memory together</Label>
      <Textarea
        :model-value="bestMemory"
        placeholder="A favorite moment you shared..."
        :disabled="disabled"
        class="min-h-[80px] resize-none"
        @update:model-value="emit('update:bestMemory', $event as string)"
      />
    </div>

    <div>
      <Label class="mb-1.5 block text-sm font-medium">How did you meet?</Label>
      <Textarea
        :model-value="howWeMet"
        placeholder="The story of how you first connected..."
        :disabled="disabled"
        class="min-h-[80px] resize-none"
        @update:model-value="emit('update:howWeMet', $event as string)"
      />
    </div>

    <div>
      <Label for="guest-message" class="mb-1.5 block text-sm font-medium">
        Your Message <span class="text-destructive">*</span>
      </Label>
      <Textarea
        id="guest-message"
        :model-value="message"
        placeholder="Leave a personal message..."
        :disabled="disabled"
        class="min-h-[120px] resize-none"
        @update:model-value="emit('update:message', $event as string)"
      />
      <p v-if="validation.message" class="mt-1 text-sm text-destructive">
        {{ validation.message }}
      </p>
    </div>
  </div>
</template>
