<script setup lang="ts">
/**
 * Guestbook settings editor panel with tabs.
 *
 * Organized into tabs:
 * - Landing Page: welcome message, CTA, background, header, footer, color scheme
 * - Cards & Display: card style, fonts, view layout, card appearance
 * - Form: form steps, custom questions
 * - Advanced: slideshow settings, moderation
 *
 * @props guestbook - The guestbook to edit.
 * @props tenantId - Tenant ID for API calls.
 * @emits saved - When settings are saved successfully.
 * @emits tab-change - When active tab changes (for preview switching).
 */
import { Save, RotateCcw, Plus, Trash2, Instagram, Twitter, Globe, Youtube } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Guestbook, GuestbookSettings, SocialLink } from '~/types/guestbook'

export type SettingsTab = 'landing' | 'cards' | 'form' | 'advanced'

const socialPlatforms = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Globe }
] as const

const { t } = useI18n()

const props = defineProps<{
  guestbook: Guestbook
  tenantId: string
}>()

const emit = defineEmits<{
  saved: []
  'tab-change': [tab: SettingsTab]
}>()

const { updateGuestbook } = useGuestbooks(props.tenantId)

const saving = ref(false)
const activeTab = ref<SettingsTab>('landing')

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
    textColor: s.textColor ?? undefined,
    backgroundColor: s.backgroundColor ?? undefined,
    backgroundImageUrl: s.backgroundImageUrl ?? undefined,
    cardColor: s.cardColor ?? undefined,
    cardOpacity: s.cardOpacity ?? 70,
    cardBlur: s.cardBlur ?? 20,
    titleFont: s.titleFont ?? 'handwritten',
    bodyFont: s.bodyFont ?? 'sans',
    ctaButtonText: s.ctaButtonText ?? '',
    headerImageUrl: s.headerImageUrl ?? undefined,
    headerImagePosition: s.headerImagePosition ?? 'above-title',
    cardStyle: s.cardStyle ?? 'polaroid',
    customQuestions: s.customQuestions ? [...s.customQuestions] : [],
    viewLayout: s.viewLayout ?? 'grid',
    slideshowInterval: s.slideshowInterval ?? 8,
    slideshowTransition: s.slideshowTransition ?? 'fade',
    slideshowShowBadges: s.slideshowShowBadges ?? true,
    slideshowShowNames: s.slideshowShowNames ?? true,
    colorScheme: s.colorScheme ?? 'system',
    footerText: s.footerText ?? '',
    socialLinks: s.socialLinks ? [...s.socialLinks] : [],
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

/** Expose localSettings and activeTab so parent can use them. */
defineExpose({ localSettings, activeTab })

/** Watch prop changes and re-clone. */
watch(() => props.guestbook.settings, () => {
  Object.assign(localSettings, cloneSettings())
}, { deep: true })

/** Emit tab change when activeTab changes. */
watch(activeTab, (tab) => {
  emit('tab-change', tab)
})

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

function setTab(tab: SettingsTab): void {
  activeTab.value = tab
}
</script>

