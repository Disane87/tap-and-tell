import * as Sentry from '@sentry/node'

/**
 * Server-side Sentry/GlitchTip error tracking plugin.
 *
 * Named `aa-sentry` to run first alphabetically (before csp, database, etc.)
 * so it can capture errors from all subsequent server plugins.
 *
 * When no DSN is set via NUXT_PUBLIC_SENTRY_DSN, the plugin is a no-op.
 */
export default defineNitroPlugin((nitroApp) => {
  const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN

  if (!dsn) return

  Sentry.init({
    dsn,
    environment: process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    tracesSampleRate: Number(process.env.NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE) || 0,
  })

  nitroApp.hooks.hook('error', (error) => {
    Sentry.captureException(error)
  })
})
