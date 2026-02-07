import * as Sentry from '@sentry/vue'

/**
 * Client-side Sentry/GlitchTip error tracking plugin.
 *
 * Initializes @sentry/vue when a DSN is configured via NUXT_PUBLIC_SENTRY_DSN.
 * When no DSN is set, the plugin is a no-op (safe for OSS deployments).
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn as string

  if (!dsn) return

  const router = useRouter()

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment: (config.public.sentryEnvironment as string) || (import.meta.dev ? 'development' : 'production'),
    tracesSampleRate: Number(config.public.sentryTracesSampleRate) || 0,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
    ],
  })
})
