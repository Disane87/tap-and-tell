<script setup lang="ts">
/**
 * Live preview of slideshow settings.
 *
 * Shows a mini slideshow visualization with the configured
 * transition effect, interval, and overlay options.
 *
 * @props settings - Current guestbook settings (reactive).
 */
import { Play, Clock, Sparkles, User } from 'lucide-vue-next'
import type { GuestbookSettings } from '~/types/guestbook'

const { t } = useI18n()

const props = defineProps<{
  settings: GuestbookSettings
}>()

/** Current transition effect. */
const transition = computed(() => props.settings.slideshowTransition || 'fade')

/** Current interval in seconds. */
const interval = computed(() => props.settings.slideshowInterval || 8)

/** Whether to show badges. */
const showBadges = computed(() => props.settings.slideshowShowBadges ?? true)

/** Whether to show names. */
const showNames = computed(() => props.settings.slideshowShowNames ?? true)

/** Moderation enabled. */
const moderationEnabled = computed(() => props.settings.moderationEnabled ?? false)

/** Animated slide position for preview. */
const slidePosition = ref(0)
const isAnimating = ref(false)

/** Simulate transition animation. */
function animateTransition(): void {
  if (isAnimating.value) return
  isAnimating.value = true
  slidePosition.value = 1

  setTimeout(() => {
    slidePosition.value = 0
    isAnimating.value = false
  }, 600)
}

/** Start periodic animation. */
let animationInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  animationInterval = setInterval(animateTransition, 3000)
})

onUnmounted(() => {
  if (animationInterval) {
    clearInterval(animationInterval)
  }
})
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <!-- Slideshow Preview -->
    <div>
      <Label class="mb-2 text-sm font-medium">{{ t('settings.slideshow.label') }}</Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30">
        <!-- Mini slideshow screen -->
        <div class="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          <!-- Slide content -->
          <div
            class="absolute inset-0 flex items-center justify-center transition-all duration-500"
            :class="{
              'opacity-0': slidePosition === 1 && transition === 'fade',
              'translate-x-full': slidePosition === 1 && transition === 'slide',
              'scale-50 opacity-0': slidePosition === 1 && transition === 'zoom'
            }"
          >
            <!-- Mock photo -->
            <div class="relative">
              <div class="h-16 w-16 rounded-xl bg-primary/30 flex items-center justify-center">
                <span class="font-handwritten text-2xl text-primary/70">E</span>
              </div>

              <!-- Name overlay -->
              <div
                v-if="showNames"
                class="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card/80 px-2 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm"
              >
                Emma
              </div>
            </div>
          </div>

          <!-- Badges overlay -->
          <div
            v-if="showBadges"
            class="absolute bottom-2 left-2 right-2 flex justify-center gap-1"
          >
            <span class="rounded-full bg-card/80 px-1.5 py-0.5 text-[8px] backdrop-blur-sm">
              ☕ Coffee
            </span>
            <span class="rounded-full bg-card/80 px-1.5 py-0.5 text-[8px] backdrop-blur-sm">
              🏔️ Mountains
            </span>
          </div>

          <!-- Play indicator -->
          <div class="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-card/80 px-2 py-1 backdrop-blur-sm">
            <Play class="h-3 w-3 text-primary" fill="currentColor" />
            <span class="text-[9px] text-foreground">{{ interval }}s</span>
          </div>

          <!-- Transition indicator -->
          <div class="absolute top-2 left-2 rounded-full bg-card/80 px-2 py-1 backdrop-blur-sm">
            <span class="text-[9px] text-foreground capitalize">{{ t(`settings.slideshow.${transition}`) }}</span>
          </div>
        </div>

        <!-- Settings indicators -->
        <div class="flex items-center justify-center gap-4 border-t border-border/20 bg-background/50 px-3 py-2">
          <div class="flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5 text-muted-foreground" />
            <span class="text-[10px] text-muted-foreground">{{ interval }}s</span>
          </div>
          <div class="flex items-center gap-1.5">
            <User
              class="h-3.5 w-3.5"
              :class="showNames ? 'text-primary' : 'text-muted-foreground/40'"
            />
            <span
              class="text-[10px]"
              :class="showNames ? 'text-foreground' : 'text-muted-foreground/40 line-through'"
            >
              {{ t('settings.slideshow.showNames') }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <Sparkles
              class="h-3.5 w-3.5"
              :class="showBadges ? 'text-primary' : 'text-muted-foreground/40'"
            />
            <span
              class="text-[10px]"
              :class="showBadges ? 'text-foreground' : 'text-muted-foreground/40 line-through'"
            >
              Badges
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Moderation Status -->
    <div>
      <Label class="mb-2 text-sm font-medium">{{ t('settings.moderation.label') }}</Label>
      <div class="overflow-hidden rounded-xl border border-border/20 bg-muted/30 p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="moderationEnabled ? 'bg-primary/15' : 'bg-muted'"
          >
            <svg
              class="h-5 w-5"
              :class="moderationEnabled ? 'text-primary' : 'text-muted-foreground'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p
              class="text-sm font-medium"
              :class="moderationEnabled ? 'text-foreground' : 'text-muted-foreground'"
            >
              {{ moderationEnabled ? 'Moderation aktiv' : 'Moderation inaktiv' }}
            </p>
            <p class="text-[10px] text-muted-foreground">
              {{ moderationEnabled
                ? 'Einträge müssen genehmigt werden'
                : 'Einträge werden sofort angezeigt'
              }}
            </p>
          </div>
          <div
            class="h-3 w-3 rounded-full"
            :class="moderationEnabled ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
