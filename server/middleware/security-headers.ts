/**
 * Security headers middleware.
 *
 * Sets standard security headers on every response to mitigate common
 * web vulnerabilities (clickjacking, MIME-sniffing, XSS, etc.).
 *
 * - HSTS is only enabled in production to avoid issues with self-signed dev certs.
 * - CSP allows inline scripts/styles required by Nuxt SPA mode and Tailwind,
 *   data:/blob: URIs for base64-encoded photos and camera captures,
 *   and Google Fonts for font loading.
 */
export default defineEventHandler((event) => {
  // Only set headers, don't return anything (pass-through middleware)
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })

  // HSTS only in production
  if (process.env.NODE_ENV === 'production') {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // CSP - allow self, inline styles (for Tailwind), fonts from Google, and data: URIs for images
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",  // unsafe-inline needed for Nuxt SPA
    "style-src 'self' 'unsafe-inline'",   // needed for Tailwind
    "img-src 'self' data: blob:",          // data: for base64 photos, blob: for camera
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  setResponseHeader(event, 'Content-Security-Policy', csp)
})
