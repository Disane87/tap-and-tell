<script lang="ts" setup>
/**
 * Custom Sonner toast wrapper with glassmorphism styling.
 * Renders themed toasts with Lucide icons and backdrop-blur effects.
 */
import "vue-sonner/style.css"
import type { ToasterProps } from "vue-sonner"
import { reactiveOmit } from "@vueuse/core"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, "toastOptions")
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4 text-emerald-500" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4 text-blue-500" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4 text-amber-500" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4 text-red-500" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin text-muted-foreground" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/* Sonner Toaster Container */
[data-sonner-toaster] {
  --normal-bg: var(--color-card);
  --normal-border: var(--color-border);
  --normal-text: var(--color-foreground);
  --success-bg: var(--color-card);
  --success-border: var(--color-border);
  --success-text: var(--color-foreground);
  --error-bg: var(--color-card);
  --error-border: var(--color-border);
  --error-text: var(--color-foreground);
  --info-bg: var(--color-card);
  --info-border: var(--color-border);
  --info-text: var(--color-foreground);
  --warning-bg: var(--color-card);
  --warning-border: var(--color-border);
  --warning-text: var(--color-foreground);

  position: fixed !important;
  z-index: 99999 !important;
}

/* Individual Toast Styling - Glassmorphism */
[data-sonner-toast] {
  --border-radius: 1rem;
  background: color-mix(in srgb, var(--color-card) 85%, transparent) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid color-mix(in srgb, var(--color-border) 30%, transparent) !important;
  border-radius: 1rem !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  color: var(--color-foreground) !important;
  padding: 1rem !important;
}

/* Toast Title */
[data-sonner-toast] [data-title] {
  color: var(--color-foreground) !important;
  font-weight: 500 !important;
}

/* Toast Description */
[data-sonner-toast] [data-description] {
  color: var(--color-muted-foreground) !important;
}

/* Toast Close Button */
[data-sonner-toast] [data-close-button] {
  background: color-mix(in srgb, var(--color-muted) 50%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--color-border) 30%, transparent) !important;
  border-radius: 50% !important;
  color: var(--color-muted-foreground) !important;
}

[data-sonner-toast] [data-close-button]:hover {
  background: var(--color-muted) !important;
  color: var(--color-foreground) !important;
}

/* Action Button */
[data-sonner-toast] [data-button] {
  background: var(--color-primary) !important;
  color: var(--color-primary-foreground) !important;
  border-radius: 0.75rem !important;
  font-weight: 500 !important;
}

[data-sonner-toast] [data-button]:hover {
  opacity: 0.9;
}

/* Cancel Button */
[data-sonner-toast] [data-cancel] {
  background: var(--color-muted) !important;
  color: var(--color-muted-foreground) !important;
  border-radius: 0.75rem !important;
}

/* Dark Mode Adjustments */
.dark [data-sonner-toast] {
  background: color-mix(in srgb, var(--color-card) 80%, transparent) !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
}
</style>
