<script setup lang="ts">
/**
 * Step 4 of the guest wizard: Our Story and Message (message required).
 *
 * Fields: Best Memory (optional), How We Met (optional), Message to Host (required).
 */

defineProps<{
  bestMemory: string
  howWeMet: string
  message: string
  messageError: string | null
}>()

defineEmits<{
  'update:bestMemory': [value: string]
  'update:howWeMet': [value: string]
  'update:message': [value: string]
}>()
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <Label for="best-memory">Best Memory Together</Label>
      <Textarea
        id="best-memory"
        :model-value="bestMemory"
        placeholder="A favorite moment you shared..."
        rows="2"
        @update:model-value="$emit('update:bestMemory', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="how-we-met">How We Met</Label>
      <Textarea
        id="how-we-met"
        :model-value="howWeMet"
        placeholder="The story of how you met..."
        rows="2"
        @update:model-value="$emit('update:howWeMet', $event)"
      />
    </div>

    <div class="space-y-2">
      <Label for="guest-message">Your Message *</Label>
      <Textarea
        id="guest-message"
        :model-value="message"
        placeholder="Leave a message for the host..."
        rows="4"
        :class="{ 'border-destructive': messageError }"
        @update:model-value="$emit('update:message', $event)"
      />
      <p v-if="messageError" class="text-sm text-destructive">{{ messageError }}</p>
    </div>
  </div>
</template>
