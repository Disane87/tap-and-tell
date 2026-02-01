import { eq } from 'drizzle-orm'
import { userTwoFactor } from '~~/server/database/schema'

/**
 * GET /api/auth/2fa/status
 * Returns the 2FA status for the current user.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const db = useDrizzle()

  const rows = await db.select({
    method: userTwoFactor.method,
    enabled: userTwoFactor.enabled,
    verifiedAt: userTwoFactor.verifiedAt
  }).from(userTwoFactor)
    .where(eq(userTwoFactor.userId, user.id))

  const active = rows.find(r => r.enabled === 'true')

  return {
    success: true,
    data: {
      enabled: !!active,
      method: active?.method || null,
      verifiedAt: active?.verifiedAt?.toISOString() || null
    }
  }
})
