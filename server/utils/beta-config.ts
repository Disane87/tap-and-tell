import type { BetaMode } from '~~/server/database/schema'

/**
 * In-memory runtime override for beta mode.
 * Set by the SaaS layer on startup (from saas_config table)
 * and when the admin changes the config via the UI.
 * Falls back to process.env.BETA_MODE if not set.
 */
let runtimeBetaMode: BetaMode | null = null

/**
 * Sets the in-memory beta mode override.
 * Called by SaaS layer startup plugin and admin config PUT handler.
 */
export function setBetaMode(mode: BetaMode): void {
  runtimeBetaMode = mode
}

/**
 * Returns the current beta mode.
 * Priority: runtime override (from DB) > environment variable > default.
 */
export function getBetaMode(): BetaMode {
  // 1. Runtime override (set from saas_config table)
  if (runtimeBetaMode) {
    return runtimeBetaMode
  }

  // 2. Environment variable
  const mode = process.env.BETA_MODE as BetaMode | undefined
  if (mode && ['private', 'waitlist', 'open'].includes(mode)) {
    return mode
  }

  // 3. Default: 'private' in production, 'open' in development
  return process.env.NODE_ENV === 'production' ? 'private' : 'open'
}

/**
 * Checks if beta mode is enabled (not 'open').
 * When true, registration requires a valid beta invite token.
 */
export function isBetaModeEnabled(): boolean {
  return getBetaMode() !== 'open'
}

/**
 * Checks if waitlist signup is allowed.
 * Only available when BETA_MODE is 'waitlist'.
 */
export function isWaitlistOpen(): boolean {
  return getBetaMode() === 'waitlist'
}

/**
 * Returns the list of admin email addresses from environment configuration.
 */
export function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || ''
  return emails
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
}

/**
 * Checks if the given email has admin privileges.
 * Admin privileges can be granted via ADMIN_EMAILS env var or isAdmin flag in database.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}
