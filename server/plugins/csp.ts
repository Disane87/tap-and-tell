/**
 * Nitro plugin to set Content Security Policy headers for development.
 * This allows external resources like Google Fonts and Iconify to load properly.
 * Dynamically includes Sentry/GlitchTip domain when DSN is configured.
 */
export default defineNitroPlugin((nitroApp) => {
  // Extract Sentry/GlitchTip host from DSN for CSP connect-src
  let sentryConnectSrc = ''
  const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN

  if (dsn) {
    try {
      sentryConnectSrc = ' ' + new URL(dsn).origin
    } catch { /* invalid DSN, skip */ }
  }

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com${sentryConnectSrc}`,
      "worker-src 'self' blob:",
    ].join('; ')

    response.headers['Content-Security-Policy'] = csp
  })
})
