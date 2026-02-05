<script setup lang="ts">
/**
 * Step 4: Message - Message (required), How We Met, Best Memory (optional).
 *
 * Uses the shared form state from useGuestForm composable.
 * Error values are i18n keys that are translated for display.
 */
const { t } = useI18n()
const { formState, errors } = useGuestForm()

/** Translate error key if present. */
const messageError = computed(() => errors.message ? t(errors.message) : undefined)
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-xl font-semibold text-foreground">
        {{ $t('form.message.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('form.message.subtitle') }}
      </p>
    </div>

    <!-- Message -->
    <div class="space-y-2">
      <Label for="message">{{ $t('form.message.message') }} *</Label>
      <Textarea
        id="message"
        v-model="formState.message"
        :placeholder="$t('form.message.messagePlaceholder')"
        :class="{ 'border-destructive': errors.message }"
        rows="4"
        maxlength="1000"
      />
      <div class="flex justify-between">
        <p v-if="messageError" class="text-sm text-destructive">
          {{ messageError }}
        </p>
        <p class="ml-auto text-xs text-muted-foreground">
          {{ formState.message.length }} / 1000
        </p>
      </div>
    </div>

    <!-- How We Met -->
    <div class="space-y-2">
      <Label for="howWeMet">{{ $t('form.message.howWeMet') }}</Label>
      <Textarea
        id="howWeMet"
        v-model="formState.howWeMet"
        :placeholder="$t('form.message.howWeMetPlaceholder')"
        rows="3"
      />
    </div>

    <!-- Best Memory -->
    <div class="space-y-2">
      <Label for="bestMemory">{{ $t('form.message.bestMemory') }}</Label>
      <Textarea
        id="bestMemory"
        v-model="formState.bestMemory"
        :placeholder="$t('form.message.bestMemoryPlaceholder')"
        rows="3"
      />
    </div>
  </div>
</template>
