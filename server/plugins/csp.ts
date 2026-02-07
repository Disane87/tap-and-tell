/**
 * Nitro plugin to set Content Security Policy headers for development.
 * This allows external resources like Google Fonts and Iconify to load properly.
 * Dynamically includes Sentry/GlitchTip domains when DSN or tunnel is configured.
 */
export default defineNitroPlugin((nitroApp) => {
  // Extract Sentry/GlitchTip hosts from env vars for CSP connect-src
  const sentryHosts: string[] = []
  const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN
  const tunnel = process.env.NUXT_PUBLIC_SENTRY_TUNNEL

  if (dsn) {
    try {
      const host = new URL(dsn).origin
      sentryHosts.push(host)
    } catch { /* invalid DSN, skip */ }
  }
  if (tunnel) {
    try {
      const host = new URL(tunnel).origin
      if (!sentryHosts.includes(host)) sentryHosts.push(host)
    } catch { /* invalid tunnel URL, skip */ }
  }

  const sentryConnectSrc = sentryHosts.length ? ' ' + sentryHosts.join(' ') : ''

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
