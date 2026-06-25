<script setup lang="ts">
/**
 * Step 1: Basics - Name (required) and Photo (optional).
 *
 * Uses the shared form state from useGuestForm composable.
 * Error values are i18n keys that are translated for display.
 */
const { t } = useI18n()
const { formState, errors } = useGuestForm()

/** Translate error key if present. */
const nameError = computed(() => errors.name ? t(errors.name) : undefined)
const mediaError = computed(() => errors.media ? t(errors.media) : undefined)
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        {{ $t('form.basics.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('form.basics.subtitle') }}
      </p>
    </div>

    <!-- Name input -->
    <div class="space-y-2">
      <Label for="name">{{ $t('form.basics.name') }} *</Label>
      <Input
        id="name"
        v-model="formState.name"
        :placeholder="$t('form.basics.namePlaceholder')"
        :class="{ 'border-destructive': errors.name }"
        maxlength="100"
      />
      <p v-if="nameError" class="text-sm text-destructive">
        {{ nameError }}
      </p>
    </div>

    <!-- Media upload (images & videos) -->
    <div class="space-y-2">
      <Label>{{ $t('form.basics.media') }} ({{ $t('common.optional') }})</Label>
      <MediaUpload
        v-model="formState.media"
        :error="mediaError"
      />
    </div>
  </div>
</template>
