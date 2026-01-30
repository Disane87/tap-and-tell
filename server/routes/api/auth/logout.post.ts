import { deleteSession } from '~~/server/utils/session'

/**
 * POST /api/auth/logout
 * Logs out the current user by deleting the session and clearing the auth cookie.
 */
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (token) {
    await deleteSession(token)
  }

  deleteCookie(event, 'auth_token', { path: '/' })

  return { success: true }
})
