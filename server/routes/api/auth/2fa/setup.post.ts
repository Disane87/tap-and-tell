import { eq, and } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { userTwoFactor } from '~~/server/database/schema'

/**
 * POST /api/auth/2fa/setup
 * Initiates 2FA setup. Requires authentication.
 * Body: { method: 'totp' | 'email' }
 * Returns: For TOTP: { secret, uri } for QR code. For email: { message: 'Code sent' }
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody<{ method: 'totp' | 'email' }>(event)
  if (!body?.method || !['totp', 'email'].includes(body.method)) {
    throw createError({ statusCode: 400, message: 'Method must be "totp" or "email"' })
  }

  const db = useDb()

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

  // Generate and "send" OTP
  generateEmailOtp(user.id, user.email)

  return { success: true, data: { method: 'email', message: 'Verification code sent to your email' } }
})
