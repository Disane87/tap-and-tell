import { getBetaMode, isBetaModeEnabled, isWaitlistOpen } from '~~/server/utils/beta-config'

/**
 * GET /api/beta/status
 * Returns the current beta mode status.
 *
 * Public endpoint - no authentication required.
 */
export default defineEventHandler(async () => {
  return {
    betaMode: getBetaMode(),
    betaModeEnabled: isBetaModeEnabled(),
    waitlistOpen: isWaitlistOpen(),
    registrationOpen: !isBetaModeEnabled()
  }
})
