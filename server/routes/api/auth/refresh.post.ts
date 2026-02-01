import { refreshSession } from '~~/server/utils/session'

/**
 * POST /api/auth/refresh
 * Refreshes the access token using the refresh token cookie.
 * Sets new HTTP-only cookies for both tokens (refresh token rotation).
 */
export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')
  if (!refreshToken) {
    throw createError({ statusCode: 401, message: 'No refresh token' })
  }

  const tokens = await refreshSession(refreshToken)
  if (!tokens) {
    // Clear invalid cookies
    deleteCookie(event, 'auth_token', { path: '/' })
    deleteCookie(event, 'refresh_token', { path: '/' })
    throw createError({ statusCode: 401, message: 'Invalid or expired refresh token' })
  }

  setCookie(event, 'auth_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes
    path: '/'
  })

  setCookie(event, 'refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })

  return { success: true }
})
