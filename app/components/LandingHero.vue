<script setup lang="ts">
/**
 * Welcome / call-to-action hero card for the guestbook landing page.
 *
 * Renders the guestbook name, welcome message, optional header image,
 * the primary CTA button and an optional footer (text + social links),
 * all driven by guestbook settings. Used both in the mobile intro slide
 * (compact) and the desktop landing layout (wide).
 *
 * @props name - Guestbook name (falls back to a default title).
 * @props settings - Guestbook settings object.
 * @props guestbookId - Used to build the "view all" link.
 * @props wide - Widen the card for desktop layouts (default: false).
 * @props showViewAll - Show the "view all entries" link (default: false).
 * @emits cta - Primary button clicked (open the entry form).
 */
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  name?: string
  settings?: Record<string, unknown>
  guestbookId: string
  wide?: boolean
  showViewAll?: boolean
}>(), {
  name: '',
  settings: () => ({}),
  wide: false,
  showViewAll: false
})

defineEmits<{ cta: [] }>()

const { t } = useI18n()

/** Computed inline styles for the card based on cardColor, cardOpacity & cardBlur settings. */
const cardStyles = computed(() => {
  const settings = props.settings
  const styles: Record<string, string> = {}
  const color = settings?.cardColor as string | undefined
  if (color) {
    const opacity = (settings?.cardOpacity as number | undefined) ?? 70
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    styles.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }
  const blur = (settings?.cardBlur as number | undefined) ?? 20
  styles.backdropFilter = `blur(${blur}px)`
  styles.WebkitBackdropFilter = `blur(${blur}px)`
  return styles
})

/** Whether a custom card color is configured. */
const hasCustomCardColor = computed(() => !!(props.settings?.cardColor))

/** Resolved welcome message from settings or default. */
const welcomeMessage = computed(() =>
  (props.settings?.welcomeMessage as string) || t('landing.subtitle')
)

/** Font class for the title. */
const titleFontClass = computed(() => {
  switch (props.settings?.titleFont as string | undefined) {
    case 'display': return 'font-gb-display'
    case 'sans': return 'font-gb-sans'
    default: return 'font-gb-handwritten'
  }
})

/** Font class for body text. */
const bodyFontClass = computed(() => {
  switch (props.settings?.bodyFont as string | undefined) {
    case 'handwritten': return 'font-gb-handwritten'
    case 'display': return 'font-gb-display'
    default: return 'font-gb-sans'
  }
})

/** Header image URL from settings. */
const headerImageUrl = computed(() =>
  props.settings?.headerImageUrl as string | undefined
)

/** Header image position from settings. */
const headerImagePosition = computed(() =>
  (props.settings?.headerImagePosition as string | undefined) || 'above-title'
)

/** Footer text from settings. */
const footerText = computed(() =>
  props.settings?.footerText as string | undefined
)

/** Social links from settings. */
const socialLinks = computed(() =>
  (props.settings?.socialLinks as Array<{ platform: string; url: string }>) || []
)

/** Whether footer should be displayed. */
const hasFooter = computed(() => !!(footerText.value || socialLinks.value.length))

/** CTA button label from settings or default. */
const ctaButtonText = computed(() =>
  (props.settings?.ctaButtonText as string | undefined)?.trim() || t('landing.cta')
)

/** Icon name for a social platform. */
function socialIcon(platform: string): string {
  switch (platform) {
    case 'instagram': return 'lucide:instagram'
    case 'twitter': return 'lucide:twitter'
    case 'youtube': return 'lucide:youtube'
    case 'tiktok': return 'simple-icons:tiktok'
    default: return 'lucide:globe'
  }
}
</script>

<template>
  <div
    class="relative mx-auto overflow-hidden rounded-2xl border border-border/20 p-8 text-center shadow-md shadow-black"
    :class="[wide ? 'max-w-3xl' : 'max-w-sm', { 'bg-card/70': !hasCustomCardColor }]"
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
        class="mx-auto mb-4 h-20 max-w-[180px] object-contain"
      >
      <h1
        class="text-5xl text-foreground"
        :class="titleFontClass"
      >
        {{ name || t('landing.title') }}
      </h1>
      <!-- Header image below title -->
      <img
        v-if="headerImageUrl && headerImagePosition === 'below-title'"
        :src="headerImageUrl"
        alt=""
        class="mx-auto mt-4 h-20 max-w-[180px] object-contain"
      >
      <p
        class="mt-3 text-sm text-muted-foreground"
        :class="bodyFontClass"
      >
        {{ welcomeMessage }}
      </p>
      <Button class="mt-6 w-full" size="lg" @click="$emit('cta')">
        {{ ctaButtonText }}
      </Button>
      <NuxtLink
        v-if="showViewAll"
        :to="`/g/${guestbookId}/view`"
        class="mt-3 block text-sm text-muted-foreground underline hover:text-foreground"
      >
        {{ t('landing.viewAll') }}
      </NuxtLink>

      <!-- Footer -->
      <div v-if="hasFooter" class="mt-6 pt-4 border-t border-border/30">
        <p v-if="footerText" class="text-xs text-muted-foreground text-center">
          {{ footerText }}
        </p>
        <div v-if="socialLinks.length" class="mt-3 flex justify-center gap-3">
          <a
            v-for="link in socialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted-foreground hover:text-foreground transition-colors"
            :aria-label="link.platform"
          >
            <Icon :icon="socialIcon(link.platform)" class="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
