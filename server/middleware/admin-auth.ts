import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'
import { isAdminEmail } from '~~/server/utils/beta-config'

/**
 * Server middleware that enforces admin authentication for /api/admin/* routes.
 *
 * Admin access is granted if:
 * 1. User email is in ADMIN_EMAILS environment variable, OR
 * 2. User has isAdmin flag set to true in database
 *
 * Unauthenticated users or non-admins receive a 403 Forbidden response.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only apply to /api/admin/* routes
  if (!path.startsWith('/api/admin')) {
    return
  }

  // Check if user is authenticated
  const user = event.context.user as { id: string; email: string; name: string } | undefined
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  // Check if user is admin via environment variable
  if (isAdminEmail(user.email)) {
    event.context.isAdmin = true
    return
  }

  // Check if user has isAdmin flag in database
  const db = useDrizzle()
  const dbUser = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (dbUser[0]?.isAdmin) {
    event.context.isAdmin = true
    return
  }

  throw createError({
    statusCode: 403,
    message: 'Admin access required'
  })
})
