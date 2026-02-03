<script setup lang="ts">
/**
 * Live preview of the form wizard configuration.
 *
 * Shows which steps are enabled and displays custom questions.
 *
 * @props settings - Current guestbook settings (reactive).
 */
import { Check, X } from 'lucide-vue-next'
import type { GuestbookSettings } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  settings: GuestbookSettings
}>()

/** Form steps with their enabled state. */
const formSteps = computed(() => [
  {
    key: 'basics',
    label: t('settings.formSteps.basics'),
    enabled: true, // Always enabled
    alwaysOn: true
  },
  {
    key: 'favorites',
    label: t('settings.formSteps.favorites'),
    enabled: props.settings.formConfig?.steps?.favorites ?? true,
    alwaysOn: false
  },
  {
    key: 'funFacts',
    label: t('settings.formSteps.funFacts'),
    enabled: props.settings.formConfig?.steps?.funFacts ?? true,
    alwaysOn: false
  },
  {
    key: 'customQuestions',
    label: t('form.steps.customQuestions'),
    enabled: (props.settings.customQuestions?.length ?? 0) > 0,
    alwaysOn: false,
    isCustom: true
  },
  {
    key: 'message',
    label: t('settings.formSteps.message'),
    enabled: true, // Always enabled
    alwaysOn: true
  }
])

/** Number of enabled steps. */
const enabledStepCount = computed(() =>
  formSteps.value.filter(s => s.enabled).length
)

/** Custom questions list. */
const customQuestions = computed(() => props.settings.customQuestions || [])
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <!-- Form Steps Preview -->
    <div>
      <Label class="mb-2 text-sm font-medium">{{ t('settings.formSteps.label') }}</Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-4">
        <!-- Progress bar visualization -->
        <div class="mb-4 flex gap-1">
          <div
            v-for="(step, index) in formSteps"
            :key="step.key"
            class="h-1.5 flex-1 rounded-full transition-colors"
            :class="step.enabled ? 'bg-primary' : 'bg-border'"
          />
        </div>

        <!-- Steps list -->
        <div class="space-y-2">
          <div
            v-for="(step, index) in formSteps"
            :key="step.key"
            class="flex items-center gap-2 rounded-lg p-2 transition-colors"
            :class="step.enabled ? 'bg-primary/10' : 'bg-muted/50 opacity-50'"
          >
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
              :class="step.enabled
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted-foreground/20 text-muted-foreground'"
            >
              {{ index + 1 }}
            </div>
            <span
              class="flex-1 text-sm"
              :class="step.enabled ? 'text-foreground' : 'text-muted-foreground line-through'"
            >
              {{ step.label }}
            </span>
            <Check v-if="step.enabled" class="h-4 w-4 text-primary" />
            <X v-else class="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <p class="mt-3 text-center text-[10px] text-muted-foreground">
          {{ enabledStepCount }} {{ enabledStepCount === 1 ? 'Step' : 'Steps' }} {{ t('common.entries').toLowerCase() }}
        </p>
      </div>
    </div>

    <!-- Custom Questions Preview -->
    <div v-if="customQuestions.length > 0">
      <Label class="mb-2 text-sm font-medium">{{ t('settings.customQuestions.label') }}</Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-4">
        <div class="space-y-2">
          <div
            v-for="(question, index) in customQuestions.slice(0, 3)"
            :key="question.id"
            class="rounded-lg bg-background/50 p-2"
          >
            <div class="flex items-start gap-2">
              <span class="text-xs text-muted-foreground">Q{{ index + 1 }}:</span>
              <span class="flex-1 text-xs text-foreground line-clamp-1">{{ question.label }}</span>
              <span
                v-if="question.required"
                class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary"
              >
                {{ t('common.required') }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-1">
              <span class="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {{ t(`settings.customQuestions.type${question.type.charAt(0).toUpperCase() + question.type.slice(1)}`) }}
              </span>
              <span v-if="question.type === 'choice' && question.options?.length" class="text-[9px] text-muted-foreground">
                ({{ question.options.length }} {{ t('settings.customQuestions.options').toLowerCase() }})
              </span>
            </div>
          </div>
          <p v-if="customQuestions.length > 3" class="text-center text-[10px] text-muted-foreground">
            +{{ customQuestions.length - 3 }} more
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
