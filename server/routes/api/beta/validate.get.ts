import { validateBetaInvite } from '~~/server/utils/beta'
import { getBetaMode, isBetaModeEnabled } from '~~/server/utils/beta-config'

/**
 * GET /api/beta/validate?token=xxx
 * Validates a beta invite token and returns its status.
 *
 * Public endpoint - no authentication required.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string | undefined

  // Return beta mode status if no token provided
  if (!token) {
    return {
      betaMode: getBetaMode(),
      betaModeEnabled: isBetaModeEnabled(),
      valid: false,
      error: 'No token provided'
    }
  }

  const invite = await validateBetaInvite(token)

  if (!invite) {
    return {
      betaMode: getBetaMode(),
      betaModeEnabled: isBetaModeEnabled(),
      valid: false,
      error: 'Invalid or expired invite token'
    }
  }

  return {
    betaMode: getBetaMode(),
    betaModeEnabled: isBetaModeEnabled(),
    valid: true,
    email: invite.email,
    grantedPlan: invite.grantedPlan,
    isFounder: invite.isFounder,
    expiresAt: invite.expiresAt.toISOString()
  }
})
