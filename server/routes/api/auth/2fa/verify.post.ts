import { eq, and, gt } from 'drizzle-orm'
import { RateLimiter } from '~~/server/utils/rate-limit'
import { userTwoFactor, twoFactorTokens, users } from '~~/server/database/schema'
import { createSession, setAuthCookies } from '~~/server/utils/session'

/**
 * Attempt cap for TOTP / backup-code verification against a single temp token.
 * Mirrors the email-OTP MAX_ATTEMPTS protection so the short-lived 2FA token
 * cannot be brute-forced. Keyed by the temp token (and IP) — once exceeded the
 * temp token is destroyed and the user must restart the login flow.
 */
const verifyLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000 // matches the 5-minute temp-token lifetime
})

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

  // Enforce an attempt cap before verifying. Key by the temp-token id so the
  // cap follows the specific login attempt, plus the IP to limit distributed
  // guessing against the same token.
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const limitKey = `${tfToken.id}:${ip}`
  const rateCheck = verifyLimiter.check(limitKey)
  if (!rateCheck.allowed) {
    // Too many failed attempts: invalidate the temp token so it cannot be reused.
    await db.delete(twoFactorTokens).where(eq(twoFactorTokens.id, tfToken.id))
    throw createError({
      statusCode: 429,
      message: 'Too many invalid 2FA attempts. Please log in again.'
    })
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
      name: user.name,
      twoFactorEnabled: true
    }
  }
})
