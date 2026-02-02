/**
 * Client plugin that attaches the CSRF token to all mutating $fetch requests.
 *
 * Reads the token from the `csrf_token` cookie (set by GET /api/auth/csrf)
 * and sends it as the `x-csrf-token` header on POST/PUT/PATCH/DELETE requests.
 * Fetches a token on startup if none exists.
 */
export default defineNuxtPlugin(async () => {
  function getCsrfCookie(): string | undefined {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    return match?.[1]
  }

  // Fetch a CSRF token if we don't have one yet
  if (!getCsrfCookie()) {
    try {
      await $fetch('/api/auth/csrf')
    } catch {
      // Non-critical — requests will fail with 403 if token is missing
    }
  }

  globalThis.$fetch = globalThis.$fetch.create({
    onRequest({ options }) {
      const method = (options.method || 'GET').toUpperCase()
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const token = getCsrfCookie()
        if (token) {
          const headers = new Headers(options.headers as HeadersInit | undefined)
          headers.set('x-csrf-token', token)
          options.headers = headers
        }
      }
    }
  })
})
