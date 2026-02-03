<script setup lang="ts">
/**
 * Live preview of the guestbook landing page card.
 *
 * Renders a scaled-down version of the intro card so admins
 * can see how their settings look in real-time.
 *
 * @props settings - Current guestbook settings (reactive).
 * @props guestbookName - Name of the guestbook.
 */
import type { GuestbookSettings } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  settings: GuestbookSettings
  guestbookName: string
}>()

/** Whether the admin has set a custom background (color or image). */
const hasCustomBackground = computed(() => {
  return !!(props.settings.backgroundColor || props.settings.backgroundImageUrl)
})

/** Computed background styles from settings. */
const backgroundStyles = computed(() => {
  const styles: Record<string, string> = {}
  if (props.settings.backgroundColor) {
    styles.backgroundColor = props.settings.backgroundColor
  }
  if (props.settings.backgroundImageUrl) {
    styles.backgroundImage = `url(${props.settings.backgroundImageUrl})`
    styles.backgroundSize = 'cover'
    styles.backgroundPosition = 'center'
    styles.backgroundRepeat = 'no-repeat'
  }
  return styles
})

/** Computed inline styles for the info card based on cardColor, cardOpacity & cardBlur. */
const cardStyles = computed(() => {
  const styles: Record<string, string> = {}
  const color = props.settings.cardColor
  if (color) {
    const opacity = props.settings.cardOpacity ?? 70
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    styles.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }
  const blur = props.settings.cardBlur ?? 20
  styles.backdropFilter = `blur(${blur}px)`
  styles.WebkitBackdropFilter = `blur(${blur}px)`
  return styles
})

/** Whether a custom card color is configured. */
const hasCustomCardColor = computed(() => !!props.settings.cardColor)

/** Resolved welcome message from settings or default. */
const welcomeMessage = computed(() =>
  props.settings.welcomeMessage || t('landing.subtitle')
)

/** Resolved CTA button text from settings or default. */
const ctaButtonText = computed(() =>
  props.settings.ctaButtonText || t('landing.cta')
)

/** Header image URL from settings. */
const headerImageUrl = computed(() => props.settings.headerImageUrl)

/** Header image position from settings. */
const headerImagePosition = computed(() =>
  props.settings.headerImagePosition || 'above-title'
)

/** Font class for the title. */
const titleFontClass = computed(() => {
  switch (props.settings.titleFont) {
    case 'display': return 'font-display'
    case 'sans': return 'font-sans'
    default: return 'font-handwritten'
  }
})

/** Font class for the body text. */
const bodyFontClass = computed(() => {
  switch (props.settings.bodyFont) {
    case 'handwritten': return 'font-handwritten'
    case 'display': return 'font-display'
    default: return 'font-sans'
  }
})

/** Custom text color from settings. */
const textColorStyle = computed(() =>
  props.settings.textColor ? { color: props.settings.textColor } : {}
)
</script>

<template>
  <div class="flex h-full flex-col">
    <Label class="mb-2 text-sm font-medium">{{ t('settings.preview') }}</Label>
    <div class="flex-1 overflow-hidden rounded-xl border border-border/20">
      <div
        class="relative flex h-full min-h-[320px] items-center justify-center"
        :style="backgroundStyles"
        :class="{ 'landing-gradient': !hasCustomBackground }"
      >
        <div
          class="relative mx-4 max-w-[200px] overflow-hidden rounded-2xl border border-border/20 p-5 text-center shadow-xl"
          :class="{ 'bg-card/70': !hasCustomCardColor }"
          :style="cardStyles"
        >
          <!-- Header image behind title -->
          <img
            v-if="headerImageUrl && headerImagePosition === 'behind-title'"
            :src="headerImageUrl"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-20"
          >
          <div class="relative">
            <!-- Header image above title -->
            <img
              v-if="headerImageUrl && headerImagePosition === 'above-title'"
              :src="headerImageUrl"
              alt=""
              class="mx-auto mb-2 h-10 max-w-[100px] object-contain"
            >
            <h2
              class="text-2xl"
              :class="[titleFontClass, textColorStyle.color ? '' : 'text-foreground']"
              :style="textColorStyle"
            >
              {{ guestbookName || t('landing.title') }}
            </h2>
            <!-- Header image below title -->
            <img
              v-if="headerImageUrl && headerImagePosition === 'below-title'"
              :src="headerImageUrl"
              alt=""
              class="mx-auto mt-2 h-10 max-w-[100px] object-contain"
            >
            <p
              class="mt-1.5 text-[10px] leading-tight"
              :class="[bodyFontClass, textColorStyle.color ? 'opacity-80' : 'text-muted-foreground']"
              :style="textColorStyle"
            >
              {{ welcomeMessage }}
            </p>
            <div
              class="mt-3 rounded-md px-3 py-1.5 text-[10px] font-medium text-primary-foreground"
              :class="bodyFontClass"
              :style="{ backgroundColor: settings.themeColor || 'hsl(var(--primary))' }"
            >
              {{ ctaButtonText }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
