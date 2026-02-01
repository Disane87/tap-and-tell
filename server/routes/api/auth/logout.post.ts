import { deleteSession } from '~~/server/utils/session'

/**
 * POST /api/auth/logout
 * Logs out the current user by deleting the session and clearing both auth cookies.
 */
export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')

  if (refreshToken) {
    await deleteSession(refreshToken)
  }

  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'refresh_token', { path: '/' })

  await recordAuditLog(event, 'auth.logout', {})

  return { success: true }
})
