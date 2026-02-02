<script setup lang="ts">
/**
 * Custom error page for Nuxt.
 * Handles 404, 500, and other HTTP errors with glassmorphism design.
 *
 * Note: This component is rendered outside the app component tree,
 * so i18n must be accessed via useNuxtApp().$i18n.
 */
import { FileQuestion, AlertTriangle, Home } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    message?: string
    statusMessage?: string
  }
}>()

const { $i18n } = useNuxtApp()
const t = $i18n.t

const is404 = computed(() => props.error.statusCode === 404)

function handleGoHome(): void {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div
      class="w-full max-w-md rounded-2xl border border-border/20 bg-card/70 p-8 text-center shadow-xl backdrop-blur-xl"
    >
      <div
        class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        :class="is404 ? 'bg-amber-500/10' : 'bg-destructive/10'"
      >
        <FileQuestion v-if="is404" class="h-8 w-8 text-amber-500" />
        <AlertTriangle v-else class="h-8 w-8 text-destructive" />
      </div>

      <h1 class="mb-2 text-4xl font-bold text-foreground">
        {{ error.statusCode }}
      </h1>

      <p class="mb-6 text-muted-foreground">
        {{ is404 ? t('error.notFound') : t('error.serverError') }}
      </p>

      <Button class="w-full" @click="handleGoHome">
        <Home class="mr-2 h-4 w-4" />
        {{ t('error.backHome') }}
      </Button>
    </div>
  </div>
</template>
