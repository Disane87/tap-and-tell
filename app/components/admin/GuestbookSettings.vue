<script setup lang="ts">
/**
 * Guestbook settings editor panel.
 *
 * Allows editing welcome message, theme color, moderation toggle,
 * blur, fonts, and form step visibility. Saves via useGuestbooks().updateGuestbook().
 *
 * @props guestbook - The guestbook to edit.
 * @props tenantId - Tenant ID for API calls.
 * @emits saved - When settings are saved successfully.
 */
import { Save, RotateCcw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Guestbook, GuestbookSettings } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  guestbook: Guestbook
  tenantId: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const { updateGuestbook } = useGuestbooks(props.tenantId)

const saving = ref(false)

const fontOptions = [
  { value: 'handwritten', label: () => t('settings.fonts.handwritten') },
  { value: 'display', label: () => t('settings.fonts.display') },
  { value: 'sans', label: () => t('settings.fonts.sans') }
] as const

/** Deep clone settings from prop to local state. */
function cloneSettings(): GuestbookSettings {
  const s = props.guestbook.settings || {}
  return {
    moderationEnabled: s.moderationEnabled ?? false,
    welcomeMessage: s.welcomeMessage ?? '',
    themeColor: s.themeColor ?? undefined,
    backgroundColor: s.backgroundColor ?? undefined,
    backgroundImageUrl: s.backgroundImageUrl ?? undefined,
    cardColor: s.cardColor ?? undefined,
    cardOpacity: s.cardOpacity ?? 70,
    cardBlur: s.cardBlur ?? 20,
    titleFont: s.titleFont ?? 'handwritten',
    bodyFont: s.bodyFont ?? 'sans',
    formConfig: s.formConfig
      ? {
          steps: { ...s.formConfig.steps },
          fields: s.formConfig.fields ? { ...s.formConfig.fields } : undefined
        }
      : {
          steps: { basics: true, favorites: true, funFacts: true, message: true }
        }
  }
}

const localSettings = reactive<GuestbookSettings>(cloneSettings())

/** Expose localSettings so parent can pass it to the preview component. */
defineExpose({ localSettings })

/** Watch prop changes and re-clone. */
watch(() => props.guestbook.settings, () => {
  Object.assign(localSettings, cloneSettings())
}, { deep: true })

async function handleSave(): Promise<void> {
  saving.value = true
  const result = await updateGuestbook(props.guestbook.id, { settings: localSettings })
  saving.value = false

  if (result) {
    toast.success(t('settings.saveSuccess'))
    emit('saved')
  } else {
    toast.error(t('settings.saveFailed'))
  }
}

function handleReset(): void {
  Object.assign(localSettings, cloneSettings())
  toast.info(t('settings.resetDone'))
}

