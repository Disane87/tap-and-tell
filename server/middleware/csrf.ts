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

  // Skip the CSRF token endpoint itself
  if (pathname === '/api/auth/csrf') {
    return
  }

  // Skip auth endpoints (login, register, 2FA verify — user has no token yet)
  if (pathname.startsWith('/api/auth/')) {
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
