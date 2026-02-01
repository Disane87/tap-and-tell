import { eq } from 'drizzle-orm'
import { userTwoFactor, users } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'

/**
 * POST /api/auth/2fa/disable
 * Disables 2FA for the current user. Requires current password confirmation.
 * Body: { password: string }
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody<{ password: string }>(event)
  if (!body?.password) {
    throw createError({ statusCode: 400, message: 'Current password is required' })
  }

  const db = useDrizzle()

  // Verify password
  const userRows = await db.select().from(users).where(eq(users.id, user.id))
  const fullUser = userRows[0]
  if (!fullUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const passwordValid = await verifyPassword(body.password, fullUser.passwordHash)
  if (!passwordValid) {
    throw createError({ statusCode: 401, message: 'Invalid password' })
  }

  // Delete all 2FA records for this user
  await db.delete(userTwoFactor).where(eq(userTwoFactor.userId, user.id))

  await recordAuditLog(event, 'auth.2fa_disable', { userId: user.id })

  return { success: true, message: '2FA has been disabled' }
})