/** Reload settings after background image upload/delete. */
function handleBackgroundImageChanged(): void {
  emit('saved')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Message -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.welcomeMessage.label') }}</Label>
      <Textarea
        v-model="localSettings.welcomeMessage"
        :placeholder="t('settings.welcomeMessage.placeholder')"
        class="min-h-[80px] resize-none"
        rows="3"
      />
    </div>

    <!-- Theme Color -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">{{ t('settings.themeColor.label') }}</Label>
      <AdminColorPicker v-model="localSettings.themeColor" />
    </div>

    <!-- Fonts -->
    <div class="space-y-4">
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.titleFont.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.titleFont.description') }}</p>
        <div class="flex gap-2">
          <Button
            v-for="opt in fontOptions"
            :key="opt.value"
            size="sm"
            :variant="(localSettings.titleFont ?? 'handwritten') === opt.value ? 'default' : 'outline'"
            class="rounded-xl"
            :class="{
              'font-handwritten': opt.value === 'handwritten',
              'font-display': opt.value === 'display',
              'font-sans': opt.value === 'sans'
            }"
            @click="localSettings.titleFont = opt.value"
          >
            {{ opt.label() }}
          </Button>
        </div>
      </div>
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.bodyFont.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.bodyFont.description') }}</p>
        <div class="flex gap-2">
          <Button
            v-for="opt in fontOptions"
            :key="opt.value"
            size="sm"
            :variant="(localSettings.bodyFont ?? 'sans') === opt.value ? 'default' : 'outline'"
            class="rounded-xl"
            :class="{
              'font-handwritten': opt.value === 'handwritten',
              'font-display': opt.value === 'display',
              'font-sans': opt.value === 'sans'
            }"
            @click="localSettings.bodyFont = opt.value"
          >
            {{ opt.label() }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Background -->
    <AdminBackgroundPicker
      v-model:background-color="localSettings.backgroundColor"
      :background-image-url="localSettings.backgroundImageUrl"
      :tenant-id="props.tenantId"
      :guestbook-id="props.guestbook.id"
      @background-image-changed="handleBackgroundImageChanged"
    />

    <!-- Card Appearance -->
    <div class="space-y-4">
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.cardColor.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.cardColor.description') }}</p>
        <AdminColorPicker v-model="localSettings.cardColor" />
      </div>
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.cardOpacity.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.cardOpacity.description') }}</p>
        <div class="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            :value="localSettings.cardOpacity ?? 70"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            @input="(e: Event) => localSettings.cardOpacity = Number((e.target as HTMLInputElement).value)"
          />
          <span class="w-10 text-right text-sm text-muted-foreground">{{ localSettings.cardOpacity ?? 70 }}%</span>
        </div>
      </div>
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.cardBlur.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.cardBlur.description') }}</p>
        <div class="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="30"
            :value="localSettings.cardBlur ?? 20"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            @input="(e: Event) => localSettings.cardBlur = Number((e.target as HTMLInputElement).value)"
          />
          <span class="w-10 text-right text-sm text-muted-foreground">{{ localSettings.cardBlur ?? 20 }}px</span>
        </div>
      </div>
    </div>

    <!-- Moderation -->
    <div class="flex items-start gap-3">
      <Checkbox
        :model-value="localSettings.moderationEnabled"
        @update:model-value="(val: boolean) => localSettings.moderationEnabled = val"
        class="mt-0.5"
      />
      <div>
        <Label class="text-sm font-medium">{{ t('settings.moderation.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.moderation.description') }}</p>
      </div>
    </div>

    <!-- Form Steps -->
    <div class="space-y-3">
      <div>
        <Label class="text-sm font-medium">{{ t('settings.formSteps.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.formSteps.description') }}</p>
      </div>

      <div class="space-y-2">
        <!-- Basics (always enabled) -->
        <div class="flex items-center gap-3">
          <Checkbox :model-value="true" disabled />
          <span class="text-sm text-muted-foreground">
            {{ t('settings.formSteps.basics') }}
            <span class="text-xs italic">({{ t('settings.formSteps.alwaysEnabled') }})</span>
          </span>
        </div>

        <!-- Favorites (toggleable) -->
        <div class="flex items-center gap-3">
          <Checkbox
            :model-value="localSettings.formConfig?.steps?.favorites ?? true"
            @update:model-value="(val: boolean) => { if (localSettings.formConfig?.steps) localSettings.formConfig.steps.favorites = val }"
          />
          <span class="text-sm">{{ t('settings.formSteps.favorites') }}</span>
        </div>

        <!-- Fun Facts (toggleable) -->
        <div class="flex items-center gap-3">
          <Checkbox
            :model-value="localSettings.formConfig?.steps?.funFacts ?? true"
            @update:model-value="(val: boolean) => { if (localSettings.formConfig?.steps) localSettings.formConfig.steps.funFacts = val }"
          />
          <span class="text-sm">{{ t('settings.formSteps.funFacts') }}</span>
        </div>

        <!-- Message (always enabled) -->
        <div class="flex items-center gap-3">
          <Checkbox :model-value="true" disabled />
          <span class="text-sm text-muted-foreground">
            {{ t('settings.formSteps.message') }}
            <span class="text-xs italic">({{ t('settings.formSteps.alwaysEnabled') }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <Button
        class="flex-1"
        :disabled="saving"
        @click="handleSave"
      >
        <Save class="mr-2 h-4 w-4" />
        {{ saving ? t('common.saving') : t('settings.save') }}
      </Button>
      <Button
        variant="outline"
        :disabled="saving"
        @click="handleReset"
      >
        <RotateCcw class="mr-2 h-4 w-4" />
        {{ t('settings.reset') }}
      </Button>
    </div>
  </div>
</template>
