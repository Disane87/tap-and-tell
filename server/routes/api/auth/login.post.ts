import { randomBytes } from 'crypto'
import { eq, and } from 'drizzle-orm'
import { users, userTwoFactor, twoFactorTokens } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'
import { createSession, setAuthCookies } from '~~/server/utils/session'
import { generateId } from '~~/server/utils/id'
import { generateEmailOtp } from '~~/server/utils/email-otp'

/**
 * POST /api/auth/login
 * Authenticates an owner with email and password.
 * Sets HTTP-only cookies for both access token and refresh token.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const rateCheck = loginLimiter.check(ip)
  if (!rateCheck.allowed) {
    throw createError({ statusCode: 429, message: 'Too many login attempts. Please try again later.' })
  }

  const email = body.email.trim().toLowerCase()

  const lockStatus = isLocked(email)
  if (lockStatus.locked) {
    throw createError({ statusCode: 423, message: 'Account temporarily locked due to too many failed attempts' })
  }

  const db = useDrizzle()

  const rows = await db.select().from(users).where(eq(users.email, email))
  const user = rows[0]
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  // Migrated users without proper password can't log in
  if (user.passwordHash === 'migrated:no-login') {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const valid = await verifyPassword(body.password, user.passwordHash)
  if (!valid) {
    recordFailedAttempt(email)
    await recordAuditLog(event, 'auth.login_failed', { details: { email } })
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  recordSuccessfulLogin(email)

  // Check if 2FA is enabled for this user
  const tfaRows = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'true')))
  const tfa = tfaRows[0]

  if (tfa) {
    // 2FA is enabled — create a temporary token instead of a full session
    const tempToken = randomBytes(32).toString('hex')

    await db.insert(twoFactorTokens).values({
      id: generateId(),
      userId: user.id,
      token: tempToken,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })

    // If email method, send OTP now
    if (tfa.method === 'email') {
      generateEmailOtp(user.id, user.email)
    }

    return {
      success: true,
      requires2fa: true,
      data: {
        token: tempToken,
        method: tfa.method
      }
    }
  }

  const tokens = await createSession(user.id, user.email)
  setAuthCookies(event, tokens)

  await recordAuditLog(event, 'auth.login', { userId: user.id })

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      twoFactorEnabled: false
    }
  }
})
