<script setup lang="ts">
/**
 * Custom questions editor for guestbook settings.
 * Allows adding, editing, and removing custom questions.
 *
 * @props modelValue - Array of custom questions.
 * @emits update:modelValue - When questions change.
 */
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'
import type { CustomQuestion } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  modelValue: CustomQuestion[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CustomQuestion[]]
}>()

const questions = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const typeOptions = [
  { value: 'text', label: () => t('settings.customQuestions.typeText') },
  { value: 'textarea', label: () => t('settings.customQuestions.typeTextarea') },
  { value: 'choice', label: () => t('settings.customQuestions.typeChoice') }
] as const

function generateId(): string {
  return Math.random().toString(36).slice(2, 14)
}

function addQuestion(): void {
  const newQuestion: CustomQuestion = {
    id: generateId(),
    label: '',
    type: 'text',
    required: false
  }
  questions.value = [...questions.value, newQuestion]
}

function removeQuestion(id: string): void {
  questions.value = questions.value.filter(q => q.id !== id)
}

/**
 * Moves a question one position up or down in the list.
 *
 * @param index - Current index of the question.
 * @param direction - -1 to move up, +1 to move down.
 */
function moveQuestion(index: number, direction: -1 | 1): void {
  const target = index + direction
  if (target < 0 || target >= questions.value.length) return
  const next = [...questions.value]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  questions.value = next
}

function updateQuestion(id: string, updates: Partial<CustomQuestion>): void {
  questions.value = questions.value.map(q =>
    q.id === id ? { ...q, ...updates } : q
  )
}

function updateOptions(id: string, optionsText: string): void {
  const options = optionsText.split('\n').map(o => o.trim()).filter(Boolean)
  updateQuestion(id, { options })
}

function getOptionsText(question: CustomQuestion): string {
  return question.options?.join('\n') || ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <Label class="text-sm font-medium">{{ t('settings.customQuestions.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.customQuestions.description') }}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="addQuestion"
      >
        <Plus class="mr-1.5 h-4 w-4" />
        {{ t('settings.customQuestions.add') }}
      </Button>
    </div>

    <!-- Empty state -->
    <div
      v-if="questions.length === 0"
      class="rounded-xl border-2 border-dashed border-border/30 p-6 text-center"
    >
      <p class="text-sm text-muted-foreground">{{ t('settings.customQuestions.empty') }}</p>
    </div>

    <!-- Question list -->
    <div v-else class="space-y-3">
      <div
        v-for="(question, index) in questions"
        :key="question.id"
        class="rounded-xl border border-border/30 p-4 space-y-3"
      >
        <div class="flex items-start gap-2">
          <!-- Reorder controls -->
          <div class="mt-1 flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-foreground"
              :disabled="index === 0"
              :aria-label="t('settings.customQuestions.moveUp')"
              @click="moveQuestion(index, -1)"
            >
              <ChevronUp class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-foreground"
              :disabled="index === questions.length - 1"
              :aria-label="t('settings.customQuestions.moveDown')"
              @click="moveQuestion(index, 1)"
            >
              <ChevronDown class="h-4 w-4" />
            </Button>
          </div>
          <div class="flex-1 space-y-3">
            <!-- Question label -->
            <div class="space-y-1">
              <Label class="text-xs">{{ t('settings.customQuestions.questionLabel') }}</Label>
              <Input
                :model-value="question.label"
                :placeholder="t('settings.customQuestions.questionPlaceholder')"
                @update:model-value="updateQuestion(question.id, { label: $event as string })"
              />
            </div>

            <!-- Type selector -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="space-y-1">
                <Label class="text-xs">{{ t('settings.customQuestions.type') }}</Label>
                <div class="flex gap-1">
                  <Button
                    v-for="opt in typeOptions"
                    :key="opt.value"
                    size="sm"
                    :variant="question.type === opt.value ? 'default' : 'outline'"
                    class="rounded-lg text-xs"
                    @click="updateQuestion(question.id, { type: opt.value })"
                  >
                    {{ opt.label() }}
                  </Button>
                </div>
              </div>

              <!-- Required checkbox -->
              <div class="flex items-center gap-2 pt-4">
                <Checkbox
                  :model-value="question.required"
                  @update:model-value="updateQuestion(question.id, { required: $event as boolean })"
                />
                <Label class="text-xs">{{ t('settings.customQuestions.required') }}</Label>
              </div>
            </div>

            <!-- Choice options (only for choice type) -->
            <div v-if="question.type === 'choice'" class="space-y-1">
              <Label class="text-xs">{{ t('settings.customQuestions.options') }}</Label>
              <Textarea
                :model-value="getOptionsText(question)"
                :placeholder="t('settings.customQuestions.optionsPlaceholder')"
                rows="3"
                class="text-sm"
                @update:model-value="updateOptions(question.id, $event as string)"
              />
            </div>
          </div>

          <!-- Remove button -->
          <Button
            variant="ghost"
            size="sm"
            class="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            @click="removeQuestion(question.id)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
