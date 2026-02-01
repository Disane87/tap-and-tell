import { defineEventHandler, setCookie } from 'h3'

/**
 * GET /api/auth/csrf
 *
 * Generates a CSRF token, sets it as a cookie (readable by JavaScript),
 * and returns it in the response body.
 */
export default defineEventHandler((event) => {
  const token = generateCsrfToken()

  const isProduction = process.env.NODE_ENV === 'production'

  setCookie(event, 'csrf_token', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  })

  return { csrfToken: token }
})
