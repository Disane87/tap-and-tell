import { eq } from 'drizzle-orm'
import { users } from '~~/server/database/schema'
import { verifyPassword, hashPassword } from '~~/server/utils/password'
import { validatePasswordPolicy } from '~~/server/utils/password-policy'
import { deleteAllUserSessions, createSession, setAuthCookies } from '~~/server/utils/session'
import { recordAuditLog } from '~~/server/utils/audit'

/**
 * PUT /api/auth/password
 * Changes the current user's password.
 * Invalidates all sessions except the newly created one.
 *
 * @body {{ currentPassword: string, newPassword: string }}
 * @returns {{ success: boolean }}
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<{ currentPassword: string; newPassword: string }>(event)
  if (!body?.currentPassword || !body?.newPassword) {
    throw createError({ statusCode: 400, message: 'Current and new password required' })
  }

  const db = useDrizzle()
  const userRows = await db.select({
    id: users.id,
    email: users.email,
    passwordHash: users.passwordHash
  })
    .from(users)
    .where(eq(users.id, user.id))

  const dbUser = userRows[0]
  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Verify current password
  const isValid = await verifyPassword(body.currentPassword, dbUser.passwordHash)
  if (!isValid) {
    throw createError({ statusCode: 403, message: 'Current password is incorrect' })
  }

  // Validate new password policy
  const policyResult = validatePasswordPolicy(body.newPassword)
  if (!policyResult.valid) {
    throw createError({ statusCode: 400, message: policyResult.errors.join('. ') })
  }

  // Hash and update
  const newHash = await hashPassword(body.newPassword)
  await db.update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  // Invalidate all existing sessions
  await deleteAllUserSessions(user.id)

  // Create a new session so the user stays logged in
  const tokens = await createSession(user.id, dbUser.email)
  setAuthCookies(event, tokens)

  recordAuditLog(event, 'auth.password_change', {
    userId: user.id,
    resourceType: 'user',
    resourceId: user.id
  })

  return { success: true }
})
