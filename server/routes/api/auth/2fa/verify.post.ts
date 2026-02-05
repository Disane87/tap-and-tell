import { eq, and, gt } from 'drizzle-orm'
import { userTwoFactor, twoFactorTokens, users } from '~~/server/database/schema'
import { createSession, setAuthCookies } from '~~/server/utils/session'

/**
 * POST /api/auth/2fa/verify
 * Verifies a 2FA code during login flow.
 * Body: { token: string, code: string }
 * The token is the temporary 2FA token issued after password verification.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ token: string; code: string }>(event)
  if (!body?.token || !body?.code) {
    throw createError({ statusCode: 400, message: 'Token and code are required' })
  }

  const db = useDrizzle()

  // Look up the 2FA token
  const tokenRows = await db.select().from(twoFactorTokens)
    .where(and(
      eq(twoFactorTokens.token, body.token),
      gt(twoFactorTokens.expiresAt, new Date())
    ))
  const tfToken = tokenRows[0]

  if (!tfToken) {
    throw createError({ statusCode: 401, message: 'Invalid or expired 2FA token' })
  }

  // Get user's 2FA config
  const tfaRows = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, tfToken.userId), eq(userTwoFactor.enabled, 'true')))
  const tfa = tfaRows[0]

  if (!tfa) {
    throw createError({ statusCode: 500, message: '2FA configuration not found' })
  }

  // Verify the code
  let valid = false

  if (tfa.method === 'totp' && tfa.secret) {
    valid = verifyTotp(tfa.secret, body.code)
  } else if (tfa.method === 'email') {
    valid = verifyEmailOtp(tfToken.userId, body.code)
  }

  // If not valid by primary method, try backup codes
  if (!valid && tfa.backupCodes) {
    const storedCodes = tfa.backupCodes.split(',')
    for (let i = 0; i < storedCodes.length; i++) {
      if (storedCodes[i] && await verifyPassword(body.code, storedCodes[i])) {
        // Remove used backup code
        storedCodes.splice(i, 1)
        await db.update(userTwoFactor)
          .set({ backupCodes: storedCodes.join(','), updatedAt: new Date() })
          .where(eq(userTwoFactor.id, tfa.id))
        valid = true
        break
      }
    }
  }

  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid 2FA code' })
  }

  // Delete the 2FA token (one-time use)
  await db.delete(twoFactorTokens).where(eq(twoFactorTokens.id, tfToken.id))

  // Get user info for session creation
  const userRows = await db.select().from(users).where(eq(users.id, tfToken.userId))
  const user = userRows[0]
  if (!user) {
    throw createError({ statusCode: 500, message: 'User not found' })
  }

  // Create full session
  const tokens = await createSession(user.id, user.email)
  setAuthCookies(event, tokens)

  await recordAuditLog(event, 'auth.2fa_verify', {
    userId: user.id,
    details: { method: tfa.method }
  })

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  }
})
