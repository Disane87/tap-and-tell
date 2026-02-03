import { getWaitlistStatus } from '~~/server/utils/beta'

/**
 * GET /api/waitlist/status?email=xxx or GET /api/waitlist/status?code=xxx
 * Returns the waitlist status for an email or referral code.
 *
 * Query parameters:
 * - email: string (optional)
 * - code: string (optional, referral code)
 *
 * At least one of email or code must be provided.
 *
 * Public endpoint - no authentication required.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string | undefined
  const code = query.code as string | undefined

  if (!email && !code) {
    throw createError({
      statusCode: 400,
      message: 'Either email or code query parameter is required'
    })
  }

  const identifier = email || code!
  const result = await getWaitlistStatus(identifier)

  if (!result) {
    throw createError({
      statusCode: 404,
      message: 'Entry not found on waitlist'
    })
  }

  return {
    success: true,
    data: {
      position: result.entry?.position,
      totalAhead: result.totalAhead,
      status: result.entry?.status,
      referralCode: result.entry?.referralCode,
      referralCount: result.referralCount
    }
  }
})
