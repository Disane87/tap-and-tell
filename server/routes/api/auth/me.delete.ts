import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'
import { deleteAllUserSessions } from '~~/server/utils/session'
import { recordAuditLog } from '~~/server/utils/audit'

/**
 * DELETE /api/auth/me
 * Deletes the current user's account and all associated data.
 * Requires password confirmation.
 *
 * @body {{ password: string }}
 * @returns {{ success: boolean }}
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<{ password: string }>(event)
  if (!body?.password) {
    throw createError({ statusCode: 400, message: 'Password confirmation required' })
  }

  const db = useDrizzle()
  const userRows = await db.select({
    id: users.id,
    passwordHash: users.passwordHash
  })
    .from(users)
    .where(eq(users.id, user.id))

  const dbUser = userRows[0]
  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Verify password
  const isValid = await verifyPassword(body.password, dbUser.passwordHash)
  if (!isValid) {
    throw createError({ statusCode: 403, message: 'Incorrect password' })
  }

  // Audit log before deletion (user_id will be set to null via ON DELETE SET NULL)
  recordAuditLog(event, 'auth.account_delete', {
    userId: user.id,
    resourceType: 'user',
    resourceId: user.id,
    details: { email: user.email }
  })

  // Delete all sessions first
  await deleteAllUserSessions(user.id)

  // Delete user (cascades to tenants, guestbooks, entries, etc.)
  await db.delete(users).where(eq(users.id, user.id))

  // Clear cookies
  deleteCookie(event, 'auth_token')
  deleteCookie(event, 'refresh_token')

  return { success: true }
})
