<script setup lang="ts">
import type { FormState, FormValidation, FormStatus } from '~/composables/useGuestForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  formState: FormState
  validation: FormValidation
  status: FormStatus
  isValid: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:name', value: string): void
  (e: 'update:message', value: string): void
  (e: 'update:photo', value: string | null): void
  (e: 'submit'): void
}>()

function handleSubmit(event: Event) {
  event.preventDefault()
  emit('submit')
}
</script>

<template>
  <div class="card-polaroid overflow-hidden border border-border/40">
    <div class="border-b border-border/40 px-6 py-5">
      <h2 class="font-display text-lg font-semibold text-foreground">Leave a Message</h2>
      <p class="mt-1 text-sm text-muted-foreground">Share a moment with us</p>
    </div>
    <div class="px-6 py-5">
      <form class="space-y-6" @submit="handleSubmit">
        <div class="space-y-2">
          <Label for="name">Your Name</Label>
          <Input
            id="name"
            :model-value="formState.name"
            placeholder="Enter your name"
            :disabled="status === 'submitting'"
            :class="{ 'border-destructive': validation.name }"
            @update:model-value="emit('update:name', $event as string)"
          />
          <p v-if="validation.name" class="text-sm text-destructive">
            {{ validation.name }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="message">Your Message</Label>
          <Textarea
            id="message"
            :model-value="formState.message"
            placeholder="Write your message..."
            :disabled="status === 'submitting'"
            :class="{ 'border-destructive': validation.message }"
            class="min-h-[120px] resize-none"
            @update:model-value="emit('update:message', $event as string)"
          />
          <p v-if="validation.message" class="text-sm text-destructive">
            {{ validation.message }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Photo (optional)</Label>
          <PhotoUpload
            :photo="formState.photo"
            :disabled="status === 'submitting'"
            :error="validation.photo"
            @update:photo="emit('update:photo', $event)"
          />
        </div>

        <Button
          type="submit"
          class="w-full"
          :disabled="!isValid || status === 'submitting'"
        >
          <span v-if="status === 'submitting'" class="flex items-center gap-2">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Submitting...
          </span>
          <span v-else>Submit</span>
        </Button>
      </form>
    </div>
  </div>
</template>
