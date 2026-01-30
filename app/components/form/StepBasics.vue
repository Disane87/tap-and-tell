<script setup lang="ts">
/**
 * Step 1 of the guest wizard: Name (required) and Photo (optional).
 *
 * @props name / photo - Bound form values.
 * @props nameError / photoError - Validation error messages.
 * @emits update:name / update:photo - Two-way binding for form fields.
 */

defineProps<{
  name: string
  photo: string | null
  nameError: string | null
  photoError: string | null
}>()

defineEmits<{
  'update:name': [value: string]
  'update:photo': [value: string | null]
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <Label for="guest-name">Your Name *</Label>
      <Input
        id="guest-name"
        :model-value="name"
        placeholder="What should we call you?"
        :class="{ 'border-destructive': nameError }"
        @update:model-value="$emit('update:name', $event)"
      />
      <p v-if="nameError" class="text-sm text-destructive">{{ nameError }}</p>
    </div>

    <div class="space-y-2">
      <Label>Photo (optional)</Label>
      <PhotoUpload
        :model-value="photo"
        @update:model-value="$emit('update:photo', $event)"
      />
      <p v-if="photoError" class="text-sm text-destructive">{{ photoError }}</p>
    </div>
  </div>
</template>
