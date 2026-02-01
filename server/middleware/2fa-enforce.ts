import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { userTwoFactor } from '~~/server/database/schema'

/**
 * Middleware that enforces 2FA setup for authenticated users accessing admin routes.
 * Users without 2FA are blocked from tenant management and admin endpoints.
 * Allows access to auth routes (login, register, 2FA setup) and public routes.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) return // Not authenticated, let other middleware handle it

  // API token-authenticated requests bypass 2FA (2FA was verified at app creation time)
  if (event.context.apiApp) return

  const path = getRequestURL(event).pathname

  // Allow auth-related routes (including 2FA setup)
  if (path.startsWith('/api/auth/')) return

  // Allow public guest routes
  if (path.startsWith('/api/t/')) return

  // Allow legacy admin routes (they have their own auth)
  if (path.startsWith('/api/admin/')) return

  // For all authenticated admin routes (/api/tenants/*, etc.), check 2FA
  if (path.startsWith('/api/tenants') || path.startsWith('/api/entries')) {
    const db = useDb()
    const tfaRows = await db.select().from(userTwoFactor)
      .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'true')))

    if (!tfaRows[0]) {
      throw createError({
        statusCode: 403,
        message: 'Two-factor authentication is required. Please set up 2FA in your security settings.'
      })
    }
  }
})
