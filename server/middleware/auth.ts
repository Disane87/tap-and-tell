import { validateSession } from '~~/server/utils/session'

/**
 * Server middleware that reads the auth cookie and attaches the user to the event context.
 * Runs on every request but does not block unauthenticated requests.
 * Individual routes check event.context.user for authorization.
 */
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) return

  const user = await validateSession(token)
  if (user) {
    event.context.user = user
  }
})
