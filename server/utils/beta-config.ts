import type { BetaMode } from '~~/server/database/schema'

/**
 * Returns the current beta mode from environment configuration.
 * Defaults to 'private' in production if not set.
 */
export function getBetaMode(): BetaMode {
  const mode = process.env.BETA_MODE as BetaMode | undefined

  if (mode && ['private', 'waitlist', 'open'].includes(mode)) {
    return mode
  }

  // Default to 'private' in production, 'open' in development
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
