import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { RateLimiter } from '../rate-limit'

describe('RateLimiter', () => {
  const limiters: RateLimiter[] = []

  function createLimiter(opts: { maxAttempts: number; windowMs: number; cleanupIntervalMs?: number }): RateLimiter {
    const limiter = new RateLimiter({ cleanupIntervalMs: 60_000, ...opts })
    limiters.push(limiter)
    return limiter
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    for (const l of limiters) l.dispose()
    limiters.length = 0
    vi.useRealTimers()
  })

  it('allows requests within the limit', () => {
    const limiter = createLimiter({ maxAttempts: 3, windowMs: 60_000 })
    const r1 = limiter.check('user1')
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('user1')
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = createLimiter({ maxAttempts: 2, windowMs: 60_000 })
    limiter.check('user1')
    limiter.check('user1')

    const r3 = limiter.check('user1')
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('tracks keys independently', () => {
    const limiter = createLimiter({ maxAttempts: 1, windowMs: 60_000 })
    const r1 = limiter.check('user1')
    expect(r1.allowed).toBe(true)

    const r2 = limiter.check('user2')
    expect(r2.allowed).toBe(true)

    const r3 = limiter.check('user1')
    expect(r3.allowed).toBe(false)
  })

  it('resets all tracked attempts', () => {
    const limiter = createLimiter({ maxAttempts: 1, windowMs: 60_000 })
    limiter.check('user1')
    expect(limiter.check('user1').allowed).toBe(false)

    limiter.reset()
    expect(limiter.check('user1').allowed).toBe(true)
  })

  it('returns positive resetMs', () => {
    const limiter = createLimiter({ maxAttempts: 5, windowMs: 60_000 })
    const result = limiter.check('user1')
    expect(result.resetMs).toBeGreaterThan(0)
    expect(result.resetMs).toBeLessThanOrEqual(60_000)
  })

  it('allows requests again after window expires (sliding window)', () => {
    const windowMs = 1000
    const limiter = createLimiter({ maxAttempts: 2, windowMs })

    // Use up all attempts
    limiter.check('user1')
    limiter.check('user1')
    expect(limiter.check('user1').allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1)

    // Should be allowed again
    const result = limiter.check('user1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('runs cleanup on the configured interval and removes fully expired keys', () => {
    const windowMs = 1000
    const cleanupIntervalMs = 500
    const limiter = createLimiter({ maxAttempts: 5, windowMs, cleanupIntervalMs })

    // Make some requests
    limiter.check('user1')
    limiter.check('user2')

    // Advance time past the window so all timestamps expire
    vi.advanceTimersByTime(windowMs + 1)

    // Advance to trigger cleanup interval
    vi.advanceTimersByTime(cleanupIntervalMs)

    // After cleanup, making a new request should show full remaining attempts
    // (as if the key was never tracked before)
    const result = limiter.check('user1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4) // maxAttempts - 1
  })

  it('cleanup retains valid timestamps while removing expired ones', () => {
    const windowMs = 2000
    const cleanupIntervalMs = 500
    const limiter = createLimiter({ maxAttempts: 5, windowMs, cleanupIntervalMs })

    // First request at t=0
    limiter.check('user1')

    // Advance 1 second (still within window)
    vi.advanceTimersByTime(1000)

    // Second request at t=1000
    limiter.check('user1')

    // Advance another 1.5 seconds (t=2500, first request expired, second still valid)
    vi.advanceTimersByTime(1500)

    // Trigger cleanup (at t=2500, cleanup runs)
    // First timestamp (t=0) is expired (windowStart = 2500 - 2000 = 500)
    // Second timestamp (t=1000) is still valid (1000 > 500)

    // Make another request - should see only 1 previous attempt (the one at t=1000)
    const result = limiter.check('user1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3) // maxAttempts(5) - 2 (one retained + this new one)
  })

  it('calculates resetMs based on oldest timestamp when blocked', () => {
    const windowMs = 10000
    const limiter = createLimiter({ maxAttempts: 2, windowMs })

    // First request at t=0
    limiter.check('user1')

    // Advance 1 second
    vi.advanceTimersByTime(1000)

    // Second request at t=1000
    limiter.check('user1')

    // Advance another second
    vi.advanceTimersByTime(1000)

    // Third request at t=2000 (should be blocked)
    const result = limiter.check('user1')
    expect(result.allowed).toBe(false)
    // resetMs should be based on oldest timestamp (t=0)
    // oldest(0) + window(10000) - now(2000) = 8000
    expect(result.resetMs).toBe(8000)
  })

  it('uses default cleanup interval when not specified', () => {
    // Create limiter without cleanupIntervalMs to use default (60_000)
    const limiter = new RateLimiter({ maxAttempts: 5, windowMs: 1000 })
    limiters.push(limiter)

    limiter.check('user1')

    // Advance past window
    vi.advanceTimersByTime(1001)

    // Advance to default cleanup interval (60 seconds)
    vi.advanceTimersByTime(60_000)

    // Should have cleaned up
    const result = limiter.check('user1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('cleanup handles multiple keys with mixed expiry states', () => {
    const windowMs = 2000
    const cleanupIntervalMs = 100
    const limiter = createLimiter({ maxAttempts: 5, windowMs, cleanupIntervalMs })

    // user1 request at t=0
    limiter.check('user1')

    // Advance 1500ms (t=1500)
    vi.advanceTimersByTime(1500)

    // user2 request at t=1500
    limiter.check('user2')

    // Advance 600ms (t=2100)
    // windowStart = 2100 - 2000 = 100
    // user1's timestamp (t=0) is expired (0 < 100)
    // user2's timestamp (t=1500) is valid (1500 > 100)
    vi.advanceTimersByTime(600)

    // Trigger cleanup at t=2100
    // Note: cleanup runs at intervals, so we need to hit a cleanup tick
    // cleanupIntervalMs=100, so cleanup runs at t=100, 200, ..., 2100
    // At t=2100, cleanup will:
    // - Delete user1 (all timestamps expired)
    // - Keep user2 with filtered timestamps (1500 is still > 100)

    // Now check user1 - should be fresh (was deleted by cleanup or by check's filter)
    const r1 = limiter.check('user1')
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(4) // Fresh start

    // Check user2 at same time t=2100
    // windowStart = 100, timestamp 1500 > 100, so 1 previous attempt + 1 new = 2 total
    const r2 = limiter.check('user2')
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(3) // 5 - 1 (retained) - 1 (new) = 3
  })

  it('returns windowMs as resetMs when no previous timestamps exist', () => {
    const windowMs = 5000
    const limiter = createLimiter({ maxAttempts: 5, windowMs })

    const result = limiter.check('newuser')
    expect(result.resetMs).toBe(windowMs)
  })
})
