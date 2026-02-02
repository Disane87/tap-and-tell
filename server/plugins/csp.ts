/**
 * Nitro plugin to set Content Security Policy headers for development.
 * This allows external resources like Google Fonts and Iconify to load properly.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
      "worker-src 'self' blob:",
    ].join('; ')

    response.headers['Content-Security-Policy'] = csp
  })
})
