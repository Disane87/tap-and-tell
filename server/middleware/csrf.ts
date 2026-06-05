import { defineEventHandler, getMethod, getRequestURL, getHeader, createError } from 'h3'

/**
 * CSRF protection middleware using the double-submit cookie pattern.
 * Validates CSRF tokens on all mutating requests (POST, PUT, PATCH, DELETE)
 * except for explicitly excluded public endpoints.
 */
export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // Only check mutating methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return
  }

  const pathname = getRequestURL(event).pathname

  // Skip ONLY pre-auth / bootstrap auth endpoints. At these points the user has
  // no session yet (or is establishing/refreshing one), so a CSRF token may not
  // be available. Authenticated, state-changing profile/password/avatar
  // mutations (e.g. PUT /api/auth/me, PUT /api/auth/password,
  // DELETE /api/auth/me, POST/DELETE /api/auth/avatar) are intentionally NOT
  // exempted and must carry a valid CSRF token.
  const CSRF_EXEMPT_AUTH_PATHS = new Set([
    '/api/auth/csrf',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/2fa/verify',
    '/api/auth/2fa/resend',
    '/api/auth/refresh',
  ])
  if (CSRF_EXEMPT_AUTH_PATHS.has(pathname)) {
    return
  }

  // Skip public guest entry submissions (no auth, no CSRF token available)
  if (method === 'POST' && /^\/api\/g\/[^/]+\/entries\/?$/.test(pathname)) {
    return
  }
  if (method === 'POST' && /^\/api\/t\/[^/]+\/g\/[^/]+\/entries\/?$/.test(pathname)) {
    return
  }

  // Skip legacy entry creation (public endpoint)
  if (method === 'POST' && pathname === '/api/entries') {
    return
  }

  // Skip legacy admin endpoints (they use Bearer token auth)
  if (pathname.startsWith('/api/admin/')) {
    return
  }

  // Skip API token-authenticated requests (stateless Bearer auth, CSRF not applicable)
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer tat_')) {
    return
  }

  // Read token from header (do NOT read body — it consumes the stream
  // and breaks multipart uploads and subsequent handler readBody calls)
  const token = getHeader(event, 'x-csrf-token')

  if (!token || !validateCsrfToken(token)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid CSRF token',
    })
  }
})
