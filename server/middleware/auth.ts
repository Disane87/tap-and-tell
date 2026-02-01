import { validateAccessToken, refreshSession } from '~~/server/utils/session'

/**
 * Server middleware that reads the auth cookie and attaches the user to the event context.
 * Runs on every request but does not block unauthenticated requests.
 * Individual routes check event.context.user for authorization.
 *
 * If the access token is expired but a valid refresh token exists, the middleware
 * will automatically refresh the session and set new cookies transparently.
 */
export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'auth_token')

  // Try to validate the access token first
  if (accessToken) {
    const user = await validateAccessToken(accessToken)
    if (user) {
      event.context.user = user
      return
    }
  }

  // Access token missing or invalid/expired — try to refresh using the refresh token
  const refreshToken = getCookie(event, 'refresh_token')
  if (!refreshToken) return

  const tokens = await refreshSession(refreshToken)
  if (!tokens) return

  // Set new cookies
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

  // Validate the new access token to get user info
  const user = await validateAccessToken(tokens.accessToken)
  if (user) {
    event.context.user = user
  }
})
