<script setup lang="ts">
/**
 * GDPR-compliant cookie consent banner.
 *
 * Shows on first visit or when consent needs renewal.
 * Glassmorphism design, fixed at bottom of viewport.
 */
import { Cookie, Settings, Check, X } from 'lucide-vue-next'

const { t } = useI18n()
const {
  showBanner,
  showSettings,
  consent,
  acceptAll,
  acceptNecessary,
  savePreferences,
  openSettings,
  closeSettings,
  init
} = useCookieConsent()

// Local state for settings dialog
const functionalEnabled = ref(false)
const analyticsEnabled = ref(false)

// Initialize on mount
onMounted(() => {
  init()
})

// Sync local state when settings dialog opens
watch(showSettings, (open) => {
  if (open) {
    functionalEnabled.value = consent.value?.functional ?? false
    analyticsEnabled.value = consent.value?.analytics ?? false
  }
})

function handleSavePreferences() {
  savePreferences({
    functional: functionalEnabled.value,
    analytics: analyticsEnabled.value
  })
}
</script>

<template>
  <!-- Cookie Banner -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showBanner && !showSettings"
        class="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6"
      >
        <div
          class="mx-auto max-w-4xl rounded-2xl border border-border/30 bg-card/80 p-4 shadow-xl backdrop-blur-xl sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <!-- Icon & Text -->
            <div class="flex flex-1 gap-4">
              <div class="hidden shrink-0 sm:block">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Cookie class="h-6 w-6 text-primary" />
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold text-foreground sm:text-lg">
                  {{ t('cookies.banner.title') }}
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ t('cookies.banner.description') }}
                </p>
                <button
                  class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  @click="openSettings"
                >
                  <Settings class="h-3.5 w-3.5" />
                  {{ t('cookies.banner.customize') }}
                </button>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                class="rounded-full"
                @click="acceptNecessary"
              >
                {{ t('cookies.banner.acceptNecessary') }}
              </Button>
              <Button
                size="sm"
                class="rounded-full"
                @click="acceptAll"
              >
                {{ t('cookies.banner.acceptAll') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Cookie Settings Dialog -->
    <Dialog :open="showSettings" @update:open="(open: boolean) => !open && closeSettings()">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Cookie class="h-5 w-5 text-primary" />
            {{ t('cookies.settings.title') }}
          </DialogTitle>
          <DialogDescription>
            {{ t('cookies.settings.description') }}
          </DialogDescription>
        </DialogHeader>

        <div class="mt-4 space-y-4">
          <!-- Necessary Cookies -->
          <div class="rounded-xl border border-border/30 bg-muted/30 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h4 class="font-medium text-foreground">
                  {{ t('cookies.categories.necessary.title') }}
                </h4>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ t('cookies.categories.necessary.description') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-muted-foreground">
                  {{ t('cookies.alwaysActive') }}
                </span>
                <Switch disabled :checked="true" />
              </div>
            </div>
          </div>

          <!-- Functional Cookies -->
          <div class="rounded-xl border border-border/30 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h4 class="font-medium text-foreground">
                  {{ t('cookies.categories.functional.title') }}
                </h4>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ t('cookies.categories.functional.description') }}
                </p>
              </div>
              <Switch v-model:checked="functionalEnabled" />
            </div>
          </div>

          <!-- Analytics Cookies -->
          <div class="rounded-xl border border-border/30 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h4 class="font-medium text-foreground">
                  {{ t('cookies.categories.analytics.title') }}
                </h4>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ t('cookies.categories.analytics.description') }}
                </p>
              </div>
              <Switch v-model:checked="analyticsEnabled" />
            </div>
          </div>
        </div>

        <DialogFooter class="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            class="w-full rounded-full sm:w-auto"
            @click="acceptNecessary"
          >
            {{ t('cookies.banner.acceptNecessary') }}
          </Button>
          <Button
            class="w-full rounded-full sm:w-auto"
            @click="handleSavePreferences"
          >
            {{ t('cookies.settings.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Teleport>
</template>
