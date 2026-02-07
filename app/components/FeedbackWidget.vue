<script setup lang="ts">
/**
 * Floating feedback widget.
 *
 * Renders a small tab on the right edge of the screen. Clicking it opens
 * a Sheet with a feedback form (type, subject, description). System metadata
 * (URL, user-agent, viewport, user ID) is collected automatically.
 */
import { MessageSquarePlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { t } = useI18n()

const open = ref(false)
const sending = ref(false)

const feedbackType = ref<string>('feedback')
const subject = ref('')
const description = ref('')

const isMobile = computed(() => window.innerWidth < 640)
const sheetSide = computed(() => isMobile.value ? 'bottom' : 'right')

function resetForm() {
  feedbackType.value = 'feedback'
  subject.value = ''
  description.value = ''
}

async function submit() {
  if (!subject.value.trim() || !description.value.trim()) return

  sending.value = true

  try {
    const payload = {
      type: feedbackType.value,
      subject: subject.value.trim(),
      description: description.value.trim(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    }

    await $fetch('/api/support/feedback', {
      method: 'POST',
      body: payload,
    })

    toast.success(t('feedback.success'))
    resetForm()
    open.value = false
  } catch (error: unknown) {
    const fetchError = error as { statusCode?: number }
    if (fetchError.statusCode === 429) {
      toast.error(t('feedback.rateLimit'))
    } else {
      toast.error(t('feedback.error'))
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <!-- Floating tab button -->
    <button
      class="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-border/50 bg-primary px-1.5 py-3 text-primary-foreground shadow-lg transition-all hover:px-2.5 hover:shadow-xl"
      :aria-label="t('feedback.tab')"
      @click="open = true"
    >
      <div class="flex flex-col items-center gap-1.5">
        <MessageSquarePlus class="h-4 w-4" />
        <span class="text-[10px] font-medium [writing-mode:vertical-lr]">
          {{ t('feedback.tab') }}
        </span>
      </div>
    </button>

    <!-- Feedback sheet -->
    <Sheet v-model:open="open">
      <SheetContent :side="sheetSide" class="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{{ t('feedback.title') }}</SheetTitle>
          <SheetDescription>{{ t('feedback.subtitle') }}</SheetDescription>
        </SheetHeader>

        <form class="flex flex-1 flex-col gap-4 overflow-y-auto py-4" @submit.prevent="submit">
          <!-- Type -->
          <div class="space-y-2">
            <Label>{{ t('feedback.type.label') }}</Label>
            <Select v-model="feedbackType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{{ t('feedback.type.bug') }}</SelectItem>
                <SelectItem value="feedback">{{ t('feedback.type.feedback') }}</SelectItem>
                <SelectItem value="question">{{ t('feedback.type.question') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Subject -->
          <div class="space-y-2">
            <Label for="feedback-subject">{{ t('feedback.subject.label') }}</Label>
            <Input
              id="feedback-subject"
              v-model="subject"
              :placeholder="t('feedback.subject.placeholder')"
              maxlength="500"
              required
            />
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <Label for="feedback-description">{{ t('feedback.description.label') }}</Label>
            <Textarea
              id="feedback-description"
              v-model="description"
              :placeholder="t('feedback.description.placeholder')"
              maxlength="2000"
              rows="5"
              required
              class="resize-none"
            />
          </div>

          <SheetFooter class="mt-auto pt-4">
            <Button type="submit" class="w-full" :disabled="sending || !subject.trim() || !description.trim()">
              {{ sending ? t('feedback.sending') : t('feedback.submit') }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>