<template>
  <div class="space-y-4">
    <!-- Tabs -->
    <div class="flex gap-1 rounded-xl bg-muted/50 p-1">
      <button
        v-for="tab in (['landing', 'cards', 'form', 'advanced'] as const)"
        :key="tab"
        type="button"
        class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'"
        @click="setTab(tab)"
      >
        {{ t(`settings.tabs.${tab}`) }}
      </button>
    </div>

    <!-- Landing Page Tab -->
    <div v-show="activeTab === 'landing'" class="space-y-6">
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

      <!-- CTA Button Text -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.ctaButtonText.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.ctaButtonText.description') }}</p>
        <Input
          v-model="localSettings.ctaButtonText"
          :placeholder="t('settings.ctaButtonText.placeholder')"
        />
      </div>

      <!-- Theme Color -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.themeColor.label') }}</Label>
        <AdminColorPicker v-model="localSettings.themeColor" />
      </div>

      <!-- Text Color -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.textColor.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.textColor.description') }}</p>
        <AdminColorPicker v-model="localSettings.textColor" />
      </div>

      <!-- Background -->
      <AdminBackgroundPicker
        v-model:background-color="localSettings.backgroundColor"
        :background-image-url="localSettings.backgroundImageUrl"
        :tenant-id="props.tenantId"
        :guestbook-id="props.guestbook.id"
        @background-image-changed="handleBackgroundImageChanged"
      />

      <!-- Header Image -->
      <AdminHeaderImagePicker
        v-model:header-image-position="localSettings.headerImagePosition"
        :header-image-url="localSettings.headerImageUrl"
        :tenant-id="props.tenantId"
        :guestbook-id="props.guestbook.id"
        @header-image-changed="handleBackgroundImageChanged"
      />

      <!-- Color Scheme -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.colorScheme.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.colorScheme.description') }}</p>
        <div class="flex gap-2">
          <Button
            v-for="scheme in (['system', 'light', 'dark'] as const)"
            :key="scheme"
            size="sm"
            :variant="(localSettings.colorScheme ?? 'system') === scheme ? 'default' : 'outline'"
            class="rounded-xl"
            @click="localSettings.colorScheme = scheme"
          >
            {{ t(`settings.colorScheme.${scheme}`) }}
          </Button>
        </div>
      </div>

      <!-- Footer Settings -->
      <div class="space-y-4">
        <div>
          <Label class="text-sm font-medium">{{ t('settings.footer.label') }}</Label>
          <p class="text-xs text-muted-foreground">{{ t('settings.footer.description') }}</p>
        </div>

        <!-- Footer Text -->
        <div class="space-y-2">
          <Label class="text-xs">{{ t('settings.footer.text') }}</Label>
          <Input
            v-model="localSettings.footerText"
            :placeholder="t('settings.footer.textPlaceholder')"
          />
        </div>

        <!-- Social Links -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs">{{ t('settings.footer.socialLinks') }}</Label>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 text-xs"
              @click="localSettings.socialLinks = [...(localSettings.socialLinks || []), { platform: 'instagram', url: '' }]"
            >
              <Plus class="mr-1 h-3 w-3" />
              {{ t('settings.footer.addLink') }}
            </Button>
          </div>

          <div v-if="!localSettings.socialLinks?.length" class="rounded-lg border-2 border-dashed border-border/30 p-4 text-center">
            <p class="text-xs text-muted-foreground">{{ t('settings.footer.noLinks') }}</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(link, index) in localSettings.socialLinks"
              :key="index"
              class="flex items-center gap-2"
            >
              <Select
                :model-value="link.platform"
                @update:model-value="(val: string) => localSettings.socialLinks![index].platform = val as SocialLink['platform']"
              >
                <SelectTrigger class="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in socialPlatforms" :key="p.value" :value="p.value">
                    {{ p.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                :model-value="link.url"
                :placeholder="t('settings.footer.urlPlaceholder')"
                class="flex-1"
                @update:model-value="localSettings.socialLinks![index].url = $event as string"
              />
              <Button
                variant="ghost"
                size="sm"
                class="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                @click="localSettings.socialLinks = localSettings.socialLinks!.filter((_, i) => i !== index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards & Display Tab -->
    <div v-show="activeTab === 'cards'" class="space-y-6">
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

      <!-- Entry Card Style -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.cardStyle.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.cardStyle.description') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="style in (['polaroid', 'minimal', 'rounded', 'bordered'] as const)"
            :key="style"
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors"
            :class="(localSettings.cardStyle ?? 'polaroid') === style
              ? 'border-primary bg-primary/5'
              : 'border-border/30 hover:border-border'"
            @click="localSettings.cardStyle = style"
          >
            <span class="block text-sm font-medium">{{ t(`settings.cardStyle.${style}`) }}</span>
            <span class="block text-xs text-muted-foreground">{{ t(`settings.cardStyle.${style}Desc`) }}</span>
          </button>
        </div>
      </div>

      <!-- View Layout -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">{{ t('settings.viewLayout.label') }}</Label>
        <p class="text-xs text-muted-foreground">{{ t('settings.viewLayout.description') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="layout in (['grid', 'masonry', 'list', 'timeline'] as const)"
            :key="layout"
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors"
            :class="(localSettings.viewLayout ?? 'grid') === layout
              ? 'border-primary bg-primary/5'
              : 'border-border/30 hover:border-border'"
            @click="localSettings.viewLayout = layout"
          >
            <span class="block text-sm font-medium">{{ t(`settings.viewLayout.${layout}`) }}</span>
            <span class="block text-xs text-muted-foreground">{{ t(`settings.viewLayout.${layout}Desc`) }}</span>
          </button>
        </div>
      </div>

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
            <Slider
              :model-value="[localSettings.cardOpacity ?? 70]"
              :min="0"
              :max="100"
              :step="1"
              class="w-full"
              @update:model-value="(val: number[]) => localSettings.cardOpacity = val[0]"
            />
            <span class="w-10 text-right text-sm text-muted-foreground">{{ localSettings.cardOpacity ?? 70 }}%</span>
          </div>
        </div>
        <div class="space-y-2">
          <Label class="text-sm font-medium">{{ t('settings.cardBlur.label') }}</Label>
          <p class="text-xs text-muted-foreground">{{ t('settings.cardBlur.description') }}</p>
          <div class="flex items-center gap-3">
            <Slider
              :model-value="[localSettings.cardBlur ?? 20]"
              :min="0"
              :max="30"
              :step="1"
              class="w-full"
              @update:model-value="(val: number[]) => localSettings.cardBlur = val[0]"
            />
            <span class="w-10 text-right text-sm text-muted-foreground">{{ localSettings.cardBlur ?? 20 }}px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Tab -->
    <div v-show="activeTab === 'form'" class="space-y-6">
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

      <!-- Custom Questions -->
      <AdminCustomQuestionsEditor v-model="localSettings.customQuestions" />
    </div>

    <!-- Advanced Tab -->
    <div v-show="activeTab === 'advanced'" class="space-y-6">
      <!-- Slideshow Settings -->
      <div class="space-y-4">
        <div>
          <Label class="text-sm font-medium">{{ t('settings.slideshow.label') }}</Label>
          <p class="text-xs text-muted-foreground">{{ t('settings.slideshow.description') }}</p>
        </div>

        <!-- Interval -->
        <div class="space-y-2">
          <Label class="text-xs">{{ t('settings.slideshow.interval') }}</Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="sec in ([3, 5, 8, 10, 15, 30] as const)"
              :key="sec"
              size="sm"
              :variant="(localSettings.slideshowInterval ?? 8) === sec ? 'default' : 'outline'"
              class="rounded-lg"
              @click="localSettings.slideshowInterval = sec"
            >
              {{ sec }}s
            </Button>
          </div>
        </div>

        <!-- Transition -->
        <div class="space-y-2">
          <Label class="text-xs">{{ t('settings.slideshow.transition') }}</Label>
          <div class="flex gap-2">
            <Button
              v-for="trans in (['fade', 'slide', 'zoom'] as const)"
              :key="trans"
              size="sm"
              :variant="(localSettings.slideshowTransition ?? 'fade') === trans ? 'default' : 'outline'"
              class="rounded-lg"
              @click="localSettings.slideshowTransition = trans"
            >
              {{ t(`settings.slideshow.${trans}`) }}
            </Button>
          </div>
        </div>

        <!-- Show toggles -->
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Checkbox
              :model-value="localSettings.slideshowShowNames ?? true"
              @update:model-value="(val: boolean) => localSettings.slideshowShowNames = val"
            />
            <span class="text-sm">{{ t('settings.slideshow.showNames') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <Checkbox
              :model-value="localSettings.slideshowShowBadges ?? true"
              @update:model-value="(val: boolean) => localSettings.slideshowShowBadges = val"
            />
            <span class="text-sm">{{ t('settings.slideshow.showBadges') }}</span>
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
    </div>

    <!-- Actions (always visible) -->
    <div class="flex gap-3 pt-4 border-t border-border/20">
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
