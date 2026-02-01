/**
 * In-memory account lockout tracker.
 *
 * Tracks consecutive failed login attempts per email address and
 * automatically locks accounts for a configurable duration after
 * exceeding the failure threshold.
 *
 * NOTE: This is an in-memory implementation. A future iteration should
 * persist lockout state to the PostgreSQL `login_attempts` table so that
 * state survives server restarts and works across multiple instances.
 */

/** Lockout state stored per email address. */
interface LockoutEntry {
  /** Number of consecutive failed login attempts. */
  count: number
  /** If the account is locked, the `Date` at which the lock expires. `null` if not locked. */
  lockedUntil: Date | null
}

/** Result of an {@link isLocked} check. */
interface LockoutStatus {
  /** Whether the account is currently locked. */
  locked: boolean
  /** If locked, the `Date` at which the lock expires. */
  lockedUntil?: Date
}

/** Maximum consecutive failures before the account is locked. */
const MAX_FAILED_ATTEMPTS = 10

/** Duration (in milliseconds) for which an account is locked after exceeding the threshold. */
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

/** In-memory store keyed by lower-cased email address. */
const store: Map<string, LockoutEntry> = new Map()

/**
 * Normalise the email to a consistent map key.
 *
 * @param email - The raw email string.
 * @returns Lower-cased, trimmed email.
 */
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Record a failed login attempt for the given email address.
 *
 * If the number of consecutive failures reaches {@link MAX_FAILED_ATTEMPTS},
 * the account is locked for {@link LOCKOUT_DURATION_MS} milliseconds.
 *
 * @param email - The email address of the account.
 */
export function recordFailedAttempt(email: string): void {
  const key = normaliseEmail(email)
  const entry = store.get(key) ?? { count: 0, lockedUntil: null }

  entry.count += 1

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
  }

  store.set(key, entry)
}

/**
 * Record a successful login for the given email address.
 *
 * Resets the consecutive failure counter and removes any active lock.
 *
 * @param email - The email address of the account.
 */
export function recordSuccessfulLogin(email: string): void {
  const key = normaliseEmail(email)
  store.delete(key)
}

/**
 * Check whether the given email address is currently locked out.
 *
 * If the lock has expired the entry is automatically cleared so that
 * subsequent attempts start from a clean slate.
 *
 * @param email - The email address to check.
 * @returns An object indicating whether the account is locked and, if so,
 *          when the lock expires.
 */
export function isLocked(email: string): LockoutStatus {
  const key = normaliseEmail(email)
  const entry = store.get(key)

  if (!entry || !entry.lockedUntil) {
    return { locked: false }
  }

  // If the lock has expired, clear the entry entirely.
  if (entry.lockedUntil.getTime() <= Date.now()) {
    store.delete(key)
    return { locked: false }
  }

  return {
    locked: true,
    lockedUntil: entry.lockedUntil,
  }
}

/**
 * Remove all expired lockout entries from the in-memory store.
 *
 * This can be called periodically (e.g. via a scheduled task) to keep
 * memory usage in check. Entries that have not reached the lockout
 * threshold but have stale timestamps are **not** removed by this
 * function — only entries with an expired `lockedUntil` date.
 */
export function clearExpiredLocks(): void {
  const now = Date.now()

  for (const [key, entry] of store) {
    if (entry.lockedUntil && entry.lockedUntil.getTime() <= now) {
      store.delete(key)
    }
  }
}

/**
 * Reset the entire lockout store. Intended for testing only.
 */
export function resetLockoutStore(): void {
  store.clear()
}
