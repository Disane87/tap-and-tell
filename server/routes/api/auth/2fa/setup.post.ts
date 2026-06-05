import { eq, and } from 'drizzle-orm'
import { userTwoFactor, users } from '~~/server/database/schema'
import { verifyPassword } from '~~/server/utils/password'

/**
 * POST /api/auth/2fa/setup
 * Initiates 2FA setup. Requires authentication and current-password
 * re-confirmation so a hijacked session cannot silently enroll 2FA.
 * Body: { method: 'totp' | 'email', password: string }
 * Returns: For TOTP: { secret, uri } for QR code. For email: { message: 'Code sent' }
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody<{ method: 'totp' | 'email'; password: string }>(event)
  if (!body?.method || !['totp', 'email'].includes(body.method)) {
    throw createError({ statusCode: 400, message: 'Method must be "totp" or "email"' })
  }
  if (!body?.password) {
    throw createError({ statusCode: 400, message: 'Current password is required' })
  }

  const db = useDrizzle()

  // Re-confirm the current password before initiating 2FA enrollment.
  const userRows = await db.select().from(users).where(eq(users.id, user.id))
  const fullUser = userRows[0]
  if (!fullUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  const passwordValid = await verifyPassword(body.password, fullUser.passwordHash)
  if (!passwordValid) {
    throw createError({ statusCode: 401, message: 'Invalid password' })
  }

  // Check if 2FA is already enabled
  const existing = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'true')))
  if (existing[0]) {
    throw createError({ statusCode: 409, message: '2FA is already enabled. Disable it first to change method.' })
  }

  // Delete any pending (unverified) 2FA setup
  await db.delete(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, user.id), eq(userTwoFactor.enabled, 'false')))

  if (body.method === 'totp') {
    const secret = generateTotpSecret()
    const uri = generateTotpUri(secret, user.email)

    await db.insert(userTwoFactor).values({
      id: generateId(),
      userId: user.id,
      method: 'totp',
      secret,
      enabled: 'false'
    })

    return { success: true, data: { method: 'totp', secret, uri } }
  }

  // Email method
  await db.insert(userTwoFactor).values({
    id: generateId(),
    userId: user.id,
    method: 'email',
    enabled: 'false'
  })

  // Generate and "send" OTP with locale
  const locale = detectLocaleFromHeader(event)
  generateEmailOtp(user.id, user.email, locale)

  return { success: true, data: { method: 'email', message: 'Verification code sent to your email' } }
})
