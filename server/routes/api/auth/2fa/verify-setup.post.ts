import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { userTwoFactor, users } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'

/**
 * POST /api/auth/2fa/verify-setup
 * Verifies and activates 2FA setup. Requires current-password re-confirmation
 * so a hijacked session cannot silently enable 2FA.
 * Body: { code: string, password: string }
 * Returns: { backupCodes: string[] } — shown once, user must save them.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody<{ code: string; password: string }>(event)
  if (!body?.code || typeof body.code !== 'string') {
    throw createError({ statusCode: 400, message: 'Verification code is required' })
  }
  if (!body?.password) {
    throw createError({ statusCode: 400, message: 'Current password is required' })
  }

  const db = useDrizzle()

  // Re-confirm the current password before activating 2FA.
  const userRows = await db.select().from(users).where(eq(users.id, user.id))
  const fullUser = userRows[0]
  if (!fullUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  const passwordValid = await verifyPassword(body.password, fullUser.passwordHash)
  if (!passwordValid) {
    throw createError({ statusCode: 401, message: 'Invalid password' })
  }

  // Find the pending 2FA setup
  const pendingRows = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'false')))
  const pending = pendingRows[0]

  if (!pending) {
    throw createError({ statusCode: 404, message: 'No pending 2FA setup found. Please initiate setup first.' })
  }

  // Verify the code
  let valid = false
  if (pending.method === 'totp' && pending.secret) {
    valid = verifyTotp(pending.secret, body.code)
  } else if (pending.method === 'email') {
    valid = verifyEmailOtp(user.id, body.code)
  }

  if (!valid) {
    throw createError({ statusCode: 400, message: 'Invalid verification code' })
  }

  // Generate 10 backup codes
  const backupCodes: string[] = []
  const hashedCodes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString('hex') // 8-character hex code
    backupCodes.push(code)
    hashedCodes.push(await hashPassword(code))
  }

  // Activate 2FA
  await db.update(userTwoFactor)
    .set({
      enabled: 'true',
      backupCodes: hashedCodes.join(','),
      verifiedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(userTwoFactor.id, pending.id))

  await recordAuditLog(event, 'auth.2fa_setup', {
    userId: user.id,
    details: { method: pending.method }
  })

  return {
    success: true,
    data: {
      method: pending.method,
      backupCodes
    }
  }
})
