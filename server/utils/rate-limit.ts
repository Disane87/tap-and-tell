/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request timestamps per key (e.g. IP address or composite key)
 * and enforces configurable limits within a rolling time window.
 */

interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean
  /** Number of remaining attempts in the current window. */
  remaining: number
  /** Milliseconds until the oldest tracked attempt expires (window resets). */
  resetMs: number
}

interface RateLimiterOptions {
  /** Maximum number of attempts allowed within the window. */
  maxAttempts: number
  /** Sliding window duration in milliseconds. */
  windowMs: number
  /** Interval in milliseconds for cleaning up expired entries. Defaults to 60 000 ms (60 s). */
  cleanupIntervalMs?: number
}

/**
 * Sliding-window rate limiter backed by an in-memory `Map`.
 *
 * Each key (typically an IP address or a composite identifier) stores an
 * array of UNIX-epoch timestamps representing individual attempts. On every
 * {@link check} call the array is pruned so that only timestamps within the
 * active window remain, giving a true sliding-window behaviour.
 *
 * A periodic cleanup timer removes keys whose timestamps have all expired,
 * preventing unbounded memory growth.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })
 * const result = limiter.check('192.168.1.1')
 * if (!result.allowed) {
 *   throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
 * }
 * ```
 */
export class RateLimiter {
  private readonly maxAttempts: number
  private readonly windowMs: number
  private readonly store: Map<string, number[]> = new Map()
  private readonly cleanupTimer: ReturnType<typeof setInterval>

  constructor(options: RateLimiterOptions) {
    this.maxAttempts = options.maxAttempts
    this.windowMs = options.windowMs

    const cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)

    // Allow the Node.js process to exit even if the timer is still active.
    /* v8 ignore next 3 */
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * Record an attempt for the given key and check whether it is within limits.
   *
   * @param key - Unique identifier for the requester (e.g. IP address).
   * @returns An object indicating whether the request is allowed, how many
   *          attempts remain, and when the window resets.
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Retrieve existing timestamps and prune entries outside the window.
    let timestamps = this.store.get(key) ?? []
    timestamps = timestamps.filter((ts) => ts > windowStart)

    // Determine reset time based on the oldest remaining timestamp.
    const resetMs = timestamps.length > 0
      ? (timestamps[0]! + this.windowMs) - now
      : this.windowMs

    if (timestamps.length >= this.maxAttempts) {
      this.store.set(key, timestamps)
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      }
    }

    // Record the new attempt.
    timestamps.push(now)
    this.store.set(key, timestamps)

    return {
      allowed: true,
      remaining: this.maxAttempts - timestamps.length,
      resetMs,
    }
  }

  /**
   * Remove all entries whose timestamps have fully expired.
   * Called automatically on the configured cleanup interval.
   */
  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [key, timestamps] of this.store) {
      const valid = timestamps.filter((ts) => ts > windowStart)
      if (valid.length === 0) {
        this.store.delete(key)
      }
      else {
        this.store.set(key, valid)
      }
    }
  }

  /**
   * Stop the automatic cleanup timer. Call this during graceful shutdown
   * or in tests to prevent dangling timers.
   */
  dispose(): void {
    clearInterval(this.cleanupTimer)
  }

  /**
   * Reset all tracked attempts. Useful for testing.
   */
  reset(): void {
    this.store.clear()
  }
}

// ---------------------------------------------------------------------------
// Pre-configured limiter instances
// ---------------------------------------------------------------------------

/** Rate limiter for the login endpoint — 5 attempts per 15 minutes. */
export const loginLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

/** Rate limiter for the registration endpoint — 3 attempts per 24 hours. */
export const registerLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
})

/** Rate limiter for guest entry creation — 10 attempts per hour. */
export const entryLimiter = new RateLimiter({
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
})

/** Rate limiter for the legacy admin login endpoint — 5 attempts per 15 minutes. */
export const adminLoginLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})
