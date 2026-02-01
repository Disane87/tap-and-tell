import { validateAccessToken, refreshSession } from '~~/server/utils/session'
import { isApiToken, validateApiToken } from '~~/server/utils/api-token'

/**
 * Server middleware that handles authentication for every request.
 *
 * Supports two authentication methods:
 * 1. **Cookie auth** (browser sessions): Reads `auth_token` cookie, validates JWT,
 *    auto-refreshes via `refresh_token` if expired. Sets `event.context.user`.
 * 2. **Bearer token auth** (API apps): Reads `Authorization: Bearer tat_...` header,
 *    validates against `api_tokens` table. Sets `event.context.apiApp` with scopes
 *    and `event.context.user` with the app owner's info.
 *
 * Does not block unauthenticated requests — individual routes check for auth.
 */
export default defineEventHandler(async (event) => {
  // ── Check for API token in Authorization header ──
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    if (isApiToken(token)) {
      const apiContext = await validateApiToken(token)
      if (apiContext) {
        event.context.apiApp = apiContext
        // Also set a minimal user context so routes that check event.context.user work
        event.context.user = {
          id: apiContext.userId,
          email: '', // Not needed for API token auth
          name: `API: ${apiContext.appName}`
        }
      }
      return
    }
  }

  // ── Cookie-based auth ──
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
