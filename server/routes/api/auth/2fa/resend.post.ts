import { eq, and, gt } from 'drizzle-orm'
import { twoFactorTokens, users, userTwoFactor } from '~~/server/database/schema'
import { generateEmailOtp, canResendOtp, incrementResendCount } from '~~/server/utils/email-otp'

/**
 * POST /api/auth/2fa/resend
 * Resends the email OTP code during the 2FA login flow.
 * Body: { token: string }
 * Rate-limited: max 3 resends per token.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ token: string }>(event)
  if (!body?.token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const db = useDrizzle()

  // Look up the temporary 2FA token
  const tokenRows = await db.select().from(twoFactorTokens)
    .where(and(
      eq(twoFactorTokens.token, body.token),
      gt(twoFactorTokens.expiresAt, new Date())
    ))
  const tfToken = tokenRows[0]

  if (!tfToken) {
    throw createError({ statusCode: 401, message: 'Invalid or expired 2FA token' })
  }

  // Verify the user has email-based 2FA
  const tfaRows = await db.select().from(userTwoFactor)
    .where(and(eq(userTwoFactor.userId, tfToken.userId), eq(userTwoFactor.method, 'email')))
  const tfa = tfaRows[0]

  if (!tfa) {
    throw createError({ statusCode: 400, message: 'Email 2FA is not configured for this user' })
  }

  // Check resend rate limit
  if (!canResendOtp(tfToken.userId)) {
    throw createError({ statusCode: 429, message: 'Too many resend attempts. Please wait for the code to expire.' })
  }

  // Get user email
  const userRows = await db.select().from(users).where(eq(users.id, tfToken.userId))
  const user = userRows[0]
  if (!user) {
    throw createError({ statusCode: 500, message: 'User not found' })
  }

  // Increment resend counter and generate new OTP
  incrementResendCount(tfToken.userId)
  const locale = detectLocaleFromHeader(event)
  generateEmailOtp(user.id, user.email, locale)

  return { success: true }
})
